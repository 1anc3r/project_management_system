/**
 * 企业项目全生命周期管理系统 - 后端服务入口
 * Node.js + Express
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { testConnection } = require('./config/db');
const { authenticate } = require('./middleware/auth');

// 导入路由
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const partnerRoutes = require('./routes/partners');
const userRoutes = require('./routes/users');
const logRoutes = require('./routes/logs');
const attachmentRoutes = require('./routes/attachments');
const dictionaryRoutes = require('./routes/dictionaries');

// 创建Express应用
const app = express();

// 中间件配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务（上传的文件）
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', authenticate, express.static(uploadsPath));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/dictionaries', dictionaryRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║     企业项目全生命周期管理系统 - 后端服务              ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log(`║  服务地址: http://localhost:${PORT}                       ║`);
      console.log('║  API文档: http://localhost:' + PORT + '/api/*                  ║');
      console.log('╚════════════════════════════════════════════════════════╝');
    });
  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
