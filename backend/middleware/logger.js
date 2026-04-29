/**
 * 操作日志中间件
 * 记录用户操作日志
 */
const { query } = require('../config/db');

/**
 * 记录操作日志
 * @param {Object} logData - 日志数据
 */
const logOperation = async (logData) => {
  try {
    const {
      userId,
      username,
      module,
      operation,
      targetId,
      targetName,
      content,
      ip
    } = logData;

    await query(
      `INSERT INTO operation_logs 
       (user_id, username, module, operation, target_id, target_name, content, ip) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        username || null,
        module,
        operation,
        targetId || null,
        targetName || null,
        content ? JSON.stringify(content) : null,
        ip || null
      ]
    );
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
};

/**
 * 创建日志记录中间件
 * @param {String} module - 模块名称
 * @param {String} operation - 操作类型
 */
const createLogMiddleware = (module, operation) => {
  return async (req, res, next) => {
    // 保存原始json方法
    const originalJson = res.json;

    // 重写json方法以捕获响应
    res.json = function (data) {
      // 恢复原始方法
      res.json = originalJson;

      // 如果操作成功，记录日志
      if (data && (data.code === 200 || data.code === 201 || data.code === 0)) {
        const logData = {
          userId: req.user?.userId,
          username: req.user?.username,
          module,
          operation,
          targetId: data.data?.id || req.params?.id || null,
          targetName: data.data?.name || req.body?.name || 
                      data.data?.nickname || req.body?.nickname || 
                      data.data?.information_title || req.body?.information_title || 
                      data.data?.item_name || req.body?.item_name || null,
          content: {
            body: req.body,
            params: req.params,
            query: req.query,
            result: data
          },
          ip: req.ip || req.connection?.remoteAddress || null
        };

        logOperation(logData);
      }

      // 调用原始json方法
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * 获取客户端IP地址
 */
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null;
};

module.exports = {
  logOperation,
  createLogMiddleware,
  getClientIp
};
