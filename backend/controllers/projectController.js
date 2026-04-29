/**
 * 项目控制器
 * 处理项目的CRUD操作、导入导出等
 */
const { query, transaction } = require('../config/db');
const xlsx = require('xlsx');
const moment = require('moment');
const fs = require('fs');

// 项目阶段枚举
const STAGES = ['意向', '签约', '建设', '运营', '交付', '验收', '完结'];

// 项目类型枚举
const TYPES = ['收入合同', '支出合同'];

// 签约方式枚举
const EXPANSION_METHODS = ['投标', '比选', '比价', '直接谈判', '单一来源采购', '其他'];

// 项目内容枚举
const CONTENTS = ['系统建设', '数据服务', '技术服务', '业务运营', '业务咨询', '其他'];

// 四川省市州列表
const SICHUAN_CITIES = [
  '成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市',
  '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市',
  '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市',
  '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州'
];

// 辅助函数：格式化日期为 YYYY-MM-DD
const formatDate = (dateValue) => {
  if (!dateValue) return null;
  // 处理 ISO 8601 格式 (2025-08-06T16:00:00.000Z)
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    return dateValue.split('T')[0];
  }
  // 如果已经是 YYYY-MM-DD 格式，直接返回
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  // 使用 moment 格式化
  const formatted = moment(dateValue).format('YYYY-MM-DD');
  return formatted === 'Invalid date' ? null : formatted;
};

/**
 * 获取项目列表
 * GET /api/projects
 */
const getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      stage,
      city,
      type,
      expansionMethod,
      content,
      sortField,
      sortOrder = 'desc',
      partnerId
    } = req.query;

    // 确保分页参数是有效的数字
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, parseInt(pageSize) || 20);
    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;
    const user = req.user;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 权限控制：普通用户只能看到自己创建的项目
    if (user.role === 'normal') {
      whereClause += ' AND p.created_by = ?';
      params.push(user.userId);
    }

    // 关键词搜索（项目名称、合作方名称、履约地点、联系人）
    if (keyword) {
      whereClause += ` AND (p.name LIKE ? OR par.name LIKE ? OR p.city LIKE ? OR par.contact LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern);
    }

    // 阶段筛选
    if (stage) {
      whereClause += ' AND p.stage = ?';
      params.push(stage);
    }

    // 城市筛选
    if (city) {
      whereClause += ' AND p.city = ?';
      params.push(city);
    }

    // 项目类型筛选
    if (type) {
      whereClause += ' AND p.type = ?';
      params.push(type);
    }

    // 签约方式筛选
    if (expansionMethod) {
      whereClause += ' AND p.expansion_method = ?';
      params.push(expansionMethod);
    }

    // 内容筛选
    if (content) {
      whereClause += ' AND p.content = ?';
      params.push(content);
    }

    // 合作方筛选
    if (partnerId) {
      whereClause += ' AND p.partner_id = ?';
      params.push(partnerId);
    }
    
    // 排序
    let orderClause = 'ORDER BY p.created_at DESC';
    const allowedSortFields = ['stage', 'total_amount', 'receipt_amount', 'cost', 'profit', 'created_at'];
    if (sortField && allowedSortFields.includes(sortField)) {
      const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
      orderClause = `ORDER BY p.${sortField} ${order} USING GBK`;
    }

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM projects p 
       LEFT JOIN partners par ON p.partner_id = par.id ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询数据（LIMIT和OFFSET直接嵌入SQL，避免参数绑定问题）
    const projects = await query(
      `SELECT 
        p.id, p.name, p.city, p.stage, p.type, p.expansion_method, p.content,
        p.total_amount, p.receipt_amount, p.cost,
        (p.total_amount - p.receipt_amount) as pending_amount,
        (p.total_amount - p.cost) as profit,
        CASE WHEN p.total_amount > 0 THEN ROUND((p.total_amount - p.cost) / p.total_amount * 100, 2) ELSE 0 END as profit_rate,
        p.start_date, p.end_date, p.created_at, p.updated_at,
        p.partner_id, par.name as partner_name, par.contact as partner_contact, par.contact_phone as partner_contact_phone,
        u.nickname as creator_name
      FROM projects p
      LEFT JOIN partners par ON p.partner_id = par.id
      LEFT JOIN users u ON p.created_by = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      code: 200,
      data: {
        list: projects,
        pagination: {
          page: pageNum,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取项目列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取项目列表失败'
    });
  }
};

/**
 * 获取项目详情
 * GET /api/projects/:id
 */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 查询项目基本信息
    const projects = await query(
      `SELECT 
        p.*,
        (p.total_amount - p.receipt_amount) as pending_amount,
        (p.total_amount - p.cost) as profit,
        CASE WHEN p.total_amount > 0 THEN ROUND((p.total_amount - p.cost) / p.total_amount * 100, 2) ELSE 0 END as profit_rate,
        par.name as partner_name, par.type as partner_type, par.tax_id as partner_tax_id,
        par.address as partner_address, par.bank as partner_bank, par.bank_account as partner_bank_account,
        par.contact as partner_contact, par.contact_phone as partner_contact_phone,
        u.nickname as creator_name
      FROM projects p
      LEFT JOIN partners par ON p.partner_id = par.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '项目不存在'
      });
    }

    const project = projects[0];

    // 权限检查
    if (user.role === 'normal' && project.created_by !== user.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权访问此项目'
      });
    }

    // 查询款项信息
    const payments = await query(
      `SELECT * FROM payments WHERE project_id = ? ORDER BY id ASC`,
      [id]
    );

    // 查询附件信息
    const attachments = await query(
      `SELECT id, attachment_type, file_path, file_name, file_size, created_at 
       FROM attachments WHERE project_id = ? ORDER BY created_at DESC`,
      [id]
    );

    project.payments = payments;
    project.attachments = attachments;

    res.json({
      code: 200,
      data: project
    });
  } catch (error) {
    console.error('获取项目详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取项目详情失败'
    });
  }
};

/**
 * 创建项目
 * POST /api/projects
 */
const createProject = async (req, res) => {
  try {
    const {
      name,
      city,
      stage,
      type,
      expansion_method,
      content,
      total_amount,
      receipt_amount,
      cost,
      start_date,
      end_date,
      partner_id,
      payments: projectPayments
    } = req.body;

    // 参数验证
    if (!name || !city || !stage || !type || !expansion_method || !content || !partner_id) {
      return res.status(400).json({
        code: 400,
        message: '请填写必填字段'
      });
    }

    // 验证阶段
    if (!STAGES.includes(stage)) {
      return res.status(400).json({
        code: 400,
        message: '无效的项目阶段'
      });
    }

    // 验证项目类型
    if (!TYPES.includes(type)) {
      return res.status(400).json({
        code: 400,
        message: '无效的项目类型'
      });
    }

    // 验证日期
    const formattedStartDate = formatDate(start_date);
    const formattedEndDate = formatDate(end_date);
    if (formattedStartDate && formattedEndDate && formattedStartDate > formattedEndDate) {
      return res.status(400).json({
        code: 400,
        message: '终止日期不能早于起始日期'
      });
    }

    // 验证款项比例总和
    if (projectPayments && projectPayments.length > 0) {
      const totalRatio = projectPayments.reduce((sum, p) => sum + parseFloat(p.payment_ratio || 0), 0);
      if (Math.abs(totalRatio - 100) > 0.01) {
        return res.status(400).json({
          code: 400,
          message: `款项比例总和必须等于100%，当前为${totalRatio.toFixed(2)}%`
        });
      }
    }

    const result = await transaction(async (connection) => {
      // 创建项目
      const [projectResult] = await connection.execute(
        `INSERT INTO projects 
         (name, city, stage, type, expansion_method, content, total_amount, receipt_amount, cost, start_date, end_date, partner_id, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, city, stage, type, expansion_method, content,
          parseFloat(total_amount) || 0,
          parseFloat(receipt_amount) || 0,
          parseFloat(cost) || 0,
          formatDate(start_date),
          formatDate(end_date),
          partner_id,
          req.user.userId
        ]
      );

      const projectId = projectResult.insertId;

      // 创建款项
      if (projectPayments && projectPayments.length > 0) {
        for (const payment of projectPayments) {
          await connection.execute(
            `INSERT INTO payments 
             (project_id, payment_type, payment_condition, payment_ratio, payment_amount, is_paid, payment_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              projectId,
              payment.payment_type,
              payment.payment_condition || null,
              parseFloat(payment.payment_ratio) || 0,
              parseFloat(payment.payment_amount) || 0,
              payment.is_paid ? 1 : 0,
              formatDate(payment.payment_date)
            ]
          );
        }
      }

      return projectId;
    });

    res.status(201).json({
      code: 201,
      message: '项目创建成功',
      data: { id: result }
    });
  } catch (error) {
    console.error('创建项目错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建项目失败'
    });
  }
};

/**
 * 更新项目
 * PUT /api/projects/:id
 */
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      city,
      stage,
      type,
      expansion_method,
      content,
      total_amount,
      receipt_amount,
      cost,
      start_date,
      end_date,
      partner_id,
      payments: projectPayments
    } = req.body;

    const user = req.user;

    // 查询原项目
    const existingProjects = await query(
      'SELECT created_by FROM projects WHERE id = ?',
      [id]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '项目不存在'
      });
    }

    // 权限检查
    if (user.role === 'normal' && existingProjects[0].created_by !== user.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权修改此项目'
      });
    }

    // 验证日期
    const formattedStartDate = formatDate(start_date);
    const formattedEndDate = formatDate(end_date);
    if (formattedStartDate && formattedEndDate && formattedStartDate > formattedEndDate) {
      return res.status(400).json({
        code: 400,
        message: '终止日期不能早于起始日期'
      });
    }

    // 验证款项比例总和
    if (projectPayments && projectPayments.length > 0) {
      const totalRatio = projectPayments.reduce((sum, p) => sum + parseFloat(p.payment_ratio || 0), 0);
      if (Math.abs(totalRatio - 100) > 0.01) {
        return res.status(400).json({
          code: 400,
          message: `款项比例总和必须等于100%，当前为${totalRatio.toFixed(2)}%`
        });
      }
    }

    await transaction(async (connection) => {
      // 更新项目
      await connection.execute(
        `UPDATE projects SET 
          name = ?, city = ?, stage = ?, type = ?, expansion_method = ?, content = ?,
          total_amount = ?, receipt_amount = ?, cost = ?, start_date = ?, end_date = ?, partner_id = ?
         WHERE id = ?`,
        [
          name, city, stage, type, expansion_method, content,
          parseFloat(total_amount) || 0,
          parseFloat(receipt_amount) || 0,
          parseFloat(cost) || 0,
          formattedStartDate,
          formattedEndDate,
          partner_id,
          id
        ]
      );

      // 删除旧款项
      await connection.execute('DELETE FROM payments WHERE project_id = ?', [id]);

      // 创建新款项
      if (projectPayments && projectPayments.length > 0) {
        for (const payment of projectPayments) {
          await connection.execute(
            `INSERT INTO payments 
             (project_id, payment_type, payment_condition, payment_ratio, payment_amount, is_paid, payment_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              payment.payment_type,
              payment.payment_condition || null,
              parseFloat(payment.payment_ratio) || 0,
              parseFloat(payment.payment_amount) || 0,
              payment.is_paid ? 1 : 0,
              formatDate(payment.payment_date)
            ]
          );
        }
      }
    });

    res.json({
      code: 200,
      message: '项目更新成功',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('更新项目错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新项目失败'
    });
  }
};

/**
 * 删除项目
 * DELETE /api/projects/:id
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 查询原项目
    const existingProjects = await query(
      'SELECT created_by, name FROM projects WHERE id = ?',
      [id]
    );

    if (existingProjects.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '项目不存在'
      });
    }

    // 权限检查
    if (user.role === 'normal' && existingProjects[0].created_by !== user.userId) {
      return res.status(403).json({
        code: 403,
        message: '无权删除此项目'
      });
    }

    // 删除项目（关联的款项和附件会通过外键级联删除）
    await query('DELETE FROM projects WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: '项目删除成功',
      data: { id: parseInt(id), name: existingProjects[0].name }
    });
  } catch (error) {
    console.error('删除项目错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除项目失败'
    });
  }
};

/**
 * 导出项目
 * GET /api/projects/export
 */
const exportProjects = async (req, res) => {
  try {
    const { format = 'xlsx', keyword, stage, type } = req.query;
    const user = req.user;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (user.role === 'normal') {
      whereClause += ' AND p.created_by = ?';
      params.push(user.userId);
    }

    if (keyword) {
      whereClause += ` AND (p.name LIKE ? OR par.name LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (stage) {
      whereClause += ' AND p.stage = ?';
      params.push(stage);
    }

    if (type) {
      whereClause += ' AND p.type = ?';
      params.push(type);
    }

    // 查询所有数据
    const projects = await query(
      `SELECT 
        p.name as '项目名称',
        p.type as '项目类型',
        p.city as '履约地点',
        p.stage as '项目阶段',
        p.expansion_method as '签约方式',
        p.content as '项目内容',
        p.total_amount as '合同总金额(万元)',
        p.receipt_amount as '已开票金额(万元)',
        (p.total_amount - p.receipt_amount) as '待开票金额(万元)',
        p.cost as '成本(万元)',
        (p.total_amount - p.cost) as '毛利(万元)',
        CASE WHEN p.total_amount > 0 THEN ROUND((p.total_amount - p.cost) / p.total_amount * 100, 2) ELSE 0 END as '毛利率(%)',
        par.name as '合作方名称',
        par.contact as '联系人',
        par.contact_phone as '联系电话',
        p.start_date as '起始日期',
        p.end_date as '终止日期'
      FROM projects p
      LEFT JOIN partners par ON p.partner_id = par.id
      ${whereClause}
      ORDER BY p.created_at DESC`,
      params
    );

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=projects_${moment().format('YYYYMMDD')}.json`);
      return res.send(JSON.stringify(projects, null, 2));
    }

    if (format === 'csv') {
      const csv = convertToCSV(projects);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=projects_${moment().format('YYYYMMDD')}.csv`);
      // 添加BOM以支持Excel中文显示
      return res.send('\uFEFF' + csv);
    }

    // 默认导出Excel
    const ws = xlsx.utils.json_to_sheet(projects);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, '项目列表');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=projects_${moment().format('YYYYMMDD')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('导出项目错误:', error);
    res.status(500).json({
      code: 500,
      message: '导出项目失败'
    });
  }
};

/**
 * 导入项目
 * POST /api/projects/import
 */
const importProjects = async (req, res) => {
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

      // 处理导入数据
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      for (const item of data) {
        try {
          // 查找或创建合作方
          let partnerId = null;
          const partnerName = item['合作方名称'] || item.partner_name;
          
          if (partnerName) {
            const partners = await query('SELECT id FROM partners WHERE name = ?', [partnerName]);
            if (partners.length > 0) {
              partnerId = partners[0].id;
            }
          }

          if (!partnerId) {
            failCount++;
            errors.push(`项目 "${item['项目名称'] || item.name}" 的合作方不存在`);
            continue;
          }

          // 创建项目
          await query(
            `INSERT INTO projects 
             (name, city, stage, type, expansion_method, content, total_amount, receipt_amount, cost, start_date, end_date, partner_id, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item['项目名称'] || item.name,
              item['履约地点'] || item.city || '成都市',
              item['项目阶段'] || item.stage || '意向',
              item['项目类型'] || item.type || '收入合同',
              item['签约方式'] || item.expansion_method || '其他',
              item['项目内容'] || item.content || '其他',
              parseFloat(item['合同总金额(万元)'] || item.total_amount) || 0,
              parseFloat(item['已开票金额(万元)'] || item.receipt_amount) || 0,
              parseFloat(item['成本(万元)'] || item.cost) || 0,
              formatDate(item['起始日期'] || item.start_date),
              formatDate(item['终止日期'] || item.end_date),
              partnerId,
              req.user.userId
            ]
          );
          successCount++;
        } catch (err) {
          failCount++;
          errors.push(`项目 "${item['项目名称'] || item.name}" 导入失败: ${err.message}`);
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
    console.error('导入项目错误:', error);
    res.status(500).json({
      code: 500,
      message: '导入项目失败'
    });
  }
};

/**
 * 获取数据概览
 * GET /api/projects/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const user = req.user;
    const { type } = req.query;

    // 构建查询条件
    let whereClause = '';
    const params = [];

    if (user.role === 'normal') {
      whereClause = 'WHERE created_by = ?';
      params.push(user.userId);
    }

    // 项目类型筛选
    if (type) {
      whereClause += whereClause ? ' AND type = ?' : 'WHERE type = ?';
      params.push(type);
    }
    
    // 统计项目数量、合同总金额、已开票金额、待开票金额
    const statsResult = await query(
      `SELECT 
        COUNT(*) as project_count,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(receipt_amount), 0) as receipt_amount,
        COALESCE(SUM(total_amount - receipt_amount), 0) as pending_amount
      FROM projects ${whereClause}`,
      params
    );
    
    // 项目阶段分布
    const stageDistribution = await query(
      `SELECT 
        stage,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as amount
      FROM projects ${whereClause}
      GROUP BY stage`,
      params
    );

    // 合同金额趋势（按月份）
    const receiptTrend = await query(
      `SELECT 
        DATE_FORMAT(start_date, '%Y-%m') as month,
        COALESCE(SUM(total_amount), 0) as amount
      FROM projects 
      WHERE start_date IS NOT NULL ${whereClause ? whereClause.replace('WHERE', 'AND') : ''}
      GROUP BY DATE_FORMAT(start_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12`,
      params
    );

    // 项目地点分布
    const cityDistribution = await query(
      `SELECT 
        city,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as amount
      FROM projects ${whereClause}
      GROUP BY city`,
      params
    );

    // 项目类型分布
    const typeDistribution = await query(
      `SELECT 
        type,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as amount
      FROM projects ${whereClause || 'WHERE 1=1'}
      GROUP BY type`,
      params
    );

    res.json({
      code: 200,
      data: {
        stats: statsResult[0],
        stageDistribution,
        receiptTrend: receiptTrend.reverse(),
        cityDistribution,
        typeDistribution
      }
    });
  } catch (error) {
    console.error('获取数据概览错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取数据概览失败'
    });
  }
};

/**
 * 获取项目城市分布统计
 * GET /api/projects/city-distribution
 */
const getCityDistribution = async (req, res) => {
  try {
    const user = req.user;
    const { type } = req.query;

    // 构建查询条件
    let whereClause = '';
    const params = [];

    if (user.role === 'normal') {
      whereClause = 'WHERE created_by = ?';
      params.push(user.userId);
    }

    // 项目类型筛选
    if (type) {
      whereClause += whereClause ? ' AND type = ?' : 'WHERE type = ?';
      params.push(type);
    }

    // 按城市统计项目数量和金额
    const cityStats = await query(
      `SELECT 
        city,
        COUNT(*) as project_count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM projects ${whereClause}
      GROUP BY city
      ORDER BY project_count DESC`,
      params
    );

    // 按城市和阶段统计
    const stageStats = await query(
      `SELECT 
        city,
        stage,
        COUNT(*) as count
      FROM projects ${whereClause}
      GROUP BY city, stage`,
      params
    );

    // 构建完整的城市分布数据（包含没有项目的城市）
    const cityDistribution = SICHUAN_CITIES.map(cityName => {
      const stat = cityStats.find(s => s.city === cityName);
      const cityStages = stageStats.filter(s => s.city === cityName);
      
      // 构建阶段分布对象
      const stageDistribution = {};
      cityStages.forEach(s => {
        stageDistribution[s.stage] = s.count;
      });
      return {
        city: cityName,
        project_count: stat ? stat.project_count : 0,
        total_amount: stat ? stat.total_amount : 0,
        stageDistribution
      };
    });

    res.json({
      code: 200,
      data: cityDistribution
    });
  } catch (error) {
    console.error('获取城市分布统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取城市分布统计失败'
    });
  }
};

/**
 * 获取筛选选项（从字典表读取）
 * GET /api/projects/filters
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

    const [stages, types, expansionMethods, contents, cities, paymentTypes, attachmentTypes] = await Promise.all([
      getDictItems('project_stage'),
      getDictItems('project_type'),
      getDictItems('expansion_method'),
      getDictItems('project_content'),
      getDictItems('project_city'),
      getDictItems('payment_type'),
      getDictItems('attachment_type')
    ]);

    res.json({
      code: 200,
      data: {
        stages,
        types,
        expansionMethods,
        contents,
        cities,
        paymentTypes,
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

// 辅助函数：解析CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    result.push(row);
  }
  
  return result;
}

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

// 辅助函数：解析CSV
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  exportProjects,
  importProjects,
  getDashboard,
  getFilterOptions,
  getCityDistribution,
  STAGES,
  TYPES,
  EXPANSION_METHODS,
  CONTENTS,
  SICHUAN_CITIES
};
