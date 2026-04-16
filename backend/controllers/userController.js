/**
 * 用户控制器
 * 处理用户的CRUD操作
 */
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const xlsx = require('xlsx');
const moment = require('moment');

// 用户角色枚举
const USER_ROLES = [
  { value: 'admin', label: '管理员' },
  { value: 'global', label: '全局用户' },
  { value: 'normal', label: '普通用户' }
];

/**
 * 获取用户列表
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      role,
      status
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
      whereClause += ` AND (username LIKE ? OR nickname LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    // 角色筛选
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    // 状态筛选
    if (status !== undefined && status !== '') {
      whereClause += ' AND status = ?';
      params.push(parseInt(status));
    }

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询数据
    const users = await query(
      `SELECT 
        id, username, nickname, role, status, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({
      code: 200,
      data: {
        list: users,
        pagination: {
          page: pageNum,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户列表失败'
    });
  }
};

/**
 * 获取用户详情
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const users = await query(
      `SELECT id, username, nickname, role, status, created_at, updated_at FROM users WHERE id = ?`,
      [id]
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
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户详情失败'
    });
  }
};

/**
 * 创建用户
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { username, password, nickname, role, status } = req.body;

    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码长度不能少于6位'
      });
    }

    // 验证角色
    const validRoles = USER_ROLES.map(r => r.value);
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        code: 400,
        message: '无效的用户角色'
      });
    }

    // 检查用户名是否已存在
    const existingUsers = await query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await query(
      `INSERT INTO users (username, password, nickname, role, status) VALUES (?, ?, ?, ?, ?)`,
      [
        username,
        hashedPassword,
        nickname || null,
        role || 'normal',
        status !== undefined ? status : 1
      ]
    );

    res.status(201).json({
      code: 201,
      message: '用户创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建用户失败'
    });
  }
};

/**
 * 更新用户
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, role, status } = req.body;

    // 查询原用户
    const existingUsers = await query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 不能修改自己的角色（防止管理员误操作）
    if (parseInt(id) === req.user.userId && role) {
      return res.status(400).json({
        code: 400,
        message: '不能修改自己的角色'
      });
    }

    // 验证角色
    const validRoles = USER_ROLES.map(r => r.value);
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        code: 400,
        message: '无效的用户角色'
      });
    }

    // 构建更新字段
    const updateFields = [];
    const params = [];

    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      params.push(nickname);
    }

    if (role !== undefined) {
      updateFields.push('role = ?');
      params.push(role);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有要更新的字段'
      });
    }

    params.push(id);

    // 更新用户
    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      code: 200,
      message: '用户更新成功',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新用户失败'
    });
  }
};

/**
 * 删除用户
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        code: 400,
        message: '不能删除自己的账号'
      });
    }

    // 查询原用户
    const existingUsers = await query(
      'SELECT username FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 删除用户
    await query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: '用户删除成功',
      data: { id: parseInt(id), username: existingUsers[0].username }
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除用户失败'
    });
  }
};

/**
 * 重置用户密码
 * PUT /api/users/:id/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // 参数验证
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '新密码长度不能少于6位'
      });
    }

    // 查询原用户
    const existingUsers = await query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    res.json({
      code: 200,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      code: 500,
      message: '重置密码失败'
    });
  }
};

/**
 * 获取角色选项
 * GET /api/users/roles
 */
const getRoles = async (req, res) => {
  try {
    res.json({
      code: 200,
      data: USER_ROLES
    });
  } catch (error) {
    console.error('获取角色选项错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取角色选项失败'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getRoles,
  USER_ROLES
};
