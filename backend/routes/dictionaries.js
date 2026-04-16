/**
 * 字典路由
 * 处理字典的CRUD操作
 */
const express = require('express');
const router = express.Router();
const dictionaryController = require('../controllers/dictionaryController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createLogMiddleware } = require('../middleware/logger');

/**
 * @route   GET /api/dictionaries/code/:dictCode
 * @desc    根据字典编码获取字典项（公开接口，用于前端下拉选择）
 * @access  Private
 */
router.get('/code/:dictCode', authenticate, dictionaryController.getDictionaryByCode);

/**
 * @route   GET /api/dictionaries
 * @desc    获取字典列表
 * @access  Private (Admin)
 */
router.get('/', authenticate, requireAdmin, dictionaryController.getDictionaries);

/**
 * @route   POST /api/dictionaries
 * @desc    创建字典
 * @access  Private (Admin)
 */
router.post('/', 
  authenticate, 
  requireAdmin,
  createLogMiddleware('字典', '新增'),
  dictionaryController.createDictionary
);

/**
 * @route   GET /api/dictionaries/:id
 * @desc    获取字典详情
 * @access  Private (Admin)
 */
router.get('/:id', authenticate, requireAdmin, dictionaryController.getDictionaryById);

/**
 * @route   PUT /api/dictionaries/:id
 * @desc    更新字典
 * @access  Private (Admin)
 */
router.put('/:id', 
  authenticate, 
  requireAdmin,
  createLogMiddleware('字典', '编辑'),
  dictionaryController.updateDictionary
);

/**
 * @route   DELETE /api/dictionaries/:id
 * @desc    删除字典
 * @access  Private (Admin)
 */
router.delete('/:id', 
  authenticate, 
  requireAdmin,
  createLogMiddleware('字典', '删除'),
  dictionaryController.deleteDictionary
);

/**
 * @route   POST /api/dictionaries/:id/items
 * @desc    添加字典项
 * @access  Private (Admin)
 */
router.post('/:id/items', 
  authenticate, 
  requireAdmin,
  createLogMiddleware('字典项', '新增'),
  dictionaryController.addDictionaryItem
);

/**
 * @route   PUT /api/dictionaries/:id/items/:itemId
 * @desc    更新字典项
 * @access  Private (Admin)
 */
router.put('/:id/items/:itemId', 
  authenticate, 
  requireAdmin,
  createLogMiddleware('字典项', '编辑'),
  dictionaryController.updateDictionaryItem
);

/**
 * @route   DELETE /api/dictionaries/:id/items/:itemId
 * @desc    删除字典项
 * @access  Private (Admin)
 */
router.delete('/:id/items/:itemId', 
  authenticate, 
  requireAdmin,
  createLogMiddleware('字典项', '删除'),
  dictionaryController.deleteDictionaryItem
);

module.exports = router;
