/**
 * 用户路由
 * 处理用户的CRUD操作
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createLogMiddleware } = require('../middleware/logger');

/**
 * @route   GET /api/users/roles
 * @desc    获取角色选项
 * @access  Private (Admin)
 */
router.get('/roles', authenticate, requireAdmin, userController.getRoles);

/**
 * @route   GET /api/users
 * @desc    获取用户列表
 * @access  Private (Admin)
 */
router.get('/', authenticate, requireAdmin, userController.getUsers);

/**
 * @route   POST /api/users
 * @desc    创建用户
 * @access  Private (Admin)
 */
router.post('/', 
  authenticate, 
  requireAdmin,
  createLogMiddleware('用户', '新增'),
  userController.createUser
);

/**
 * @route   GET /api/users/:id
 * @desc    获取用户详情
 * @access  Private (Admin)
 */
router.get('/:id', authenticate, requireAdmin, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    更新用户
 * @access  Private (Admin)
 */
router.put('/:id', 
  authenticate, 
  requireAdmin,
  createLogMiddleware('用户', '编辑'),
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    删除用户
 * @access  Private (Admin)
 */
router.delete('/:id', 
  authenticate, 
  requireAdmin,
  createLogMiddleware('用户', '删除'),
  userController.deleteUser
);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    重置用户密码
 * @access  Private (Admin)
 */
router.put('/:id/reset-password', 
  authenticate, 
  requireAdmin,
  createLogMiddleware('用户', '重置密码'),
  userController.resetPassword
);

module.exports = router;
