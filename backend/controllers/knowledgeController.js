/**
 * 知识库控制器
 * 功能：知识条目的增删改查、搜索、导入导出、附件管理
 */
const { query, transaction } = require('../config/db');
const xlsx = require('xlsx');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const { convertToCSV, parseCSV } = require('../utils/csvHelper');

/**
 * 去除HTML标签，获取纯文本
 * @param {string} html - HTML字符串
 * @returns {string} 纯文本
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * 获取知识库列表（支持分页/筛选/搜索/排序）
 * GET /api/knowledge
 */
const getKnowledges = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      category,
      tags,
      sortBy,
      sortOrder = 'desc',
      createdBy
    } = req.query;

    const user = req.user;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, parseInt(pageSize) || 20);
    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 关键词搜索（使用全文索引）
    if (keyword) {
      whereClause += ` AND (MATCH(k.question) AGAINST(? IN BOOLEAN MODE) OR MATCH(k.answer) AGAINST(? IN BOOLEAN MODE) OR k.question LIKE ? OR k.answer LIKE ?)`;
      params.push(keyword, keyword, `%${keyword}%`, `%${keyword}%`);
    }

    // 分类筛选
    if (category) {
      whereClause += ' AND k.category = ?';
      params.push(category);
    }

    // 标签筛选
    if (tags) {
      const tagList = tags.split(',');
      const tagConditions = tagList.map(() => `FIND_IN_SET(?, k.tags)`).join(' OR ');
      whereClause += ` AND (${tagConditions})`;
      params.push(...tagList);
    }

    // 创建人筛选（仅管理员可见）
    if (createdBy && user.role === 'admin') {
      whereClause += ' AND k.created_by = ?';
      params.push(createdBy);
    }

    // 排序
    let orderClause = 'ORDER BY k.created_at DESC';
    const allowedSortFields = ['created_at', 'updated_at', 'view_count'];
    if (sortBy && allowedSortFields.includes(sortBy)) {
      const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
      orderClause = `ORDER BY k.${sortBy} ${order}`;
    }

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM knowledge k ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询数据
    const list = await query(
      `SELECT 
        k.id,
        k.question,
        SUBSTRING(k.answer, 1, 500) as answer_preview,
        k.category,
        k.tags,
        k.view_count,
        k.created_by,
        u.nickname as created_by_name,
        k.created_at,
        k.updated_at,
        (SELECT COUNT(*) FROM attachments a WHERE a.knowledge_id = k.id) as attachment_count
      FROM knowledge k
      LEFT JOIN users u ON k.created_by = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // 获取筛选选项
    const categories = await query(
      `SELECT di.item_name 
       FROM dictionary_items di
       JOIN dictionaries d ON di.dict_id = d.id
       WHERE d.dict_code = 'knowledge_category' AND di.status = 1 AND d.status = 1
       ORDER BY di.sort_order ASC`
    );

    // 获取热门标签（出现频率最高的前20个）
    const hotTagsResult = await query(
      `SELECT tags FROM knowledge WHERE tags IS NOT NULL AND tags != ''`
    );
    const tagCountMap = {};
    hotTagsResult.forEach(row => {
      if (row.tags) {
        row.tags.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) {
            tagCountMap[trimmed] = (tagCountMap[trimmed] || 0) + 1;
          }
        });
      }
    });
    const hotTags = Object.entries(tagCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name]) => name);

    res.json({
      code: 200,
      data: {
        list,
        pagination: {
          page: pageNum,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          categories: categories.map(c => c.item_name),
          hotTags
        }
      }
    });
  } catch (error) {
    console.error('获取知识库列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取知识库列表失败'
    });
  }
};

/**
 * 获取知识详情
 * GET /api/knowledge/:id
 */
const getKnowledgeById = async (req, res) => {
  try {
    const { id } = req.params;

    // 查询知识基本信息
    const knowledgeItems = await query(
      `SELECT 
        k.id,
        k.question,
        k.answer,
        k.category,
        k.tags,
        k.view_count,
        k.created_by,
        u.nickname as created_by_name,
        k.created_at,
        k.updated_at
      FROM knowledge k
      LEFT JOIN users u ON k.created_by = u.id
      WHERE k.id = ?`,
      [id]
    );

    if (knowledgeItems.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '知识条目不存在'
      });
    }

    const knowledge = knowledgeItems[0];

    // 查询附件信息
    const attachments = await query(
      `SELECT 
        id, 
        file_name, 
        file_path, 
        file_size, 
        attachment_type, 
        created_at as uploaded_at
      FROM attachments 
      WHERE knowledge_id = ? 
      ORDER BY created_at DESC`,
      [id]
    );

    // 格式化附件数据
    const formattedAttachments = attachments.map(att => ({
      ...att,
      fileSizeText: formatFileSize(att.file_size)
    }));

    // 转换tags为数组
    const tagsArray = knowledge.tags ? knowledge.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    res.json({
      code: 200,
      data: {
        ...knowledge,
        tags: tagsArray,
        attachments: formattedAttachments
      }
    });
  } catch (error) {
    console.error('获取知识详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取知识详情失败'
    });
  }
};

/**
 * 创建知识条目
 * POST /api/knowledge
 */
const createKnowledge = async (req, res) => {
  try {
    const {
      question,
      answer,
      category,
      tags,
      attachmentIds
    } = req.body;

    // 参数验证
    if (!question || question.trim().length < 2) {
      return res.status(400).json({
        code: 400,
        message: '标题必填，最少2个字符'
      });
    }

    if (!answer || stripHtml(answer).length < 2) {
      return res.status(400).json({
        code: 400,
        message: '内容必填，最少2个字符'
      });
    }

    if (!category) {
      return res.status(400).json({
        code: 400,
        message: '请选择分类'
      });
    }

    // 验证标题长度
    if (question.length > 500) {
      return res.status(400).json({
        code: 400,
        message: '标题最多500个字符'
      });
    }

    // 处理标签
    let tagsStr = '';
    if (tags) {
      if (Array.isArray(tags)) {
        // 验证标签长度和数量
        const validTags = tags.map(t => t.trim()).filter(t => t.length <= 20).slice(0, 10);
        tagsStr = validTags.join(',');
      } else if (typeof tags === 'string') {
        const tagArr = tags.split(',').map(t => t.trim()).filter(t => t.length <= 20).slice(0, 10);
        tagsStr = tagArr.join(',');
      }
    }

    const result = await transaction(async (connection) => {
      // 创建知识条目
      const [insertResult] = await connection.execute(
        `INSERT INTO knowledge 
         (question, answer, category, tags, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          question.trim(),
          answer,
          category,
          tagsStr || null,
          req.user.userId
        ]
      );

      const knowledgeId = insertResult.insertId;

      // 关联附件
      if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0) {
        for (const attId of attachmentIds) {
          await connection.execute(
            'UPDATE attachments SET knowledge_id = ? WHERE id = ? AND knowledge_id IS NULL',
            [knowledgeId, attId]
          );
        }
      }

      return knowledgeId;
    });

    res.status(201).json({
      code: 201,
      message: '知识条目创建成功',
      data: { id: result }
    });
  } catch (error) {
    console.error('创建知识条目错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建知识条目失败'
    });
  }
};

/**
 * 更新知识条目
 * PUT /api/knowledge/:id
 */
const updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      question,
      answer,
      category,
      tags,
      attachmentIds
    } = req.body;

    const user = req.user;

    // 查询原知识条目
    const existingItems = await query(
      'SELECT created_by FROM knowledge WHERE id = ?',
      [id]
    );

    if (existingItems.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '知识条目不存在'
      });
    }

    // 权限检查：普通用户只能修改自己创建的知识
    if (user.role === 'normal' && existingItems[0].created_by !== user.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权修改此知识条目'
      });
    }

    // 参数验证
    if (!question || question.trim().length < 2) {
      return res.status(400).json({
        code: 400,
        message: '标题必填，最少2个字符'
      });
    }

    if (!answer || stripHtml(answer).length < 2) {
      return res.status(400).json({
        code: 400,
        message: '内容必填，最少2个字符'
      });
    }

    if (!category) {
      return res.status(400).json({
        code: 400,
        message: '请选择分类'
      });
    }

    if (question.length > 500) {
      return res.status(400).json({
        code: 400,
        message: '标题最多500个字符'
      });
    }

    // 处理标签
    let tagsStr = '';
    if (tags) {
      if (Array.isArray(tags)) {
        const validTags = tags.map(t => t.trim()).filter(t => t.length <= 20).slice(0, 10);
        tagsStr = validTags.join(',');
      } else if (typeof tags === 'string') {
        const tagArr = tags.split(',').map(t => t.trim()).filter(t => t.length <= 20).slice(0, 10);
        tagsStr = tagArr.join(',');
      }
    }

    await transaction(async (connection) => {
      // 更新知识条目
      await connection.execute(
        `UPDATE knowledge SET 
          question = ?, answer = ?, category = ?, tags = ?
         WHERE id = ?`,
        [
          question.trim(),
          answer,
          category,
          tagsStr || null,
          id
        ]
      );

      // 更新附件关联：先清除旧关联，再建立新关联
      await connection.execute(
        'UPDATE attachments SET knowledge_id = NULL WHERE knowledge_id = ?',
        [id]
      );

      if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0) {
        for (const attId of attachmentIds) {
          await connection.execute(
            'UPDATE attachments SET knowledge_id = ? WHERE id = ?',
            [id, attId]
          );
        }
      }
    });

    res.json({
      code: 200,
      message: '知识条目更新成功',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('更新知识条目错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新知识条目失败'
    });
  }
};

/**
 * 删除知识条目
 * DELETE /api/knowledge/:id
 */
const deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 查询原知识条目
    const existingItems = await query(
      'SELECT created_by, question FROM knowledge WHERE id = ?',
      [id]
    );

    if (existingItems.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '知识条目不存在'
      });
    }

    // 权限检查
    if (user.role === 'normal' && existingItems[0].created_by !== user.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权删除此知识条目'
      });
    }

    // 删除知识条目（关联的附件记录会通过外键级联更新）
    await query('DELETE FROM knowledge WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: '知识条目删除成功',
      data: { id: parseInt(id), question: existingItems[0].question }
    });
  } catch (error) {
    console.error('删除知识条目错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除知识条目失败'
    });
  }
};

/**
 * 批量删除
 * POST /api/knowledge/batch-delete
 */
const batchDeleteKnowledge = async (req, res) => {
  try {
    const { ids } = req.body;
    const user = req.user;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要删除的知识条目'
      });
    }

    // 查询这些知识条目的创建人
    const placeholders = ids.map(() => '?').join(',');
    const items = await query(
      `SELECT id, created_by, question FROM knowledge WHERE id IN (${placeholders})`,
      ids
    );

    if (items.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '知识条目不存在'
      });
    }

    // 权限检查：普通用户只能删除自己创建的
    let deletableIds = ids;
    if (user.role === 'normal') {
      deletableIds = items
        .filter(item => item.created_by === user.userId)
        .map(item => item.id);
      
      if (deletableIds.length === 0) {
        return res.status(403).json({
          code: 403,
          message: '无权删除这些知识条目'
        });
      }
    }

    const deletePlaceholders = deletableIds.map(() => '?').join(',');
    await query(
      `DELETE FROM knowledge WHERE id IN (${deletePlaceholders})`,
      deletableIds
    );

    res.json({
      code: 200,
      message: `成功删除 ${deletableIds.length} 条知识条目`,
      data: { deletedIds: deletableIds }
    });
  } catch (error) {
    console.error('批量删除知识条目错误:', error);
    res.status(500).json({
      code: 500,
      message: '批量删除知识条目失败'
    });
  }
};

/**
 * 获取筛选选项
 * GET /api/knowledge/filters
 */
const getFilterOptions = async (req, res) => {
  try {
    // 获取分类选项
    const categories = await query(
      `SELECT di.item_name 
       FROM dictionary_items di
       JOIN dictionaries d ON di.dict_id = d.id
       WHERE d.dict_code = 'knowledge_category' AND di.status = 1 AND d.status = 1
       ORDER BY di.sort_order ASC`
    );

    // 获取热门标签
    const hotTagsResult = await query(
      `SELECT tags FROM knowledge WHERE tags IS NOT NULL AND tags != ''`
    );
    const tagCountMap = {};
    hotTagsResult.forEach(row => {
      if (row.tags) {
        row.tags.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) {
            tagCountMap[trimmed] = (tagCountMap[trimmed] || 0) + 1;
          }
        });
      }
    });
    const hotTags = Object.entries(tagCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name]) => name);

    res.json({
      code: 200,
      data: {
        categories: categories.map(c => c.item_name),
        hotTags
      }
    });
  } catch (error) {
    console.error('获取筛选选项错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取筛选选项失败'
    });
  }
};

/**
 * 导出知识库
 * GET /api/knowledge/export
 */
const exportKnowledge = async (req, res) => {
  try {
    const { format = 'xlsx', ids, keyword, category, tags } = req.query;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 指定导出ID
    if (ids) {
      const idList = ids.split(',').map(id => parseInt(id)).filter(Boolean);
      if (idList.length > 0) {
        whereClause += ` AND k.id IN (${idList.map(() => '?').join(',')})`;
        params.push(...idList);
      }
    }

    if (keyword) {
      whereClause += ` AND (MATCH(k.question) AGAINST(? IN BOOLEAN MODE) OR MATCH(k.answer) AGAINST(? IN BOOLEAN MODE) OR k.question LIKE ? OR k.answer LIKE ?)`;
      params.push(keyword, keyword, `%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
      whereClause += ' AND k.category = ?';
      params.push(category);
    }

    if (tags) {
      const tagList = tags.split(',');
      const tagConditions = tagList.map(() => `FIND_IN_SET(?, k.tags)`).join(' OR ');
      whereClause += ` AND (${tagConditions})`;
      params.push(...tagList);
    }

    // 查询数据
    const data = await query(
      `SELECT 
        k.id AS 'ID',
        k.question AS '问题',
        k.answer AS '答案',
        k.category AS '分类',
        k.tags AS '标签',
        k.view_count AS '浏览次数',
        u.nickname AS '创建人',
        k.created_at AS '创建时间'
      FROM knowledge k
      LEFT JOIN users u ON k.created_by = u.id
      ${whereClause}
      ORDER BY k.created_at DESC`,
      params
    );

    // 处理答案：去除HTML标签
    const exportData = data.map(row => ({
      ...row,
      '答案': stripHtml(row['答案'])
    }));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=knowledge_${moment().format('YYYYMMDD')}.json`);
      return res.send(JSON.stringify(exportData, null, 2));
    }

    if (format === 'csv') {
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=knowledge_${moment().format('YYYYMMDD')}.csv`);
      return res.send('\uFEFF' + csv);
    }

    // 默认导出Excel
    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, '知识库');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=knowledge_${moment().format('YYYYMMDD')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('导出知识库错误:', error);
    res.status(500).json({
      code: 500,
      message: '导出知识库失败'
    });
  }
};

/**
 * 导入知识库
 * POST /api/knowledge/import
 */
const importKnowledge = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要导入的文件'
      });
    }

    let data = [];
    const filePath = req.file.path;

    try {
      // 根据文件类型解析
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      
      if (ext === 'json') {
        const content = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(content);
      } else if (ext === 'csv') {
        const content = fs.readFileSync(filePath, 'utf8');
        data = parseCSV(content);
      } else {
        // Excel
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      }

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '文件中没有数据'
        });
      }

      // 处理导入数据
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      for (const item of data) {
        try {
          // 映射字段（支持中英文列名）
          const question = item['问题'] || item.question;
          const answer = item['答案'] || item.answer;
          const category = item['分类'] || item.category;
          const tags = item['标签'] || item.tags;

          // 验证必填字段
          if (!question || !answer || !category) {
            failCount++;
            errors.push(`第 ${successCount + failCount} 条：问题、答案、分类为必填项`);
            continue;
          }

          if (question.trim().length < 2) {
            failCount++;
            errors.push(`第 ${successCount + failCount} 条：标题最少2个字符`);
            continue;
          }

          if (stripHtml(answer).length < 2) {
            failCount++;
            errors.push(`第 ${successCount + failCount} 条：内容最少2个字符`);
            continue;
          }

          // 处理标签
          let tagsStr = '';
          if (tags) {
            if (Array.isArray(tags)) {
              tagsStr = tags.map(t => t.trim()).filter(t => t.length <= 20).slice(0, 10).join(',');
            } else if (typeof tags === 'string') {
              tagsStr = tags.split(',').map(t => t.trim()).filter(t => t.length <= 20).slice(0, 10).join(',');
            }
          }

          await query(
            `INSERT INTO knowledge (question, answer, category, tags, created_by) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              question.trim(),
              answer,
              category,
              tagsStr || null,
              req.user.userId
            ]
          );
          successCount++;
        } catch (err) {
          failCount++;
          errors.push(`第 ${successCount + failCount} 条：${err.message}`);
        }
      }

      res.json({
        code: 200,
        message: `导入完成，成功 ${successCount} 条，失败 ${failCount} 条`,
        data: {
          successCount,
          failCount,
          errors: errors.slice(0, 10) // 只返回前10个错误
        }
      });
    } finally {
      // 删除临时文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('导入知识库错误:', error);
    res.status(500).json({
      code: 500,
      message: '导入知识库失败'
    });
  }
};

/**
 * 记录浏览（浏览次数+1）
 * POST /api/knowledge/:id/view
 */
const recordView = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 更新浏览次数
    await query(
      'UPDATE knowledge SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    // 记录浏览记录（如果用户已登录）
    if (user && user.userId) {
      await query(
        'INSERT INTO knowledge_views (knowledge_id, user_id) VALUES (?, ?)',
        [id, user.userId]
      );
    }

    res.json({
      code: 200,
      message: '浏览记录成功'
    });
  } catch (error) {
    console.error('记录浏览错误:', error);
    res.status(500).json({
      code: 500,
      message: '记录浏览失败'
    });
  }
};

module.exports = {
  getKnowledges,
  getKnowledgeById,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  batchDeleteKnowledge,
  getFilterOptions,
  exportKnowledge,
  importKnowledge,
  recordView
};
