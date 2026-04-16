# 企业项目全生命周期管理系统

基于 Vue3 + Node.js + MySQL 开发的企业项目全生命周期管理系统，支持数据可视化、项目/合作方维护、权限控制、操作审计。

## 功能特性

- **数据概览仪表板**：项目统计、阶段分布饼图、项目金额趋势折线图
- **项目信息管理**：新增、编辑、删除、查询、排序、导入、导出
- **合作方信息管理**：合作方维护、自动填充
- **系统管理**：用户管理、权限控制、操作日志
- **多标签页布局**：支持标签页关闭、刷新、拖动
- **文件上传**：支持项目附件上传、下载、管理

## 技术栈

### 前端
- Vue 3 + Vite
- Element Plus UI组件库
- Pinia 状态管理
- Vue Router 路由管理
- ECharts 数据可视化
- Axios HTTP请求
- SortableJS 拖拽排序

### 后端
- Node.js + Express
- MySQL 8.0
- JWT 身份认证
- Multer 文件上传
- bcryptjs 密码加密

## 项目结构

```
project-management/
├── backend/                 # Node.js + Express 后端
│   ├── config/             # 数据库配置
│   ├── controllers/        # 控制器
│   ├── middleware/         # 中间件
│   ├── routes/             # API路由
│   ├── scripts/            # 脚本
│   ├── uploads/            # 文件上传目录
│   ├── .env                # 环境配置
│   ├── package.json
│   └── server.js           # 入口文件
├── frontend/               # Vue 3 + Vite 前端
│   ├── src/
│   │   ├── api/            # API接口
│   │   ├── assets/         # 静态资源
│   │   ├── components/     # 组件
│   │   ├── layouts/        # 布局
│   │   ├── router/         # 路由
│   │   ├── stores/         # Pinia状态管理
│   │   ├── utils/          # 工具函数
│   │   └── views/          # 页面
│   ├── package.json
│   └── vite.config.js
└── database/
    └── init.sql            # 数据库初始化脚本
```

## 快速开始

### 1. 克隆项目

```bash
cd project-management
```

### 2. 数据库配置

1. 安装 MySQL 8.0
2. 创建数据库：
```bash
mysql -u root -p < database/init.sql
```

### 3. 后端配置

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
# 编辑 .env 文件，修改数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=project_management

# 启动服务
npm start

# 或开发模式
npm run dev
```

后端服务默认运行在 http://localhost:3000

### 4. 前端配置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端开发服务器默认运行在 http://localhost:5173

### 5. 快速启动（一键启动前后端）

<!-- **Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
``` -->

**Windows:**
```bash
start.bat
```

### 6. 访问系统

打开浏览器访问 http://localhost:5173

默认管理员账号：
- 用户名：admin
- 密码：admin123

## 环境变量配置

### 后端 (.env)

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=project_management

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# 文件上传配置
UPLOAD_PATH=uploads
MAX_FILE_SIZE=52428800

# 默认管理员账号
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

## 部署说明

### 生产环境部署

1. **构建前端**
```bash
cd frontend
npm install
npm run build
```

2. **配置Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/project-management/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /uploads {
        proxy_pass http://localhost:3000;
    }
}
```

3. **启动后端服务**
```bash
cd backend
npm install
npm start
```

建议使用 PM2 管理 Node.js 进程：
```bash
npm install -g pm2
pm2 start server.js --name project-management
```

## 用户权限说明

- **管理员(admin)**：拥有所有权限，包括系统管理
- **全局用户(global)**：可以查看所有项目和合作方
- **普通用户(normal)**：只能查看自己创建的项目

## API 文档

### 认证接口
- POST `/api/auth/login` - 登录
- POST `/api/auth/logout` - 登出
- GET `/api/auth/profile` - 获取用户信息
- PUT `/api/auth/password` - 修改密码

### 项目接口
- GET `/api/projects` - 获取项目列表
- POST `/api/projects` - 创建项目
- GET `/api/projects/:id` - 获取项目详情
- PUT `/api/projects/:id` - 更新项目
- DELETE `/api/projects/:id` - 删除项目
- GET `/api/projects/export` - 导出项目
- POST `/api/projects/import` - 导入项目
- GET `/api/projects/dashboard` - 获取数据概览

### 合作方接口
- GET `/api/partners` - 获取合作方列表
- POST `/api/partners` - 创建合作方
- GET `/api/partners/:id` - 获取合作方详情
- PUT `/api/partners/:id` - 更新合作方
- DELETE `/api/partners/:id` - 删除合作方
- GET `/api/partners/export` - 导出合作方

### 用户接口
- GET `/api/users` - 获取用户列表
- POST `/api/users` - 创建用户
- PUT `/api/users/:id` - 更新用户
- DELETE `/api/users/:id` - 删除用户

### 日志接口
- GET `/api/logs` - 获取操作日志
- GET `/api/logs/export` - 导出日志

## 注意事项

1. 首次启动后端服务时，会自动创建默认管理员账号
2. 请修改默认管理员密码以确保系统安全
3. 文件上传目录需要确保有写入权限
4. 生产环境请修改 JWT_SECRET 为强密钥

## 许可证

MIT License
