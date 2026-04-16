/**
 * 附件路由
 * 处理附件的上传、下载、删除
 */
const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

/**
 * @route   GET /api/attachments/types
 * @desc    获取附件类型选项
 * @access  Private
 */
router.get('/types', authenticate, attachmentController.getAttachmentTypes);

/**
 * @route   GET /api/attachments/project/:projectId
 * @desc    获取项目附件列表
 * @access  Private
 */
router.get('/project/:projectId', authenticate, attachmentController.getAttachmentsByProject);

/**
 * @route   POST /api/attachments
 * @desc    上传附件
 * @access  Private
 */
router.post('/', 
  authenticate, 
  upload.single('file'),
  handleUploadError,
  attachmentController.uploadAttachment
);

/**
 * @route   GET /api/attachments/:id/download
 * @desc    下载附件
 * @access  Private
 */
router.get('/:id/download', authenticate, attachmentController.downloadAttachment);

/**
 * @route   DELETE /api/attachments/:id
 * @desc    删除附件
 * @access  Private
 */
router.delete('/:id', authenticate, attachmentController.deleteAttachment);

/**
 * @route   PUT /api/attachments/:id
 * @desc    更新附件类型
 * @access  Private
 */
router.put('/:id', authenticate, attachmentController.updateAttachment);

module.exports = router;
