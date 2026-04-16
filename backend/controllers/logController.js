/**
 * 操作日志控制器
 * 处理日志的查询和导出
 */
const { query } = require('../config/db');
const xlsx = require('xlsx');
const moment = require('moment');

/**
 * 获取操作日志列表
 * GET /api/logs
 */
const getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      username,
      module,
      operation,
      startDate,
      endDate
    } = req.query;

    // 确保分页参数是有效的数字
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, parseInt(pageSize) || 20);
    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 用户名筛选
    if (username) {
      whereClause += ' AND username LIKE ?';
      params.push(`%${username}%`);
    }

    // 模块筛选
    if (module) {
      whereClause += ' AND module = ?';
      params.push(module);
    }

    // 操作类型筛选
    if (operation) {
      whereClause += ' AND operation = ?';
      params.push(operation);
    }

    // 日期范围筛选
    if (startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(`${endDate} 23:59:59`);
    }

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM operation_logs ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询数据
    const logs = await query(
      `SELECT 
        id, user_id, username, module, operation, 
        target_id, target_name, content, ip, created_at
      FROM operation_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      code: 200,
      data: {
        list: logs,
        pagination: {
          page: pageNum,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取操作日志错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取操作日志失败'
    });
  }
};

/**
 * 导出操作日志
 * GET /api/logs/export
 */
const exportLogs = async (req, res) => {
  try {
    const { format = 'xlsx', username, module, operation, startDate, endDate } = req.query;

    // 构建查询条件
    let whereClause = '';
    const params = [];

    if (username) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ' username LIKE ?';
      params.push(`%${username}%`);
    }

    if (module) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ' module = ?';
      params.push(module);
    }

    if (operation) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ' operation = ?';
      params.push(operation);
    }

    if (startDate) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ' created_at >= ?';
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ' created_at <= ?';
      params.push(`${endDate} 23:59:59`);
    }

    // 查询所有数据
    const logs = await query(
      `SELECT 
        username as '操作人',
        module as '模块',
        operation as '操作',
        target_name as '数据名称',
        ip as 'IP地址',
        created_at as '操作时间'
      FROM operation_logs
      ${whereClause}
      ORDER BY created_at DESC`,
      params
    );

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=logs_${moment().format('YYYYMMDD')}.json`);
      return res.send(JSON.stringify(logs, null, 2));
    }

    if (format === 'csv') {
      const csv = convertToCSV(logs);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=logs_${moment().format('YYYYMMDD')}.csv`);
      return res.send('\uFEFF' + csv);
    }

    // 默认导出Excel
    const ws = xlsx.utils.json_to_sheet(logs);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, '操作日志');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=logs_${moment().format('YYYYMMDD')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('导出操作日志错误:', error);
    res.status(500).json({
      code: 500,
      message: '导出操作日志失败'
    });
  }
};

/**
 * 获取模块和操作类型选项
 * GET /api/logs/filters
 */
const getFilterOptions = async (req, res) => {
  try {
    // 获取所有模块
    const modules = await query(
      `SELECT DISTINCT module FROM operation_logs WHERE module IS NOT NULL ORDER BY module`
    );

    // 获取所有操作类型
    const operations = await query(
      `SELECT DISTINCT operation FROM operation_logs WHERE operation IS NOT NULL ORDER BY operation`
    );

    res.json({
      code: 200,
      data: {
        modules: modules.map(m => m.module),
        operations: operations.map(o => o.operation)
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

module.exports = {
  getLogs,
  exportLogs,
  getFilterOptions
};
