/**
 * 合作方路由
 * 处理合作方的CRUD操作
 */
const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { authenticate } = require('../middleware/auth');
const { createLogMiddleware } = require('../middleware/logger');

/**
 * @route   GET /api/partners/types
 * @desc    获取合作方类型选项
 * @access  Private
 */
router.get('/types', authenticate, partnerController.getPartnerTypes);

/**
 * @route   GET /api/partners/all
 * @desc    获取所有合作方（下拉选择用）
 * @access  Private
 */
router.get('/all', authenticate, partnerController.getAllPartners);

/**
 * @route   GET /api/partners/search
 * @desc    搜索合作方
 * @access  Private
 */
router.get('/search', authenticate, partnerController.searchPartners);

/**
 * @route   GET /api/partners/export
 * @desc    导出合作方
 * @access  Private
 */
router.get('/export', authenticate, partnerController.exportPartners);

/**
 * @route   GET /api/partners
 * @desc    获取合作方列表
 * @access  Private
 */
router.get('/', authenticate, partnerController.getPartners);

/**
 * @route   POST /api/partners
 * @desc    创建合作方
 * @access  Private
 */
router.post('/', 
  authenticate, 
  createLogMiddleware('合作方', '新增'),
  partnerController.createPartner
);

/**
 * @route   GET /api/partners/:id
 * @desc    获取合作方详情
 * @access  Private
 */
router.get('/:id', authenticate, partnerController.getPartnerById);

/**
 * @route   PUT /api/partners/:id
 * @desc    更新合作方
 * @access  Private
 */
router.put('/:id', 
  authenticate, 
  createLogMiddleware('合作方', '编辑'),
  partnerController.updatePartner
);

/**
 * @route   DELETE /api/partners/:id
 * @desc    删除合作方
 * @access  Private
 */
router.delete('/:id', 
  authenticate, 
  createLogMiddleware('合作方', '删除'),
  partnerController.deletePartner
);

module.exports = router;
