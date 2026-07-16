/**
 * 商机路由
 * 处理商机的CRUD操作
 */
const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');
const { authenticate } = require('../middleware/auth');
const { createLogMiddleware } = require('../middleware/logger');

/**
 * @route   GET /api/opportunities/filters
 * @desc    获取筛选选项
 * @access  Private
 */
router.get('/filters', authenticate, opportunityController.getFilterOptions);

/**
 * @route   GET /api/opportunities/export
 * @desc    导出商机
 * @access  Private
 */
router.get('/export', authenticate, opportunityController.exportOpportunities);

/**
 * @route   GET /api/opportunities
 * @desc    获取商机列表
 * @access  Private
 */
router.get('/', authenticate, opportunityController.getOpportunities);

/**
 * @route   POST /api/opportunities
 * @desc    创建商机
 * @access  Private
 */
router.post('/', 
  authenticate, 
  createLogMiddleware('商机', '新增'),
  opportunityController.createOpportunity
);

/**
 * @route   GET /api/opportunities/:id
 * @desc    获取商机详情
 * @access  Private
 */
router.get('/:id', authenticate, opportunityController.getOpportunityById);

/**
 * @route   PUT /api/opportunities/:id
 * @desc    更新商机
 * @access  Private
 */
router.put('/:id', 
  authenticate, 
  createLogMiddleware('商机', '编辑'),
  opportunityController.updateOpportunity
);

/**
 * @route   DELETE /api/opportunities/:id
 * @desc    删除商机
 * @access  Private
 */
router.delete('/:id', 
  authenticate, 
  createLogMiddleware('商机', '删除'),
  opportunityController.deleteOpportunity
);

module.exports = router;
