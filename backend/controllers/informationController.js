/**
 * 资讯控制器
 * 处理资讯的CRUD操作及导出
 */
const { query, transaction } = require('../config/db');
const xlsx = require('xlsx');
const moment = require('moment');
const { convertToCSV } = require('../utils/csvHelper');
const { formatDate } = require('../utils/dateHelper');
const { getDictItems } = require('../utils/dictHelper');
const { parsePage, MAX_EXPORT_ROWS } = require('../utils/pagination');

/**
 * 获取资讯列表
 * GET /api/information
 */
const getInformations = async (req, res) => {
  try {
    const {
      keyword,
      partnerId,
      projectId,
      informationType,
      startDate,
      endDate,
      sortField,
      sortOrder = 'desc'
    } = req.query;

    // 解析分页参数（pageSize 上限 100）
    const { page: pageNum, pageSize: limit, offset } = parsePage(req.query);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ` AND (i.information_title LIKE ? OR i.information_content LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (partnerId) {
      whereClause += ' AND i.partner_id = ?';
      params.push(partnerId);
    }

    if (projectId) {
      whereClause += ' AND i.project_id = ?';
      params.push(projectId);
    }

    if (informationType) {
      whereClause += ' AND i.information_type = ?';
      params.push(informationType);
    }

    if (startDate) {
      whereClause += ' AND i.information_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND i.information_date <= ?';
      params.push(endDate);
    }

    let orderClause = 'ORDER BY i.information_date DESC, i.created_at DESC';
    const allowedSortFields = ['information_date', 'information_type', 'created_at'];
    if (sortField && allowedSortFields.includes(sortField)) {
      const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
      orderClause = `ORDER BY i.${sortField} ${order}`;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM information i ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 列表仅返回内容摘要（前200字符），完整内容通过详情接口获取，
    // 避免长文本导致列表接口响应体积过大
    const list = await query(
      `SELECT
        i.id,
        i.partner_id,
        i.project_id,
        i.information_date,
        i.information_type,
        i.information_title,
        SUBSTRING(i.information_content, 1, 200) as information_content,
        i.created_at,
        i.updated_at,
        par.name as partner_name,
        proj.name as project_name
      FROM information i
      LEFT JOIN partners par ON i.partner_id = par.id
      LEFT JOIN projects proj ON i.project_id = proj.id
      ${whereClause}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      code: 200,
      data: {
        list,
        pagination: {
          page: pageNum,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取资讯列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取资讯列表失败'
    });
  }
};

/**
 * 获取资讯详情
 * GET /api/information/:id
 */
const getInformationById = async (req, res) => {
  try {
    const { id } = req.params;

    const items = await query(
      `SELECT 
        i.*,
        par.name as partner_name,
        proj.name as project_name
      FROM information i
      LEFT JOIN partners par ON i.partner_id = par.id
      LEFT JOIN projects proj ON i.project_id = proj.id
      WHERE i.id = ?`,
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '资讯不存在'
      });
    }

    res.json({
      code: 200,
      data: items[0]
    });
  } catch (error) {
    console.error('获取资讯详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取资讯详情失败'
    });
  }
};

/**
 * 创建资讯
 * POST /api/information
 */
const createInformation = async (req, res) => {
  try {
    const {
      partner_id,
      project_id,
      information_date,
      information_type,
      information_title,
      information_content
    } = req.body;

    if (!information_date || !information_type || !information_title) {
      return res.status(400).json({
        code: 400,
        message: '请填写必填字段（资讯日期、资讯类型、资讯标题）'
      });
    }

    const normalizedDate = formatDate(information_date);
    if (!normalizedDate) {
      return res.status(400).json({
        code: 400,
        message: '资讯日期格式不正确'
      });
    }

    const result = await query(
      `INSERT INTO information 
       (partner_id, project_id, information_date, information_type, information_title, information_content) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        partner_id || null,
        project_id || null,
        normalizedDate,
        information_type,
        information_title,
        information_content || null
      ]
    );

    res.status(201).json({
      code: 201,
      message: '资讯创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建资讯错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建资讯失败'
    });
  }
};

/**
 * 更新资讯
 * PUT /api/information/:id
 */
const updateInformation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      partner_id,
      project_id,
      information_date,
      information_type,
      information_title,
      information_content
    } = req.body;

    const existing = await query('SELECT id FROM information WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '资讯不存在'
      });
    }

    const normalizedDate = information_date ? formatDate(information_date) : null;

    await query(
      `UPDATE information SET 
        partner_id = ?, project_id = ?, information_date = ?, 
        information_type = ?, information_title = ?, information_content = ?
       WHERE id = ?`,
      [
        partner_id || null,
        project_id || null,
        normalizedDate,
        information_type,
        information_title,
        information_content || null,
        id
      ]
    );

    res.json({
      code: 200,
      message: '资讯更新成功',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('更新资讯错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新资讯失败'
    });
  }
};

/**
 * 删除资讯
 * DELETE /api/information/:id
 */
const deleteInformation = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT information_title FROM information WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '资讯不存在'
      });
    }

    await query('DELETE FROM information WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: '资讯删除成功',
      data: { id: parseInt(id), title: existing[0].information_title }
    });
  } catch (error) {
    console.error('删除资讯错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除资讯失败'
    });
  }
};

/**
 * 获取资讯类型选项（从字典表读取）
 * GET /api/information/types
 */
const getInformationTypes = async (req, res) => {
  try {
    const items = await getDictItems('information_type');

    res.json({
      code: 200,
      data: items
    });
  } catch (error) {
    console.error('获取资讯类型错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取资讯类型失败'
    });
  }
};

/**
 * 根据合作方ID获取资讯列表
 * GET /api/information/by-partner/:partnerId
 */
const getInformationByPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const limitNum = Math.max(1, parseInt(req.query.limit) || 50);

    const list = await query(
      `SELECT 
        i.id,
        i.information_date,
        i.information_type,
        i.information_title,
        i.information_content,
        i.created_at,
        proj.name as project_name
      FROM information i
      LEFT JOIN projects proj ON i.project_id = proj.id
      WHERE i.partner_id = ?
      ORDER BY i.information_date DESC, i.created_at DESC
      LIMIT ${limitNum}`,
      [partnerId]
    );

    res.json({
      code: 200,
      data: list
    });
  } catch (error) {
    console.error('获取合作方资讯错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取合作方资讯失败'
    });
  }
};

/**
 * 根据项目ID获取资讯列表
 * GET /api/information/by-project/:projectId
 */
const getInformationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limitNum = Math.max(1, parseInt(req.query.limit) || 50);

    const list = await query(
      `SELECT 
        i.id,
        i.information_date,
        i.information_type,
        i.information_title,
        i.information_content,
        i.created_at,
        par.name as partner_name
      FROM information i
      LEFT JOIN partners par ON i.partner_id = par.id
      WHERE i.project_id = ?
      ORDER BY i.information_date DESC, i.created_at DESC
      LIMIT ${limitNum}`,
      [projectId]
    );

    res.json({
      code: 200,
      data: list
    });
  } catch (error) {
    console.error('获取项目资讯错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取项目资讯失败'
    });
  }
};

/**
 * 获取所有资讯（仪表盘用）
 * GET /api/information/all
 */
const getAllInformation = async (req, res) => {
  try {
    const limitNum = Math.max(1, parseInt(req.query.limit) || 1000);

    const list = await query(
      `SELECT 
        i.id,
        i.information_date,
        i.information_type,
        i.information_title,
        i.information_content,
        i.created_at,
        par.name as partner_name,
        proj.name as project_name
      FROM information i
      LEFT JOIN partners par ON i.partner_id = par.id
      LEFT JOIN projects proj ON i.project_id = proj.id
      ORDER BY i.information_date DESC, i.created_at DESC
      LIMIT ${limitNum}`,
      []
    );

    res.json({
      code: 200,
      data: list
    });
  } catch (error) {
    console.error('获取所有资讯错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取所有资讯失败'
    });
  }
};

/**
 * 导出资讯
 * GET /api/information/export
 */
const exportInformations = async (req, res) => {
  try {
    const {
      format = 'xlsx',
      keyword,
      informationType,
      partnerId,
      projectId,
      startDate,
      endDate
    } = req.query;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ` AND (i.information_title LIKE ? OR i.information_content LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (informationType) {
      whereClause += ' AND i.information_type = ?';
      params.push(informationType);
    }

    if (partnerId) {
      whereClause += ' AND i.partner_id = ?';
      params.push(partnerId);
    }

    if (projectId) {
      whereClause += ' AND i.project_id = ?';
      params.push(projectId);
    }

    if (startDate) {
      whereClause += ' AND i.information_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND i.information_date <= ?';
      params.push(endDate);
    }

    // 查询数据
    const data = await query(
      `SELECT
        i.information_date AS '资讯日期',
        i.information_type AS '资讯类型',
        i.information_title AS '资讯标题',
        i.information_content AS '资讯内容',
        par.name AS '关联合作方',
        proj.name AS '关联项目'
      FROM information i
      LEFT JOIN partners par ON i.partner_id = par.id
      LEFT JOIN projects proj ON i.project_id = proj.id
      ${whereClause}
      ORDER BY i.information_date DESC, i.created_at DESC
      LIMIT ${MAX_EXPORT_ROWS}`,
      params
    );

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=information_${moment().format('YYYYMMDD')}.json`);
      return res.send(JSON.stringify(data, null, 2));
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=information_${moment().format('YYYYMMDD')}.csv`);
      return res.send('\uFEFF' + csv);
    }

    // 默认导出Excel
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, '资讯列表');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=information_${moment().format('YYYYMMDD')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('导出资讯错误:', error);
    res.status(500).json({
      code: 500,
      message: '导出资讯失败'
    });
  }
};

/**
 * 获取资讯统计数据
 * GET /api/information/stats
 */
const getInformationStats = async (req, res) => {
  try {
    // 1. 资讯类型分布
    const typeDistribution = await query(
      `SELECT
        information_type as type,
        COUNT(*) as count
      FROM information
      GROUP BY information_type
      ORDER BY count DESC`
    );

    // 2. 日期热力图数据（最近365天）
    const dateHeatmap = await query(
      `SELECT
        information_date as date,
        COUNT(*) as count
      FROM information
      WHERE information_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
      GROUP BY information_date
      ORDER BY information_date ASC`
    );

    // 3. 合作方活跃度排名 Top 10
    const partnerRanking = await query(
      `SELECT
        par.id,
        par.name,
        COUNT(*) as count
      FROM information i
      LEFT JOIN partners par ON i.partner_id = par.id
      WHERE i.partner_id IS NOT NULL
      GROUP BY i.partner_id, par.id, par.name
      ORDER BY count DESC
      LIMIT 10`
    );

    // 4. 项目活跃度排名 Top 10
    const projectRanking = await query(
      `SELECT
        proj.id,
        proj.name,
        COUNT(*) as count
      FROM information i
      LEFT JOIN projects proj ON i.project_id = proj.id
      WHERE i.project_id IS NOT NULL
      GROUP BY i.project_id, proj.id, proj.name
      ORDER BY count DESC
      LIMIT 10`
    );

    // 5. 资讯总数
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM information`
    );

    // 6. 时间范围
    const dateRangeResult = await query(
      `SELECT
        MIN(information_date) as earliest_date,
        MAX(information_date) as latest_date
      FROM information`
    );

    res.json({
      code: 200,
      data: {
        total: totalResult[0].total,
        dateRange: dateRangeResult[0],
        typeDistribution,
        dateHeatmap,
        partnerRanking,
        projectRanking
      }
    });
  } catch (error) {
    console.error('获取资讯统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取资讯统计失败'
    });
  }
};

module.exports = {
  getInformations,
  getInformationById,
  createInformation,
  updateInformation,
  deleteInformation,
  getInformationTypes,
  getInformationByPartner,
  getInformationByProject,
  getAllInformation,
  exportInformations,
  getInformationStats
};
