/**
 * 企业项目全生命周期管理系统 - 后端服务入口
 * Node.js + Express
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { testConnection } = require('./config/db');
const { authenticate, checkStaticFileAccess } = require('./middleware/auth');

// 导入路由
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const partnerRoutes = require('./routes/partners');
const userRoutes = require('./routes/users');
const logRoutes = require('./routes/logs');
const attachmentRoutes = require('./routes/attachments');
const dictionaryRoutes = require('./routes/dictionaries');
const informationRoutes = require('./routes/information');
const knowledgeRoutes = require('./routes/knowledge');
const opportunityRoutes = require('./routes/opportunities');

// 创建Express应用
const app = express();

// 安全响应头
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' }
}));

// 响应压缩
app.use(compression());

// 中间件配置
// 注意：生产环境 origin:false 依赖"前后端同源部署"（Nginx 反代 /api 与 /uploads），
// 若前后端分离部署需改为明确的域名白名单
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// API 全局限流
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
});
app.use('/api/', apiLimiter);

// 登录接口严格限流（防暴力破解）
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '登录尝试过于频繁，请1分钟后再试' }
});
app.use('/api/auth/login', loginLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务（上传的文件）
// 鉴权方式：Header JWT 或绑定单个文件的短期 access_token
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', authenticate, checkStaticFileAccess, express.static(uploadsPath));

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
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/dictionaries', dictionaryRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/information', informationRoutes);
app.use('/api/knowledge', knowledgeRoutes);

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
