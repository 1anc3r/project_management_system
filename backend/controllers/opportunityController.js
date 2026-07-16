/**
 * 商机控制器
 * 处理商机的CRUD操作
 */
const { query, transaction } = require('../config/db');
const xlsx = require('xlsx');
const moment = require('moment');
const { formatDate } = require('../utils/dateHelper');
const { sortAttachmentsByType } = require('../utils/sortHelper');
const { OPPORTUNITY_STAGES, OPPORTUNITY_INTEREST_LEVELS } = require('../config/const');

// 从字典表获取商机阶段
const getOpportunityStagesFromDB = async () => {
  try {
    const items = await query(
      `SELECT di.item_name 
       FROM dictionary_items di
       JOIN dictionaries d ON di.dict_id = d.id
       WHERE d.dict_code = 'opportunity_stage' AND di.status = 1 AND d.status = 1
       ORDER BY di.sort_order ASC`
    );
    return items.map(item => item.item_name);
  } catch (error) {
    console.error('获取商机阶段失败:', error);
    return OPPORTUNITY_STAGES;
  }
};

// 验证商机阶段
const validateOpportunityStage = async (stage) => {
  const stages = await getOpportunityStagesFromDB();
  return stages.includes(stage);
};

// 从字典表获取意向等级
const getInterestLevelsFromDB = async () => {
  try {
    const items = await query(
      `SELECT di.item_name 
       FROM dictionary_items di
       JOIN dictionaries d ON di.dict_id = d.id
       WHERE d.dict_code = 'opportunity_interest' AND di.status = 1 AND d.status = 1
       ORDER BY di.sort_order ASC`
    );
    return items.map(item => item.item_name);
  } catch (error) {
    console.error('获取意向等级失败:', error);
    return OPPORTUNITY_INTEREST_LEVELS;
  }
};

// 验证意向等级
const validateInterestLevel = async (interest) => {
  const levels = await getInterestLevelsFromDB();
  return levels.includes(interest);
};

/**
 * 获取商机列表
 * GET /api/opportunities
 */
const getOpportunities = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      stage,
      interest,
      sortField,
      sortOrder = 'desc',
      partnerId
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, parseInt(pageSize) || 20);
    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;
    const user = req.user;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 权限控制
    if (user.role === 'normal') {
      whereClause += ' AND o.created_by = ?';
      params.push(user.userId);
    }

    // 关键词搜索
    if (keyword) {
      whereClause += ` AND (o.name LIKE ? OR par.name LIKE ? OR o.source LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    // 阶段筛选
    if (stage) {
      whereClause += ' AND o.stage = ?';
      params.push(stage);
    }

    // 意向等级筛选
    if (interest) {
      whereClause += ' AND o.interest = ?';
      params.push(interest);
    }

    // 合作方筛选
    if (partnerId) {
      whereClause += ' AND o.partner_id = ?';
      params.push(partnerId);
    }

    // 排序
    let orderClause = 'ORDER BY o.estimated_date DESC';
    const allowedSortFields = ['stage', 'interest', 'estimated_amount', 'estimated_date', 'created_at'];
    if (sortField && allowedSortFields.includes(sortField)) {
      const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
      orderClause = sortField === 'stage' || sortField === 'interest'
        ? `ORDER BY CONVERT(o.${sortField} USING gbk) ${order}`
        : `ORDER BY o.${sortField} ${order}`;
    }

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM opportunities o 
       LEFT JOIN partners par ON o.partner_id = par.id ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询数据
    const opportunities = await query(
      `SELECT 
        o.id, o.name, o.source, o.stage, o.interest,
        o.estimated_amount, o.estimated_date,
        o.created_at, o.updated_at,
        o.partner_id, par.name as partner_name,
        (SELECT pc.name FROM partner_contacts pc WHERE pc.partner_id = par.id ORDER BY pc.id ASC LIMIT 1) as partner_contact,
        (SELECT pc.phone FROM partner_contacts pc WHERE pc.partner_id = par.id ORDER BY pc.id ASC LIMIT 1) as partner_contact_phone,
        o.created_by, u.nickname as creator_name
      FROM opportunities o
      LEFT JOIN partners par ON o.partner_id = par.id
      LEFT JOIN users u ON o.created_by = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      code: 200,
      data: {
        list: opportunities,
        pagination: {
          page: pageNum,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取商机列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取商机列表失败'
    });
  }
};

/**
 * 获取商机详情
 * GET /api/opportunities/:id
 */
const getOpportunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const opportunities = await query(
      `SELECT 
        o.*,
        par.id as partner_id, par.name as partner_name, par.type as partner_type, par.tax_id as partner_tax_id,
        par.address as partner_address, par.bank as partner_bank, par.bank_account as partner_bank_account,
        (SELECT pc.name FROM partner_contacts pc WHERE pc.partner_id = par.id ORDER BY pc.id ASC LIMIT 1) as partner_contact,
        (SELECT pc.phone FROM partner_contacts pc WHERE pc.partner_id = par.id ORDER BY pc.id ASC LIMIT 1) as partner_contact_phone,
        o.created_by, u.nickname as creator_name
      FROM opportunities o
      LEFT JOIN partners par ON o.partner_id = par.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = ?`,
      [id]
    );

    if (opportunities.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '商机不存在'
      });
    }

    const opportunity = opportunities[0];

    // 权限检查
    if (user.role === 'normal' && opportunity.created_by !== user.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权访问此商机'
      });
    }

    // 查询附件信息
    const attachments = await query(
      `SELECT id, opportunity_id, attachment_type, file_path, file_name, file_size, created_at 
       FROM attachments WHERE opportunity_id = ? ORDER BY attachment_type DESC`,
      [id]
    );

    opportunity.attachments = sortAttachmentsByType(attachments);

    res.json({
      code: 200,
      data: opportunity
    });
  } catch (error) {
    console.error('获取商机详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取商机详情失败'
    });
  }
};

/**
 * 创建商机
 * POST /api/opportunities
 */
const createOpportunity = async (req, res) => {
  try {
    const {
      name,
      source,
      stage,
      interest,
      estimated_amount,
      estimated_date,
      partner_id
    } = req.body;

    // 参数验证
    if (!name || !partner_id) {
      return res.status(400).json({
        code: 400,
        message: '请填写必填字段（商机名称、合作方）'
      });
    }

    // 验证商机阶段
    if (stage) {
      const isValid = await validateOpportunityStage(stage);
      if (!isValid) {
        return res.status(400).json({
          code: 400,
          message: '无效的商机阶段'
        });
      }
    }

    // 验证意向等级
    if (interest) {
      const isValid = await validateInterestLevel(interest);
      if (!isValid) {
        return res.status(400).json({
          code: 400,
          message: '无效的意向等级'
        });
      }
    }

    const result = await query(
      `INSERT INTO opportunities 
       (name, source, stage, interest, estimated_amount, estimated_date, partner_id, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        source || '',
        stage || '初步接触',
        interest || '未知',
        parseFloat(estimated_amount) || 0,
        formatDate(estimated_date),
        partner_id,
        req.user.userId
      ]
    );

    res.status(201).json({
      code: 201,
      message: '商机创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建商机错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建商机失败'
    });
  }
};

/**
 * 更新商机
 * PUT /api/opportunities/:id
 */
const updateOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      source,
      stage,
      interest,
      estimated_amount,
      estimated_date,
      partner_id
    } = req.body;

    const user = req.user;

    // 查询原商机
    const existingOpportunities = await query(
      'SELECT created_by FROM opportunities WHERE id = ?',
      [id]
    );

    if (existingOpportunities.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '商机不存在'
      });
    }

    // 权限检查
    if (user.role === 'normal' && existingOpportunities[0].created_by !== user.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权修改此商机'
      });
    }

    // 验证商机阶段
    if (stage) {
      const isValid = await validateOpportunityStage(stage);
      if (!isValid) {
        return res.status(400).json({
          code: 400,
          message: '无效的商机阶段'
        });
      }
    }

    // 验证意向等级
    if (interest) {
      const isValid = await validateInterestLevel(interest);
      if (!isValid) {
        return res.status(400).json({
          code: 400,
          message: '无效的意向等级'
        });
      }
    }

    await query(
      `UPDATE opportunities SET 
        name = ?, source = ?, stage = ?, interest = ?,
        estimated_amount = ?, estimated_date = ?, partner_id = ?
       WHERE id = ?`,
      [
        name,
        source || '',
        stage || '初步接触',
        interest || '未知',
        parseFloat(estimated_amount) || 0,
        formatDate(estimated_date),
        partner_id,
        id
      ]
    );

    res.json({
      code: 200,
      message: '商机更新成功',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('更新商机错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新商机失败'
    });
  }
};

/**
 * 删除商机
 * DELETE /api/opportunities/:id
 */
const deleteOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const existingOpportunities = await query(
      'SELECT created_by, name FROM opportunities WHERE id = ?',
      [id]
    );

    if (existingOpportunities.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '商机不存在'
      });
    }

    // 权限检查
    if (user.role === 'normal' && existingOpportunities[0].created_by !== user.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权删除此商机'
      });
    }

    // 删除商机（关联的附件会通过外键级联删除或置空）
    await query('DELETE FROM opportunities WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: '商机删除成功',
      data: { id: parseInt(id), name: existingOpportunities[0].name }
    });
  } catch (error) {
    console.error('删除商机错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除商机失败'
    });
  }
};

/**
 * 导出商机
 * GET /api/opportunities/export
 */
const exportOpportunities = async (req, res) => {
  try {
    const { keyword, stage, interest } = req.query;
    const user = req.user;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (user.role === 'normal') {
      whereClause += ' AND o.created_by = ?';
      params.push(user.userId);
    }

    if (keyword) {
      whereClause += ` AND (o.name LIKE ? OR par.name LIKE ? OR o.source LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    if (stage) {
      whereClause += ' AND o.stage = ?';
      params.push(stage);
    }

    if (interest) {
      whereClause += ' AND o.interest = ?';
      params.push(interest);
    }

    // 查询所有数据（不分页）
    const opportunities = await query(
      `SELECT 
        o.name AS '商机名称',
        o.source AS '商机来源',
        o.stage AS '商机阶段',
        o.interest AS '意向等级',
        o.estimated_amount AS '预计金额(万元)',
        o.estimated_date AS '预计成交日期',
        par.name AS '合作方名称',
        (SELECT pc.name FROM partner_contacts pc WHERE pc.partner_id = par.id ORDER BY pc.id ASC LIMIT 1) AS '联系人',
        (SELECT pc.phone FROM partner_contacts pc WHERE pc.partner_id = par.id ORDER BY pc.id ASC LIMIT 1) AS '联系电话',
        o.created_at AS '创建时间',
        o.updated_at AS '更新时间'
      FROM opportunities o
      LEFT JOIN partners par ON o.partner_id = par.id
      ${whereClause}
      ORDER BY o.created_at DESC`,
      params
    );

    // 生成 Excel
    const ws = xlsx.utils.json_to_sheet(opportunities);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, '商机列表');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=opportunities_${moment().format('YYYYMMDD')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('导出商机错误:', error);
    res.status(500).json({
      code: 500,
      message: '导出商机失败'
    });
  }
};

/**
 * 获取筛选选项
 * GET /api/opportunities/filters
 */
const getFilterOptions = async (req, res) => {
  try {
    const getDictItems = async (dictCode) => {
      const items = await query(
        `SELECT di.item_name 
         FROM dictionary_items di
         JOIN dictionaries d ON di.dict_id = d.id
         WHERE d.dict_code = ? AND di.status = 1 AND d.status = 1
         ORDER BY di.sort_order ASC`,
        [dictCode]
      );
      return items.map(item => item.item_name);
    };

    const [stages, interests, attachmentTypes] = await Promise.all([
      getDictItems('opportunity_stage'),
      getDictItems('opportunity_interest'),
      getDictItems('attachment_type')
    ]);

    res.json({
      code: 200,
      data: {
        stages,
        interests,
        attachmentTypes
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

module.exports = {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  exportOpportunities,
  getFilterOptions
};
