/**
 * 附件路由
 * 处理附件的上传、下载、删除
 */
const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { authenticate, checkFileAccess } = require('../middleware/auth');
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
 * @route   GET /api/attachments/knowledge/:knowledgeId
 * @desc    获取知识库附件列表
 * @access  Private
 */
router.get('/knowledge/:knowledgeId', authenticate, attachmentController.getAttachmentsByKnowledge);

/**
 * @route   POST /api/attachments/image
 * @desc    上传图片（专用于富文本编辑器）
 * @access  Private
 */
router.post('/image',
  authenticate,
  upload.single('file'),
  handleUploadError,
  attachmentController.uploadImage
);

/**
 * @route   POST /api/attachments/access-tokens
 * @desc    签发文件访问凭证（短期、绑定单个文件，用于预览/下载免 URL 传登录 JWT）
 * @access  Private
 */
router.post('/access-tokens', authenticate, attachmentController.issueAccessTokens);

/**
 * @route   GET /api/attachments/:id/preview
 * @desc    图片预览
 * @access  Private
 */
router.get('/:id/preview', authenticate, checkFileAccess, attachmentController.previewImage);

/**
 * @route   GET /api/attachments/:id/view
 * @desc    通用文件预览（设置正确 Content-Type 供浏览器内联显示）
 * @access  Private
 */
router.get('/:id/view', authenticate, checkFileAccess, attachmentController.previewFile);

/**
 * @route   GET /api/attachments/:id/content
 * @desc    获取文本文件内容
 * @access  Private
 */
router.get('/:id/content', authenticate, checkFileAccess, attachmentController.getFileContent);

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
router.get('/:id/download', authenticate, checkFileAccess, attachmentController.downloadAttachment);

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
