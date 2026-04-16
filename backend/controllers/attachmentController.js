/**
 * 附件控制器
 * 处理附件的上传、下载、删除
 */
const { query } = require('../config/db');
const { deleteFile, getFileUrl } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// 从字典表获取附件类型
const getAttachmentTypesFromDB = async () => {
  try {
    const items = await query(
      `SELECT di.item_name 
       FROM dictionary_items di
       JOIN dictionaries d ON di.dict_id = d.id
       WHERE d.dict_code = 'attachment_type' AND di.status = 1 AND d.status = 1
       ORDER BY di.sort_order ASC`
    );
    return items.map(item => item.item_name);
  } catch (error) {
    console.error('获取附件类型失败:', error);
    // 返回默认类型
    return ['测算表', '报价函', '合同/协议', '补充合同/协议', '法律审查意见书', '营业执照', '验收报告', '其他'];
  }
};

// 验证附件类型
const validateAttachmentType = async (type) => {
  const types = await getAttachmentTypesFromDB();
  return types.includes(type);
};

/**
 * 上传附件
 * POST /api/attachments
 */
const uploadAttachment = async (req, res) => {
  try {
    const { project_id, attachment_type } = req.body;

    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的文件'
      });
    }

    if (!project_id) {
      // 删除已上传的文件
      deleteFile(req.file.filename);
      return res.status(400).json({
        code: 400,
        message: '项目ID不能为空'
      });
    }

    // 验证附件类型
    if (attachment_type && !validateAttachmentType(attachment_type)) {
      deleteFile(req.file.filename);
      return res.status(400).json({
        code: 400,
        message: '无效的附件类型'
      });
    }

    // 检查项目是否存在
    const projects = await query(
      'SELECT id FROM projects WHERE id = ?',
      [project_id]
    );

    if (projects.length === 0) {
      deleteFile(req.file.filename);
      return res.status(404).json({
        code: 404,
        message: '项目不存在'
      });
    }

    // 处理文件名编码问题
    let originalName = req.file.originalname;
    // 如果文件名包含乱码字符，尝试修复
    if (/[\ufffd]/.test(originalName) || !/[\u4e00-\u9fa5]/.test(originalName)) {
      try {
        originalName = Buffer.from(originalName, 'binary').toString('utf8');
      } catch (e) {
        // 转换失败则保持原样
      }
    }

    // 保存附件记录
    const result = await query(
      `INSERT INTO attachments (project_id, attachment_type, file_path, file_name, file_size) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        project_id,
        attachment_type || '其他',
        req.file.filename,
        originalName,
        req.file.size
      ]
    );
    console.error("文件上传成功")

    res.status(201).json({
      code: 201,
      message: '文件上传成功',
      data: {
        id: result.insertId,
        project_id: parseInt(project_id),
        attachment_type: attachment_type || '其他',
        file_name: originalName,
        file_size: req.file.size,
        file_url: getFileUrl(req.file.filename)
      }
    });
  } catch (error) {
    console.error('上传附件错误:', error);
    // 删除已上传的文件
    if (req.file) {
      deleteFile(req.file.filename);
    }
    res.status(500).json({
      code: 500,
      message: '文件上传失败'
    });
  }
};

/**
 * 获取项目附件列表
 * GET /api/attachments/project/:projectId
 */
const getAttachmentsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const attachments = await query(
      `SELECT id, project_id, attachment_type, file_path, file_name, file_size, created_at 
       FROM attachments WHERE project_id = ? ORDER BY created_at DESC`,
      [projectId]
    );

    // 添加文件URL
    const attachmentsWithUrl = attachments.map(att => ({
      ...att,
      file_url: getFileUrl(att.file_path)
    }));

    res.json({
      code: 200,
      data: attachmentsWithUrl
    });
  } catch (error) {
    console.error('获取附件列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取附件列表失败'
    });
  }
};

/**
 * 下载附件
 * GET /api/attachments/:id/download
 */
const downloadAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const attachments = await query(
      'SELECT file_path, file_name FROM attachments WHERE id = ?',
      [id]
    );

    if (attachments.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '附件不存在'
      });
    }

    const attachment = attachments[0];
    const filePath = path.join(__dirname, '..', 'uploads', attachment.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        code: 404,
        message: '文件不存在'
      });
    }

    // 设置下载头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.file_name)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // 发送文件
    res.sendFile(filePath);
  } catch (error) {
    console.error('下载附件错误:', error);
    res.status(500).json({
      code: 500,
      message: '下载附件失败'
    });
  }
};

/**
 * 删除附件
 * DELETE /api/attachments/:id
 */
const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const attachments = await query(
      'SELECT file_path, file_name FROM attachments WHERE id = ?',
      [id]
    );

    if (attachments.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '附件不存在'
      });
    }

    const attachment = attachments[0];

    // 删除物理文件
    await deleteFile(attachment.file_path);

    // 删除数据库记录
    await query('DELETE FROM attachments WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: '附件删除成功',
      data: { id: parseInt(id), file_name: attachment.file_name }
    });
  } catch (error) {
    console.error('删除附件错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除附件失败'
    });
  }
};

/**
 * 获取附件类型选项
 * GET /api/attachments/types
 */
const getAttachmentTypes = async (req, res) => {
  try {
    const types = await getAttachmentTypesFromDB();
    res.json({
      code: 200,
      data: types
    });
  } catch (error) {
    console.error('获取附件类型错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取附件类型失败'
    });
  }
};

/**
 * 更新附件类型
 * PUT /api/attachments/:id
 */
const updateAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { attachment_type } = req.body;

    // 验证附件类型
    const isValid = await validateAttachmentType(attachment_type);
    if (!attachment_type || !isValid) {
      return res.status(400).json({
        code: 400,
        message: '无效的附件类型'
      });
    }

    // 检查附件是否存在
    const attachments = await query(
      'SELECT id, file_name FROM attachments WHERE id = ?',
      [id]
    );

    if (attachments.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '附件不存在'
      });
    }

    // 更新附件类型
    await query(
      'UPDATE attachments SET attachment_type = ? WHERE id = ?',
      [attachment_type, id]
    );

    res.json({
      code: 200,
      message: '附件类型更新成功',
      data: {
        id: parseInt(id),
        attachment_type,
        file_name: attachments[0].file_name
      }
    });
  } catch (error) {
    console.error('更新附件类型错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新附件类型失败'
    });
  }
};

module.exports = {
  uploadAttachment,
  getAttachmentsByProject,
  downloadAttachment,
  deleteAttachment,
  getAttachmentTypes,
  updateAttachment
};
