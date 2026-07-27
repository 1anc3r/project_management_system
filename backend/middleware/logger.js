/**
 * 操作日志中间件
 * 记录用户操作日志
 *
 * 安全说明：
 * 1. 敏感字段（密码、Token、银行账号等）在写入日志前统一脱敏为 ***
 * 2. 同时拦截 res.json 与 res.send，确保导出/预览等接口也被审计覆盖
 */
const { query } = require('../config/db');

// 需要脱敏的敏感字段（统一小写比较）
const SENSITIVE_KEYS = new Set([
  'password',
  'oldpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'authorization',
  'bank_account',
  'id_card'
]);

/**
 * 递归脱敏对象中的敏感字段
 * @param {*} obj - 任意输入
 * @returns {*} 脱敏后的副本
 */
const redact = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '***' : redact(value);
  }
  return result;
};

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
        content ? JSON.stringify(redact(content)) : null,
        ip || null
      ]
    );
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
};

/**
 * 创建日志记录中间件
 * 同时拦截 res.json 与 res.send，避免导出、文件下载等绕过审计
 * @param {String} module - 模块名称
 * @param {String} operation - 操作类型
 */
const createLogMiddleware = (module, operation) => {
  return async (req, res, next) => {
    let logged = false;

    const tryLog = (data) => {
      if (logged) return;

      // send/json 可能传入对象、JSON 字符串或 Buffer，统一尝试解析
      let parsed = data;
      if (Buffer.isBuffer(data) || typeof data === 'string') {
        try {
          parsed = JSON.parse(data.toString());
        } catch {
          parsed = null;
        }
      }

      // 判定成功：业务码成功，或非 JSON 响应但 HTTP 状态为 2xx（如文件导出）
      const success =
        (parsed && (parsed.code === 200 || parsed.code === 201 || parsed.code === 0)) ||
        (!parsed && res.statusCode >= 200 && res.statusCode < 300);
      if (!success) return;

      logged = true;
      const logData = {
        userId: req.user?.userId,
        username: req.user?.username,
        module,
        operation,
        targetId: parsed?.data?.id || req.params?.id || null,
        targetName: parsed?.data?.name || req.body?.name ||
          parsed?.data?.nickname || req.body?.nickname ||
          parsed?.data?.information_title || req.body?.information_title ||
          parsed?.data?.question || req.body?.question ||
          parsed?.data?.item_name || req.body?.item_name ||
          parsed?.data?.file_name || null,
        content: {
          body: req.body,
          params: req.params,
          query: req.query,
          // 二进制/大体积响应不写入日志，仅记录提示
          result: parsed || `[非JSON响应] Content-Type: ${res.getHeader('content-type') || 'unknown'}`
        },
        ip: req.ip || req.connection?.remoteAddress || null
      };

      logOperation(logData);
    };

    // 注意：Express 中 res.json 内部会调用 res.send，
    // logged 标记保证只记录一次
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = function (data) {
      tryLog(data);
      return originalJson(data);
    };

    res.send = function (data) {
      tryLog(data);
      return originalSend(data);
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
  getClientIp,
  redact
};
