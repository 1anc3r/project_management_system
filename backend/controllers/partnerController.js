/**
 * 合作方控制器
 * 处理合作方的CRUD操作
 */
const { query, transaction } = require('../config/db');
const xlsx = require('xlsx');
const moment = require('moment');

// 从字典表获取合作方类型
const getPartnerTypesFromDB = async () => {
  try {
    const items = await query(
      `SELECT di.item_name 
       FROM dictionary_items di
       JOIN dictionaries d ON di.dict_id = d.id
       WHERE d.dict_code = 'partner_type' AND di.status = 1 AND d.status = 1
       ORDER BY di.sort_order ASC`
    );
    return items.map(item => item.item_name);
  } catch (error) {
    console.error('获取合作方类型失败:', error);
    return ['甲方', '乙方', '丙方', '其他'];
  }
};

// 验证合作方类型
const validatePartnerType = async (type) => {
  const types = await getPartnerTypesFromDB();
  return types.includes(type);
};

/**
 * 获取合作方列表
 * GET /api/partners
 */
const getPartners = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      type
    } = req.query;

    // 确保分页参数是有效的数字
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, parseInt(pageSize) || 20);
    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 关键词搜索
    if (keyword) {
      whereClause += ` AND (p.name LIKE ? OR p.tax_id LIKE ? OR p.contact LIKE ? OR p.contact_phone LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern);
    }

    // 类型筛选
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM partners p ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询数据（合并相同纳税人识别号的合作方）
    const partners = await query(
      `SELECT 
        p.id, p.name, p.type, p.tax_id, p.address, 
        p.bank, p.bank_account, p.contact, p.contact_phone,
        p.created_at, p.updated_at,
        COUNT(DISTINCT proj.id) as project_count,
        COALESCE(SUM(proj.total_amount), 0) as total_contract_amount
      FROM partners p
      LEFT JOIN projects proj ON p.id = proj.partner_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      code: 200,
      data: {
        list: partners,
        pagination: {
          page: pageNum,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取合作方列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取合作方列表失败'
    });
  }
};

/**
 * 获取合作方详情
 * GET /api/partners/:id
 */
const getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    // 查询合作方基本信息
    const partners = await query(
      `SELECT * FROM partners WHERE id = ?`,
      [id]
    );

    if (partners.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '合作方不存在'
      });
    }

    const partner = partners[0];

    // 查询关联的项目
    const projects = await query(
      `SELECT 
        id, name, stage, total_amount, receipt_amount, start_date, end_date
      FROM projects 
      WHERE partner_id = ?
      ORDER BY created_at DESC`,
      [id]
    );

    partner.projects = projects;

    res.json({
      code: 200,
      data: partner
    });
  } catch (error) {
    console.error('获取合作方详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取合作方详情失败'
    });
  }
};

/**
 * 创建合作方
 * POST /api/partners
 */
const createPartner = async (req, res) => {
  try {
    const {
      name,
      type,
      tax_id,
      address,
      bank,
      bank_account,
      contact,
      contact_phone
    } = req.body;

    // 参数验证
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '合作方名称不能为空'
      });
    }

    // 验证类型
    if (type) {
      const isValid = await validatePartnerType(type);
      if (!isValid) {
        return res.status(400).json({
          code: 400,
          message: '无效的合作方类型'
        });
      }
    }

    // 检查纳税人识别号是否已存在
    if (tax_id) {
      const existing = await query(
        'SELECT id FROM partners WHERE tax_id = ?',
        [tax_id]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '该纳税人识别号已存在'
        });
      }
    }

    // 创建合作方
    const result = await query(
      `INSERT INTO partners 
       (name, type, tax_id, address, bank, bank_account, contact, contact_phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        type || '其他',
        tax_id || null,
        address || null,
        bank || null,
        bank_account || null,
        contact || null,
        contact_phone || null
      ]
    );

    res.status(201).json({
      code: 201,
      message: '合作方创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建合作方错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建合作方失败'
    });
  }
};

/**
 * 更新合作方
 * PUT /api/partners/:id
 */
const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      tax_id,
      address,
      bank,
      bank_account,
      contact,
      contact_phone
    } = req.body;

    // 查询原合作方
    const existingPartners = await query(
      'SELECT id FROM partners WHERE id = ?',
      [id]
    );

    if (existingPartners.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '合作方不存在'
      });
    }

    // 验证类型
    if (type) {
      const isValid = await validatePartnerType(type);
      if (!isValid) {
        return res.status(400).json({
          code: 400,
          message: '无效的合作方类型'
        });
      }
    }

    // 检查纳税人识别号是否与其他合作方冲突
    if (tax_id) {
      const existing = await query(
        'SELECT id FROM partners WHERE tax_id = ? AND id != ?',
        [tax_id, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '该纳税人识别号已被其他合作方使用'
        });
      }
    }

    // 更新合作方
    await query(
      `UPDATE partners SET 
        name = ?, type = ?, tax_id = ?, address = ?, 
        bank = ?, bank_account = ?, contact = ?, contact_phone = ?
       WHERE id = ?`,
      [
        name,
        type || '其他',
        tax_id || null,
        address || null,
        bank || null,
        bank_account || null,
        contact || null,
        contact_phone || null,
        id
      ]
    );

    res.json({
      code: 200,
      message: '合作方更新成功',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('更新合作方错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新合作方失败'
    });
  }
};

/**
 * 删除合作方
 * DELETE /api/partners/:id
 */
const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;

    // 查询原合作方
    const existingPartners = await query(
      'SELECT name FROM partners WHERE id = ?',
      [id]
    );

    if (existingPartners.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '合作方不存在'
      });
    }

    // 检查是否有关联的项目
    const relatedProjects = await query(
      'SELECT COUNT(*) as count FROM projects WHERE partner_id = ?',
      [id]
    );

    if (relatedProjects[0].count > 0) {
      return res.status(400).json({
        code: 400,
        message: '该合作方有关联的项目，无法删除'
      });
    }

    // 删除合作方
    await query('DELETE FROM partners WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: '合作方删除成功',
      data: { id: parseInt(id), name: existingPartners[0].name }
    });
  } catch (error) {
    console.error('删除合作方错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除合作方失败'
    });
  }
};

/**
 * 导出合作方
 * GET /api/partners/export
 */
const exportPartners = async (req, res) => {
  try {
    const { format = 'xlsx', keyword } = req.query;

    // 构建查询条件
    let whereClause = '';
    const params = [];

    if (keyword) {
      whereClause = 'WHERE name LIKE ? OR tax_id LIKE ?';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    // 查询所有数据
    const partners = await query(
      `SELECT 
        p.name as '合作方名称',
        p.type as '合作方类型',
        p.tax_id as '纳税人识别号',
        p.address as '地址',
        p.bank as '开户银行',
        p.bank_account as '银行账号',
        p.contact as '联系人',
        p.contact_phone as '联系电话',
        COUNT(DISTINCT proj.id) as '项目数量',
        COALESCE(SUM(proj.total_amount), 0) as '合同总金额(万元)'
      FROM partners p
      LEFT JOIN projects proj ON p.id = proj.partner_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC`,
      params
    );

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=partners_${moment().format('YYYYMMDD')}.json`);
      return res.send(JSON.stringify(partners, null, 2));
    }

    if (format === 'csv') {
      const csv = convertToCSV(partners);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=partners_${moment().format('YYYYMMDD')}.csv`);
      return res.send('\uFEFF' + csv);
    }

    // 默认导出Excel
    const ws = xlsx.utils.json_to_sheet(partners);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, '合作方列表');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=partners_${moment().format('YYYYMMDD')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('导出合作方错误:', error);
    res.status(500).json({
      code: 500,
      message: '导出合作方失败'
    });
  }
};

/**
 * 搜索合作方（用于自动填充）
 * GET /api/partners/search
 */
const searchPartners = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim().length < 1) {
      return res.json({
        code: 200,
        data: []
      });
    }

    const partners = await query(
      `SELECT 
        id, name, type, tax_id, address, bank, bank_account, contact, contact_phone
      FROM partners 
      WHERE name LIKE ? OR tax_id LIKE ?
      ORDER BY name ASC
      LIMIT 20`,
      [`%${keyword}%`, `%${keyword}%`]
    );

    res.json({
      code: 200,
      data: partners
    });
  } catch (error) {
    console.error('搜索合作方错误:', error);
    res.status(500).json({
      code: 500,
      message: '搜索合作方失败'
    });
  }
};

/**
 * 获取所有合作方（下拉选择用）
 * GET /api/partners/all
 */
const getAllPartners = async (req, res) => {
  try {
    const partners = await query(
      `SELECT id, name, contact, contact_phone FROM partners ORDER BY name ASC`
    );

    res.json({
      code: 200,
      data: partners
    });
  } catch (error) {
    console.error('获取合作方列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取合作方列表失败'
    });
  }
};

// 辅助函数：转换为CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

/**
 * 获取合作方类型选项
 * GET /api/partners/types
 */
const getPartnerTypes = async (req, res) => {
  try {
    const types = await getPartnerTypesFromDB();
    res.json({
      code: 200,
      data: types
    });
  } catch (error) {
    console.error('获取合作方类型错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取合作方类型失败'
    });
  }
};

module.exports = {
  getPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
  exportPartners,
  searchPartners,
  getAllPartners,
  getPartnerTypes,
  getPartnerTypesFromDB
};
