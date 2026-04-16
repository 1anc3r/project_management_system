/**
 * JWT认证中间件
 * 验证用户身份和权限
 */
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

/**
 * 验证JWT Token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7);
    
    // 验证Token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 查询用户信息
    const users = await query(
      'SELECT id, username, nickname, role, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    const user = users[0];

    if (user.status !== 1) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用'
      });
    }

    // 将用户信息附加到请求对象
    req.user = {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '登录已过期，请重新登录'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的认证令牌'
      });
    }

    console.error('认证错误:', error);
    return res.status(500).json({
      code: 500,
      message: '认证失败'
    });
  }
};

/**
 * 验证管理员权限
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '需要管理员权限'
    });
  }
  next();
};

/**
 * 验证管理员或全局用户权限
 */
const requireAdminOrGlobal = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'global') {
    return res.status(403).json({
      code: 403,
      message: '权限不足'
    });
  }
  next();
};

/**
 * 生成JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = {
  authenticate,
  requireAdmin,
  requireAdminOrGlobal,
  generateToken
};
