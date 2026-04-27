/**
 * 数据库配置模块
 * 使用MySQL2连接池管理数据库连接
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接池配置
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'project_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset:'utf8mb4',
  // DATE / DATETIME / TIMESTAMP 以字符串形式返回，避免 Date 对象的时区偏移问题
  dateStrings: true
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 执行SQL查询的通用方法
const query = async (sql, params = []) => {
  try {
    // 确保所有参数都是有效的值，将数字转换为整数
    const sanitizedParams = params.map(param => {
      if (param === null || param === undefined) {
        return null;
      }
      if (typeof param === 'number') {
        // 确保数字是有效的整数
        return Number.isFinite(param) ? Math.floor(param) : 0;
      }
      return param;
    });
    
    const [results] = await pool.execute(sql, sanitizedParams);
    return results;
  } catch (error) {
    console.error('SQL执行错误:', error.message);
    throw error;
  }
};

// 事务处理
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
