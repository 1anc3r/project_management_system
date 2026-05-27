/**
 * 知识库路由
 * 处理知识库的CRUD操作、搜索、导入导出
 */
const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { createLogMiddleware } = require('../middleware/logger');

/**
 * @route   GET /api/knowledge/filters
 * @desc    获取筛选选项（分类、热门标签）
 * @access  Private
 */
router.get('/filters', authenticate, knowledgeController.getFilters);

/**
 * @route   GET /api/knowledge/export
 * @desc    导出知识库
 * @access  Private
 */
router.get('/export', authenticate, knowledgeController.export);

/**
 * @route   POST /api/knowledge/import
 * @desc    导入知识库（仅管理员和全局用户）
 * @access  Private (Admin/Global)
 */
router.post('/import', 
  authenticate, 
  upload.single('file'),
  handleUploadError,
  knowledgeController.import
);

/**
 * @route   POST /api/knowledge/batch-delete
 * @desc    批量删除知识条目
 * @access  Private
 */
router.post('/batch-delete', authenticate, knowledgeController.batchDelete);

/**
 * @route   GET /api/knowledge
 * @desc    获取知识库列表（分页/筛选/搜索）
 * @access  Private
 */
router.get('/', authenticate, knowledgeController.getList);

/**
 * @route   POST /api/knowledge
 * @desc    创建知识条目
 * @access  Private
 */
router.post('/', 
  authenticate, 
  createLogMiddleware('knowledge', 'create'),
  knowledgeController.create
);

/**
 * @route   GET /api/knowledge/:id
 * @desc    获取知识详情
 * @access  Private
 */
router.get('/:id', authenticate, knowledgeController.getDetail);

/**
 * @route   PUT /api/knowledge/:id
 * @desc    更新知识条目
 * @access  Private
 */
router.put('/:id', 
  authenticate, 
  createLogMiddleware('knowledge', 'update'),
  knowledgeController.update
);

/**
 * @route   DELETE /api/knowledge/:id
 * @desc    删除知识条目
 * @access  Private
 */
router.delete('/:id', 
  authenticate, 
  createLogMiddleware('knowledge', 'delete'),
  knowledgeController.delete
);

/**
 * @route   POST /api/knowledge/:id/view
 * @desc    记录浏览
 * @access  Private
 */
router.post('/:id/view', authenticate, knowledgeController.recordView);

module.exports = router;
