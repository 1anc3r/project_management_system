/**
 * 项目路由
 * 处理项目的CRUD操作
 */
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { createLogMiddleware } = require('../middleware/logger');

/**
 * @route   GET /api/projects/dashboard
 * @desc    获取数据概览
 * @access  Private
 */
router.get('/dashboard', authenticate, projectController.getDashboard);

/**
 * @route   GET /api/projects/city-distribution
 * @desc    获取项目城市分布统计
 * @access  Private
 */
router.get('/city-distribution', authenticate, projectController.getCityDistribution);

/**
 * @route   GET /api/projects/filters
 * @desc    获取筛选选项
 * @access  Private
 */
router.get('/filters', authenticate, projectController.getFilterOptions);

/**
 * @route   GET /api/projects/export
 * @desc    导出项目
 * @access  Private
 */
router.get('/export', authenticate, projectController.exportProjects);

/**
 * @route   POST /api/projects/import
 * @desc    导入项目
 * @access  Private
 */
router.post('/import', 
  authenticate, 
  upload.single('file'),
  handleUploadError,
  projectController.importProjects
);

/**
 * @route   GET /api/projects
 * @desc    获取项目列表
 * @access  Private
 */
router.get('/', authenticate, projectController.getProjects);

/**
 * @route   POST /api/projects
 * @desc    创建项目
 * @access  Private
 */
router.post('/', 
  authenticate, 
  createLogMiddleware('项目', '新增'),
  projectController.createProject
);

/**
 * @route   GET /api/projects/:id
 * @desc    获取项目详情
 * @access  Private
 */
router.get('/:id', authenticate, projectController.getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    更新项目
 * @access  Private
 */
router.put('/:id', 
  authenticate, 
  createLogMiddleware('项目', '编辑'),
  projectController.updateProject
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    删除项目
 * @access  Private
 */
router.delete('/:id', 
  authenticate, 
  createLogMiddleware('项目', '删除'),
  projectController.deleteProject
);

module.exports = router;
