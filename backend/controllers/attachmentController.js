/**
 * 附件控制器
 * 处理附件的上传、下载、删除、图片上传
 */
const { query } = require('../config/db');
const { deleteFile, getFileUrl } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const { ATTACHMENT_TYPES, IMAGE_EXTENSIONS } = require('../config/const');

/**
 * 判断文件是否为图片
 * @param {string} filename - 文件名
 * @returns {boolean}
 */
const isImageFile = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
};

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
    return ATTACHMENT_TYPES;
  }
};

// 验证附件类型
const validateAttachmentType = async (type) => {
  const types = await getAttachmentTypesFromDB();
  return types.includes(type);
};

/**
 * 上传图片（专用于富文本编辑器）
 * POST /api/attachments/image
 * 返回图片URL，不关联到任何项目或知识条目
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的图片'
      });
    }

    // 验证是否为图片文件
    if (!isImageFile(req.file.originalname)) {
      deleteFile(req.file.filename);
      return res.status(400).json({
        code: 400,
        message: '仅支持图片文件（jpg, jpeg, png, gif, bmp, webp）'
      });
    }

    // 处理文件名编码问题
    let originalName = req.file.originalname;
    if (/[\ufffd]/.test(originalName) || !/[\u4e00-\u9fa5]/.test(originalName)) {
      try {
        originalName = Buffer.from(originalName, 'binary').toString('utf8');
      } catch (e) {
        // 转换失败则保持原样
      }
    }

    // 保存图片记录到数据库（不关联任何项目/知识，仅用于记录）
    const result = await query(
      `INSERT INTO attachments (attachment_type, file_path, file_name, file_size) 
       VALUES (?, ?, ?, ?)`,
      ['图片', req.file.filename, originalName, req.file.size]
    );

    const imageUrl = getFileUrl(req.file.filename);

    res.status(201).json({
      code: 201,
      message: '图片上传成功',
      data: {
        id: result.insertId,
        file_name: originalName,
        file_size: req.file.size,
        file_url: imageUrl,
        is_image: true
      }
    });
  } catch (error) {
    console.error('上传图片错误:', error);
    if (req.file) {
      deleteFile(req.file.filename);
    }
    res.status(500).json({
      code: 500,
      message: '图片上传失败'
    });
  }
};

/**
 * 获取图片预览
 * GET /api/attachments/:id/preview
 */
const previewImage = async (req, res) => {
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
    
    // 验证是否为图片
    if (!isImageFile(attachment.file_name)) {
      return res.status(400).json({
        code: 400,
        message: '该文件不是图片，无法预览'
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', attachment.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        code: 404,
        message: '文件不存在'
      });
    }

    // 设置图片Content-Type
    const ext = path.extname(attachment.file_name).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp'
    };
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    
    // 发送文件
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('图片预览错误:', error);
    res.status(500).json({
      code: 500,
      message: '图片预览失败'
    });
  }
};

/**
 * 上传附件
 * POST /api/attachments
 */
const uploadAttachment = async (req, res) => {
  try {
    const { project_id, knowledge_id, attachment_type } = req.body;

    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的文件'
      });
    }

    // 验证附件类型
    const isValidType = await validateAttachmentType(attachment_type);
    if (attachment_type && !isValidType) {
      deleteFile(req.file.filename);
      return res.status(400).json({
        code: 400,
        message: '无效的附件类型'
      });
    }

    // 如果指定了 project_id，检查项目是否存在
    if (project_id) {
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

    // 保存附件记录（支持 project_id 和 knowledge_id）
    let sql, sqlParams;
    if (project_id) {
      sql = `INSERT INTO attachments (project_id, attachment_type, file_path, file_name, file_size) 
             VALUES (?, ?, ?, ?, ?)`;
      sqlParams = [project_id, attachment_type || '其他', req.file.filename, originalName, req.file.size];
    } else if (knowledge_id) {
      sql = `INSERT INTO attachments (knowledge_id, attachment_type, file_path, file_name, file_size) 
             VALUES (?, ?, ?, ?, ?)`;
      sqlParams = [knowledge_id, attachment_type || '其他', req.file.filename, originalName, req.file.size];
    } else {
      // 临时附件（知识库表单中使用，稍后关联）
      sql = `INSERT INTO attachments (attachment_type, file_path, file_name, file_size) 
             VALUES (?, ?, ?, ?)`;
      sqlParams = [attachment_type || '其他', req.file.filename, originalName, req.file.size];
    }

    const result = await query(sql, sqlParams);
    console.log('文件上传成功:', originalName);

    res.status(201).json({
      code: 201,
      message: '文件上传成功',
      data: {
        id: result.insertId,
        project_id: project_id ? parseInt(project_id) : null,
        knowledge_id: knowledge_id ? parseInt(knowledge_id) : null,
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
 * 获取知识库附件列表
 * GET /api/attachments/knowledge/:knowledgeId
 */
const getAttachmentsByKnowledge = async (req, res) => {
  try {
    const { knowledgeId } = req.params;

    const attachments = await query(
      `SELECT id, knowledge_id, attachment_type, file_path, file_name, file_size, created_at 
       FROM attachments WHERE knowledge_id = ? ORDER BY created_at DESC`,
      [knowledgeId]
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
    console.error('获取知识库附件列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取知识库附件列表失败'
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
  uploadImage,
  previewImage,
  getAttachmentsByProject,
  getAttachmentsByKnowledge,
  downloadAttachment,
  deleteAttachment,
  getAttachmentTypes,
  updateAttachment
};
