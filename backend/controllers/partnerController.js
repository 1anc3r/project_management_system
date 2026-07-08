/**
 * 合作方控制器
 * 处理合作方的CRUD操作及联系人排序
 */
const { query, transaction } = require('../config/db');
const xlsx = require('xlsx');
const moment = require('moment');
const { PARTNER_TYPES } = require('../config/const');
const { sortPartnersByType } = require('../utils/dateHelper');
const { convertToCSV } = require('../utils/csvHelper');

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
    return PARTNER_TYPES;
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
      type,
      sortField,
      sortOrder = 'desc'
    } = req.query;

    // 确保分页参数是有效的数字
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, parseInt(pageSize) || 20);
    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 关键词搜索（名称、纳税人识别号、联系人姓名、联系人电话）
    if (keyword) {
      whereClause += ` AND (p.name LIKE ? OR p.tax_id LIKE ? OR EXISTS (
        SELECT 1 FROM partner_contacts pc WHERE pc.partner_id = p.id 
        AND (pc.name LIKE ? OR pc.phone LIKE ?)
      ))`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern);
    }

    // 类型筛选
    if (type) {
      whereClause += ' AND p.type = ?';
      params.push(type);
    }

    const fieldMap = {
      'project_count': 'project_count', 
      'total_contract_amount': 'total_contract_amount',
      'created_at': 'p.created_at'
    };

    // 排序
    let orderClause = 'ORDER BY p.tax_id DESC';
    const allowedSortFields = ['project_count', 'total_contract_amount', 'created_at'];
    if (sortField && allowedSortFields.includes(sortField)) {
      const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
      // stage 字段为中文，使用 CONVERT 指定 GBK 编码实现拼音排序；其他字段直接排序
      orderClause = `ORDER BY ${fieldMap[sortField]} ${order}`;
    }

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM partners p ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询数据
    const partners = await query(
      `SELECT 
        p.id, p.name, p.type, p.tax_id, p.address, 
        p.bank, p.bank_account,
        p.created_at, p.updated_at,
        COUNT(DISTINCT proj.id) as project_count,
        COALESCE(SUM(proj.total_amount), 0) as total_contract_amount,
        (SELECT pc.name FROM partner_contacts pc WHERE pc.partner_id = p.id ORDER BY pc.sort_order ASC, pc.id ASC LIMIT 1) as primary_contact_name,
        (SELECT pc.phone FROM partner_contacts pc WHERE pc.partner_id = p.id ORDER BY pc.sort_order ASC, pc.id ASC LIMIT 1) as primary_contact_phone,
        p.created_by
      FROM partners p
      LEFT JOIN projects proj ON p.id = proj.partner_id
      ${whereClause}
      GROUP BY p.id
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    sortedPartners = sortPartnersByType(partners);

    res.json({
      code: 200,
      data: {
        list: sortedPartners,
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

    // 查询关联的联系人（按 sort_order 排序）
    const contacts = await query(
      `SELECT id, name, phone, position, sort_order, created_at 
       FROM partner_contacts 
       WHERE partner_id = ? 
       ORDER BY sort_order ASC, id ASC`,
      [id]
    );
    partner.contacts = contacts;

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
      contacts: partnerContacts
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

    const partnerId = await transaction(async (connection) => {
      // 创建合作方
      const [result] = await connection.execute(
        `INSERT INTO partners 
         (name, type, tax_id, address, bank, bank_account, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          type || '其他',
          tax_id || null,
          address || null,
          bank || null,
          bank_account || null,
          req.user.userId
        ]
      );

      const newPartnerId = result.insertId;

      // 创建联系人（带排序序号）
      if (partnerContacts && partnerContacts.length > 0) {
        for (let i = 0; i < partnerContacts.length; i++) {
          const contact = partnerContacts[i];
          if (!contact.name) continue;
          await connection.execute(
            `INSERT INTO partner_contacts 
             (partner_id, name, phone, position, sort_order) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              newPartnerId,
              contact.name,
              contact.phone || null,
              contact.position || null,
              contact.sort_order !== undefined ? contact.sort_order : i
            ]
          );
        }
      }

      return newPartnerId;
    });

    res.status(201).json({
      code: 201,
      message: '合作方创建成功',
      data: { id: partnerId }
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
      contacts: partnerContacts
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

    await transaction(async (connection) => {
      // 更新合作方
      await connection.execute(
        `UPDATE partners SET 
          name = ?, type = ?, tax_id = ?, address = ?, 
          bank = ?, bank_account = ?, created_by = ?
         WHERE id = ?`,
        [
          name,
          type || '其他',
          tax_id || null,
          address || null,
          bank || null,
          bank_account || null,
          req.user.userId,
          id
        ]
      );

      // 删除旧联系人
      await connection.execute('DELETE FROM partner_contacts WHERE partner_id = ?', [id]);

      // 插入新联系人（带排序序号）
      if (partnerContacts && partnerContacts.length > 0) {
        for (let i = 0; i < partnerContacts.length; i++) {
          const contact = partnerContacts[i];
          if (!contact.name) continue;
          await connection.execute(
            `INSERT INTO partner_contacts 
             (partner_id, name, phone, position, sort_order) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              id,
              contact.name,
              contact.phone || null,
              contact.position || null,
              contact.sort_order !== undefined ? contact.sort_order : i
            ]
          );
        }
      }
    });

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

    // 删除合作方（联系人会通过级联删除自动删除）
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
 * 获取筛选选项
 * GET /api/partners/filters
 */
const getFilterOptions = async (req, res) => {
  try {
    // 从字典表读取筛选选项
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

    const [types] = await Promise.all([
      getDictItems('partner_type')
    ]);

    res.json({
      code: 200,
      data: {
        types
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
 * 导出合作方联系人
 * GET /api/partners/export-contacts
 */
const exportPartnerContacts = async (req, res) => {
  try {
    const { format = 'xlsx', keyword } = req.query;

    // 构建查询条件
    let whereClause = '';
    const params = [];

    if (keyword) {
      whereClause = `WHERE p.name LIKE ? OR pc.name LIKE ? OR pc.phone LIKE ?`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    // 查询所有联系人数据（按合作方名称排序）
    const contacts = await query(
      `SELECT
        p.name as '合作方名称',
        pc.name as '联系人姓名',
        pc.position as '职务',
        pc.phone as '电话'
      FROM partner_contacts pc
      JOIN partners p ON pc.partner_id = p.id
      ${whereClause}
      ORDER BY p.name ASC, pc.sort_order ASC, pc.id ASC`,
      params
    );

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=partner_contacts_${moment().format('YYYYMMDD')}.json`);
      return res.send(JSON.stringify(contacts, null, 2));
    }

    if (format === 'csv') {
      const csv = convertToCSV(contacts);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=partner_contacts_${moment().format('YYYYMMDD')}.csv`);
      return res.send('\uFEFF' + csv);
    }

    // 默认导出Excel
    const ws = xlsx.utils.json_to_sheet(contacts);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, '联系人列表');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=partner_contacts_${moment().format('YYYYMMDD')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('导出联系人错误:', error);
    res.status(500).json({
      code: 500,
      message: '导出联系人失败'
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
      whereClause = `WHERE p.name LIKE ? OR p.tax_id LIKE ? OR EXISTS (
        SELECT 1 FROM partner_contacts pc WHERE pc.partner_id = p.id 
        AND (pc.name LIKE ? OR pc.phone LIKE ?)
      )`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern);
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
        COUNT(DISTINCT proj.id) as '项目数量',
        COALESCE(SUM(proj.total_amount), 0) as '合同总金额(万元)',
        (SELECT GROUP_CONCAT(pc.name, '（', IFNULL(pc.position, ''), '）:', IFNULL(pc.phone, '') ORDER BY pc.sort_order ASC SEPARATOR '; ') 
         FROM partner_contacts pc WHERE pc.partner_id = p.id) as '联系人'
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
        p.id, p.name, p.type, p.tax_id, p.address, p.bank, p.bank_account,
        (SELECT pc.name FROM partner_contacts pc WHERE pc.partner_id = p.id ORDER BY pc.sort_order ASC, pc.id ASC LIMIT 1) as contact,
        (SELECT pc.phone FROM partner_contacts pc WHERE pc.partner_id = p.id ORDER BY pc.sort_order ASC, pc.id ASC LIMIT 1) as contact_phone
      FROM partners p
      WHERE p.name LIKE ? OR p.tax_id LIKE ? OR EXISTS (
        SELECT 1 FROM partner_contacts pc WHERE pc.partner_id = p.id 
        AND (pc.name LIKE ? OR pc.phone LIKE ?)
      )
      ORDER BY p.name ASC
      LIMIT 20`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
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
      `SELECT 
        p.id, p.name,
        (SELECT pc.name FROM partner_contacts pc WHERE pc.partner_id = p.id ORDER BY pc.sort_order ASC, pc.id ASC LIMIT 1) as contact,
        (SELECT pc.phone FROM partner_contacts pc WHERE pc.partner_id = p.id ORDER BY pc.sort_order ASC, pc.id ASC LIMIT 1) as contact_phone
      FROM partners p
      ORDER BY p.name ASC`
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

/**
 * 获取合作方联系人列表（按排序序号排序）
 * GET /api/partners/:id/contacts
 */
const getPartnerContacts = async (req, res) => {
  try {
    const { id } = req.params;

    const contacts = await query(
      `SELECT id, name, phone, position, sort_order, created_at, updated_at 
       FROM partner_contacts 
       WHERE partner_id = ? 
       ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    res.json({
      code: 200,
      data: contacts
    });
  } catch (error) {
    console.error('获取联系人列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取联系人列表失败'
    });
  }
};

/**
 * 添加合作方联系人
 * POST /api/partners/:id/contacts
 */
const addPartnerContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, position, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '联系人姓名不能为空'
      });
    }

    // 验证合作方是否存在
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

    // 获取当前最大排序序号
    const maxOrderResult = await query(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM partner_contacts WHERE partner_id = ?',
      [id]
    );
    const newSortOrder = sort_order !== undefined ? sort_order : (maxOrderResult[0].max_order + 1);

    const result = await query(
      `INSERT INTO partner_contacts (partner_id, name, phone, position, sort_order) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, name, phone || null, position || null, newSortOrder]
    );

    res.status(201).json({
      code: 201,
      message: '联系人添加成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('添加联系人错误:', error);
    res.status(500).json({
      code: 500,
      message: '添加联系人失败'
    });
  }
};

/**
 * 更新合作方联系人
 * PUT /api/partners/:id/contacts/:contactId
 */
const updatePartnerContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const { name, phone, position, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '联系人姓名不能为空'
      });
    }

    await query(
      `UPDATE partner_contacts SET name = ?, phone = ?, position = ?, sort_order = ? 
       WHERE id = ? AND partner_id = ?`,
      [name, phone || null, position || null, sort_order !== undefined ? sort_order : 0, contactId, id]
    );

    res.json({
      code: 200,
      message: '联系人更新成功',
      data: { id: parseInt(contactId) }
    });
  } catch (error) {
    console.error('更新联系人错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新联系人失败'
    });
  }
};

/**
 * 删除合作方联系人
 * DELETE /api/partners/:id/contacts/:contactId
 */
const deletePartnerContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;

    await query(
      'DELETE FROM partner_contacts WHERE id = ? AND partner_id = ?',
      [contactId, id]
    );

    res.json({
      code: 200,
      message: '联系人删除成功',
      data: { id: parseInt(contactId) }
    });
  } catch (error) {
    console.error('删除联系人错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除联系人失败'
    });
  }
};

/**
 * 批量更新联系人排序
 * PUT /api/partners/:id/contacts-sort
 * Request Body: { contacts: [{ id, sort_order }, ...] }
 */
const sortPartnerContacts = async (req, res) => {
  try {
    const { id } = req.params;
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供需要排序的联系人列表'
      });
    }

    // 验证合作方是否存在
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

    // 使用事务批量更新排序
    await transaction(async (connection) => {
      for (const contact of contacts) {
        if (!contact.id || contact.sort_order === undefined) continue;
        await connection.execute(
          `UPDATE partner_contacts SET sort_order = ? WHERE id = ? AND partner_id = ?`,
          [contact.sort_order, contact.id, id]
        );
      }
    });

    res.json({
      code: 200,
      message: '联系人排序更新成功'
    });
  } catch (error) {
    console.error('更新联系人排序错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新联系人排序失败'
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
  exportPartnerContacts,
  searchPartners,
  getAllPartners,
  getPartnerTypes,
  getPartnerContacts,
  addPartnerContact,
  updatePartnerContact,
  deletePartnerContact,
  sortPartnerContacts,
  getFilterOptions
};
