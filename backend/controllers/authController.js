/**
 * 认证控制器
 * 处理用户登录、登出等认证相关操作
 */
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateToken } = require('../middleware/auth');
const { logOperation, getClientIp } = require('../middleware/logger');

/**
 * 用户登录
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    // 查询用户
    const users = await query(
      'SELECT id, username, password, nickname, role, status FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    const user = users[0];

    // 检查账号状态
    if (user.status !== 1) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 生成JWT Token
    const token = generateToken(user.id);

    // 记录登录日志
    await logOperation({
      userId: user.id,
      username: user.username,
      module: '系统',
      operation: '登录',
      ip: getClientIp(req)
    });

    // 返回用户信息（不包含密码）
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败，请稍后重试'
    });
  }
};

/**
 * 用户登出
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // 记录登出日志
    await logOperation({
      userId: req.user.userId,
      username: req.user.username,
      module: '系统',
      operation: '登出',
      ip: getClientIp(req)
    });

    res.json({
      code: 200,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      code: 500,
      message: '登出失败'
    });
  }
};

/**
 * 获取当前用户信息
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    const users = await query(
      'SELECT id, username, nickname, role, status, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.json({
      code: 200,
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败'
    });
  }
};

/**
 * 修改密码
 * PUT /api/auth/password
 */
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // 参数验证
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '旧密码和新密码不能为空'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '新密码长度不能少于6位'
      });
    }

    // 查询用户
    const users = await query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, users[0].password);

    if (!isOldPasswordValid) {
      return res.status(400).json({
        code: 400,
        message: '旧密码错误'
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    // 记录日志
    await logOperation({
      userId,
      username: req.user.username,
      module: '系统',
      operation: '修改密码',
      ip: getClientIp(req)
    });

    res.json({
      code: 200,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      code: 500,
      message: '修改密码失败'
    });
  }
};

module.exports = {
  login,
  logout,
  getProfile,
  changePassword
};
