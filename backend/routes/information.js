/**
 * 资讯路由
 * 处理资讯的CRUD操作
 */
const express = require('express');
const router = express.Router();
const informationController = require('../controllers/informationController');
const { authenticate } = require('../middleware/auth');
const { createLogMiddleware } = require('../middleware/logger');

/**
 * @route   GET /api/information/types
 * @desc    获取资讯类型选项
 * @access  Private
 */
router.get('/types', authenticate, informationController.getInformationTypes);

/**
 * @route   GET /api/information/by-partner/:partnerId
 * @desc    根据合作方ID获取资讯列表
 * @access  Private
 */
router.get('/by-partner/:partnerId', authenticate, informationController.getInformationByPartner);

/**
 * @route   GET /api/information/by-project/:projectId
 * @desc    根据项目ID获取资讯列表
 * @access  Private
 */
router.get('/by-project/:projectId', authenticate, informationController.getInformationByProject);

/**
 * @route   GET /api/information/all
 * @desc    获取所有资讯（仪表盘用）
 * @access  Private
 */
router.get('/all', authenticate, informationController.getAllInformation);

/**
 * @route   GET /api/information
 * @desc    获取资讯列表
 * @access  Private
 */
router.get('/', authenticate, informationController.getInformationList);

/**
 * @route   POST /api/information
 * @desc    创建资讯
 * @access  Private
 */
router.post('/', 
  authenticate, 
  createLogMiddleware('资讯', '新增'),
  informationController.createInformation
);

/**
 * @route   GET /api/information/:id
 * @desc    获取资讯详情
 * @access  Private
 */
router.get('/:id', authenticate, informationController.getInformationById);

/**
 * @route   PUT /api/information/:id
 * @desc    更新资讯
 * @access  Private
 */
router.put('/:id', 
  authenticate, 
  createLogMiddleware('资讯', '编辑'),
  informationController.updateInformation
);

/**
 * @route   DELETE /api/information/:id
 * @desc    删除资讯
 * @access  Private
 */
router.delete('/:id', 
  authenticate, 
  createLogMiddleware('资讯', '删除'),
  informationController.deleteInformation
);

module.exports = router;
