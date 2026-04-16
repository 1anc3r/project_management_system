/**
 * 操作日志路由
 * 处理日志的查询和导出
 */
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/logs/filters
 * @desc    获取筛选选项
 * @access  Private (Admin)
 */
router.get('/filters', authenticate, requireAdmin, logController.getFilterOptions);

/**
 * @route   GET /api/logs/export
 * @desc    导出操作日志
 * @access  Private (Admin)
 */
router.get('/export', authenticate, requireAdmin, logController.exportLogs);

/**
 * @route   GET /api/logs
 * @desc    获取操作日志列表
 * @access  Private (Admin)
 */
router.get('/', authenticate, requireAdmin, logController.getLogs);

module.exports = router;
