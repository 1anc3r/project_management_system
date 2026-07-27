/**
 * JWT认证中间件
 * 验证用户身份和权限
 *
 * 安全说明：
 * 1. 生产环境必须配置 JWT_SECRET，缺失时启动即失败，杜绝硬编码密钥伪造 Token
 * 2. 文件访问（预览/下载/静态资源）使用独立的短期作用域凭证 access_token，
 *    不再支持在 URL 中传递登录 JWT，避免凭证进入 Nginx 日志、浏览器历史与 Referer
 */
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// JWT密钥：生产环境未配置时直接抛错，启动失败
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('生产环境必须配置 JWT_SECRET 环境变量'); })()
    : 'dev-only-insecure-secret'
);

// 文件访问凭证作用域标识
const FILE_ACCESS_SCOPE = 'file_access';

/**
 * 验证JWT Token
 * 支持：
 *  - Header: Authorization: Bearer <token>（标准业务接口）
 *  - Query: ?access_token=<scoped_token>（仅文件预览/下载场景，短期、绑定单个文件）
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 优先从 Header 获取
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 文件访问场景：短期作用域凭证（绑定单个文件，不能用于业务接口之外）
    if (!token && req.query.access_token) {
      try {
        const decoded = jwt.verify(req.query.access_token, JWT_SECRET);
        if (decoded.scope !== FILE_ACCESS_SCOPE) {
          return res.status(401).json({
            code: 401,
            message: '无效的文件访问凭证'
          });
        }
        // 挂载文件授权信息，由具体路由/中间件校验文件归属
        req.fileAccess = { kind: decoded.kind, id: decoded.id, file: decoded.file };
        req.user = { userId: null, username: 'file-access', nickname: '文件访问', role: 'file-access' };
        return next();
      } catch (error) {
        return res.status(401).json({
          code: 401,
          message: error.name === 'TokenExpiredError' ? '文件访问凭证已过期' : '无效的文件访问凭证'
        });
      }
    }

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

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
 * 校验文件级访问凭证是否与请求的资源匹配
 * 用于附件预览/下载等通过 access_token 访问的场景；
 * 通过 Header JWT 认证的用户（req.fileAccess 为空）直接放行
 */
const checkFileAccess = (req, res, next) => {
  if (!req.fileAccess) return next();

  if (req.fileAccess.kind === 'id' && String(req.fileAccess.id) === String(req.params.id)) {
    return next();
  }

  return res.status(403).json({
    code: 403,
    message: '无权访问该文件'
  });
};

/**
 * 校验 /uploads 静态文件访问凭证
 * access_token 必须绑定当前请求的具体文件名
 */
const checkStaticFileAccess = (req, res, next) => {
  if (!req.fileAccess) return next();

  const requested = decodeURIComponent(req.path).replace(/^\//, '');
  if (req.fileAccess.kind === 'file' && req.fileAccess.file === requested) {
    return next();
  }

  return res.status(403).json({
    code: 403,
    message: '无权访问该文件'
  });
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

/**
 * 生成文件访问凭证（短期、绑定单个文件）
 * @param {Object} payload - { kind: 'id', id } 或 { kind: 'file', file }
 * @param {String} expiresIn - 有效期，默认 30 分钟
 */
const generateFileAccessToken = (payload, expiresIn = '30m') => {
  return jwt.sign(
    { scope: FILE_ACCESS_SCOPE, ...payload },
    JWT_SECRET,
    { expiresIn }
  );
};

module.exports = {
  authenticate,
  requireAdmin,
  requireAdminOrGlobal,
  generateToken,
  generateFileAccessToken,
  checkFileAccess,
  checkStaticFileAccess
};
