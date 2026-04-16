/**
 * 文件上传中间件
 * 使用multer处理文件上传
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 上传目录
const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads';

// 确保上传目录存在
const ensureUploadDir = () => {
  const uploadPath = path.join(__dirname, '..', UPLOAD_PATH);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = ensureUploadDir();
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名: UUID_原始文件名
    // 处理中文文件名编码问题
    let originalName = file.originalname;
    
    // 如果文件名是乱码，尝试从latin1转换为utf8
    if (/[\ufffd]/.test(originalName) || !/[\u4e00-\u9fa5]/.test(originalName)) {
      try {
        originalName = Buffer.from(originalName, 'binary').toString('utf8');
      } catch (e) {
        // 转换失败则保持原样
      }
    }
    
    const uniqueName = `${uuidv4()}_${originalName}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    // 文档
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    // 图片
    '.jpg', '.jpeg', '.png', '.gif', '.bmp',
    // 压缩包
    '.zip', '.rar', '.7z',
    // 文本
    '.txt', '.csv', '.json'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}`), false);
  }
};

// 上传配置
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 默认50MB
    files: 10 // 最多同时上传10个文件
  }
});

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: '文件大小超过限制'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        code: 400,
        message: '文件数量超过限制'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        code: 400,
        message: '意外的文件字段'
      });
    }
    return res.status(400).json({
      code: 400,
      message: `上传错误: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      code: 400,
      message: err.message
    });
  }
  
  next();
};

// 删除文件
const deleteFile = (filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(ensureUploadDir(), filename);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    } else {
      resolve(false);
    }
  });
};

// 获取文件URL
const getFileUrl = (filename) => {
  return `/uploads/${filename}`;
};

module.exports = {
  upload,
  handleUploadError,
  deleteFile,
  getFileUrl,
  UPLOAD_PATH
};
