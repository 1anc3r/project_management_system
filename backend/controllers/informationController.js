/**
 * 资讯控制器
 * 处理资讯的CRUD操作
 */
const { query, transaction } = require('../config/db');

/**
 * 将各种日期格式统一转换为 YYYY-MM-DD 字符串
 * 兼容 ISO 字符串、Date 对象、YYYY-MM-DD 字符串等
 * @param {string|Date} dateValue 
 * @returns {string|null}
 */
const normalizeDate = (dateValue) => {
  if (!dateValue) return null;
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

/**
 * 获取资讯列表
 * GET /api/information
 */
const getInformationList = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      partnerId,
      projectId,
      informationType,
      startDate,
      endDate,
      sortField,
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, parseInt(pageSize) || 20);
    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;

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

    const list = await query(
      `SELECT 
        i.id,
        i.partner_id,
        i.project_id,
        i.information_date,
        i.information_type,
        i.information_title,
        i.information_content,
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

    const normalizedDate = normalizeDate(information_date);
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

    const normalizedDate = information_date ? normalizeDate(information_date) : null;

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
    const items = await query(
      `SELECT di.item_name 
       FROM dictionary_items di
       JOIN dictionaries d ON di.dict_id = d.id
       WHERE d.dict_code = 'information_type' AND di.status = 1 AND d.status = 1
       ORDER BY di.sort_order ASC`
    );

    res.json({
      code: 200,
      data: items.map(item => item.item_name)
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
    const limitNum = Math.max(1, parseInt(req.query.limit) || 20);

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

module.exports = {
  getInformationList,
  getInformationById,
  createInformation,
  updateInformation,
  deleteInformation,
  getInformationTypes,
  getInformationByPartner,
  getInformationByProject,
  getAllInformation
};
