# 企业项目全生命周期管理系统

一套面向企业项目管理场景的 Web 应用，覆盖项目从意向到完结的全生命周期管理，包括合作方管理、款项跟踪、附件归档、数据可视化分析等功能。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus + Vue Router + Pinia |
| 图表 | ECharts + vue-echarts |
| 地图 | Leaflet + 天地图瓦片 |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8.0（含 ngram 全文索引） |
| 其他 | Multer（文件上传）、xlsx（Excel 处理）、bcryptjs（密码加密）、JWT（认证） |

---

## 目录结构

```
project-management/
├── backend/                  # 后端服务
│   ├── config/
│   │   └── db.js             # MySQL 数据库连接池配置
│   ├── controllers/          # 业务控制器
│   │   ├── authController.js        # 认证（登录/登出/个人信息）
│   │   ├── projectController.js     # 项目（CRUD/导入导出/数据概览/城市分布）
│   │   ├── partnerController.js     # 合作方（CRUD/搜索/导出）
│   │   ├── userController.js        # 用户（CRUD/重置密码）
│   │   ├── informationController.js # 资讯（CRUD/搜索）
│   │   ├── knowledgeController.js   # 知识库（CRUD/全文搜索/导入导出）
│   │   ├── attachmentController.js  # 附件（上传/下载/删除）
│   │   ├── dictionaryController.js  # 字典（CRUD/字典项管理）
│   │   └── logController.js         # 操作日志（查询/导出）
│   ├── middleware/           # 中间件
│   │   ├── auth.js           # JWT 认证
│   │   ├── logger.js         # 操作日志记录
│   │   └── upload.js         # 文件上传处理
│   ├── routes/               # 路由定义
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── partners.js
│   │   ├── users.js
│   │   ├── information.js
│   │   ├── knowledge.js
│   │   ├── attachments.js
│   │   ├── dictionaries.js
│   │   └── logs.js
│   ├── scripts/
│   │   └── init-db.js        # 数据库初始化脚本
│   ├── server.js             # 服务入口
│   └── package.json
│
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── api/              # API 接口层
│   │   │   ├── request.js          # Axios 实例（拦截器/错误处理）
│   │   │   ├── auth.js             # 认证接口
│   │   │   ├── projects.js         # 项目接口
│   │   │   ├── partners.js         # 合作方接口
│   │   │   ├── information.js      # 资讯接口
│   │   │   ├── knowledge.js        # 知识库接口
│   │   │   ├── users.js            # 用户接口
│   │   │   ├── attachments.js      # 附件接口
│   │   │   ├── dictionaries.js     # 字典接口
│   │   │   └── logs.js             # 日志接口
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── utils/            # 工具函数
│   │   ├── views/            # 页面视图
│   │   │   ├── login/
│   │   │   ├── dashboard/          # 数据仪表板（图表+地图）
│   │   │   │   └── components/
│   │   │   │       └── TiandituMap.vue
│   │   │   ├── information/        # 资讯管理
│   │   │   │   ├── components/
│   │   │   │   └── index.vue
│   │   │   ├── knowledge/          # 知识库管理
│   │   │   │   ├── components/
│   │   │   │   │   ├── KnowledgeFormDialog.vue
│   │   │   │   │   └── KnowledgeDetailDialog.vue
│   │   │   │   └── index.vue
│   │   │   ├── projects/           # 项目管理
│   │   │   │   ├── components/
│   │   │   │   ├── detail.vue
│   │   │   │   └── index.vue
│   │   │   ├── partners/           # 合作方管理
│   │   │   │   ├── components/
│   │   │   │   └── index.vue
│   │   │   └── system/             # 系统管理
│   │   │       ├── users.vue
│   │   │       ├── dictionaries.vue
│   │   │       └── logs.vue
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── database/
│   └── init.sql              # 数据库初始化脚本（含示例数据）
│
└── README.md
```

---

## 功能模块

### 1. 项目管理

| 功能 | 说明 |
|------|------|
| 项目列表 | 支持列表/网格两种视图，分页展示 |
| 多条件筛选 | 按项目类型、阶段、履约地点、签约方式、项目内容筛选 |
| 排序 | 支持按阶段、合同金额、已开票金额、成本、创建时间排序 |
| 关键词搜索 | 支持项目名称、合作方名称、履约地点、联系人联合搜索 |
| 新增/编辑 | 表单包含项目信息、款项情况、合作方信息、附件上传 |
| 详情查看 | 展示项目完整信息、款项明细、合作方信息、附件列表 |
| 批量操作 | 支持批量删除 |
| 导入导出 | 支持 Excel (.xlsx)、CSV、JSON 格式 |
| 数据校验 | 款项比例总和必须为 100%，日期范围校验 |

**项目字段：**
- 基本信息：项目名称、履约地点（四川省 21 个市州）、项目类型（收入合同/支出合同）、签约方式、项目内容、项目阶段
- 金额信息：合同总金额、已开票金额、待开票金额、成本、毛利、毛利率（自动计算）
- 周期信息：起始日期、终止日期
- 关联信息：合作方、款项、附件

### 2. 合作方管理

| 功能 | 说明 |
|------|------|
| 合作方列表 | 展示合作方基本信息及关联项目统计 |
| 新增/编辑 | 名称、类型、纳税人识别号、地址、银行信息、联系人 |
| 详情查看 | 弹出详情对话框，展示完整信息和合作统计 |
| 搜索 | 支持按名称关键词搜索 |
| 导出 | 支持 Excel 导出 |

### 3. 资讯管理

| 功能 | 说明 |
|------|------|
| 资讯列表 | 支持列表/时间线两种视图，分页展示 |
| 新增/编辑 | 资讯标题、内容、类型、时间、关联项目、关联合作方 |
| 搜索 | 支持按名称关键词搜索 |

### 4. 知识库管理

| 功能 | 说明 |
|------|------|
| 知识列表 | 支持列表/卡片两种视图，分页展示 |
| 全文搜索 | 基于 MySQL ngram 全文索引，支持问题/答案关键词搜索 |
| 多条件筛选 | 按分类、标签筛选 |
| 排序 | 支持按创建时间、更新时间、浏览次数排序 |
| 新增/编辑 | 标题、分类、标签、内容（富文本）、附件上传 |
| 详情查看 | 展示知识完整信息、富文本答案、附件列表、浏览统计 |
| 批量操作 | 支持批量删除 |
| 导入导出 | 支持 Excel (.xlsx)、CSV、JSON 格式 |
| 访问统计 | 自动记录浏览次数，识别高价值知识 |
| 权限控制 | 仅创建人或管理员可编辑/删除 |

**知识库字段：**
- 标题：2-500 字符，必填
- 内容：富文本（支持 HTML），最少 10 字符，必填
- 分类：内控流程/文件模板/操作手册/优秀案例/业务问题/技术问题/其他
- 标签：最多 10 个，单个最多 20 字符
- 浏览次数：自动统计
- 附件：支持文档、图片等格式

### 5. 用户与权限

| 角色 | 权限 |
|------|------|
| 管理员 (admin) | 全部功能，可管理所有数据 |
| 全局用户 (global) | 可查看所有项目，但不能删除他人数据 |
| 普通用户 (normal) | 仅能查看/编辑/删除自己创建的项目 |

**知识库权限：**
- 列表页：所有角色可见全部知识条目（知识库强调共享）
- 编辑/删除：仅创建人或管理员可操作
- 详情页：所有角色可见，浏览次数自动 +1
- 导入：仅管理员和全局用户可操作

**用户管理功能：**
- 用户的增删改查
- 角色分配
- 密码重置
- 个人密码修改

### 6. 字典管理

系统采用字典驱动设计，所有下拉选项均来自字典表，支持动态配置：

| 字典编码 | 字典名称 | 用途 |
|----------|----------|------|
| `partner_type` | 合作方类型 | 甲方/乙方/丙方/其他 |
| `project_stage` | 项目阶段 | 意向/签约/建设/运营/交付/验收/完结 |
| `expansion_method` | 签约方式 | 投标/比选/比价/直接谈判/单一来源/其他 |
| `project_content` | 项目内容 | 系统建设/数据服务/技术服务/业务运营/业务咨询/其他 |
| `project_city` | 履约地点 | 四川省 21 个市州 |
| `payment_type` | 款项类型 | 首款/第二笔款/第三笔款/尾款/其他 |
| `attachment_type` | 附件类型 | 合同/协议/补充合同/协议/验收报告/发票/其他 |
| `knowledge_category` | 知识分类 | 内控流程/文件模板/操作手册/优秀案例/业务问题/技术问题/其他 |
| `knowledge_tag` | 知识标签 | 企业/金融机构/政府/系统/数据 |

**字典管理功能：**
- 字典的增删改查
- 字典项的增删改查（支持排序、启用/禁用）
- 字典编码唯一性校验

### 7. 数据仪表板

| 组件 | 说明 |
|------|------|
| 统计卡片 | 项目数量、合同总金额、已开票金额、待开票金额 |
| 项目阶段分布 | 饼图，点击可跳转项目列表 |
| 合同金额趋势 | 折线图，按月份展示 |
| 项目类型分布 | 饼图，展示收入合同/支出合同占比 |
| 最新资讯 | 以时间线展示最新20条资讯 |
| 项目地图分布 | Leaflet + 天地图，展示四川省各市州项目分布，右侧城市列表，点击可跳转 |

### 8. 操作日志

- 自动记录所有增删改操作
- 记录操作人、模块、操作类型、数据ID、数据名称、IP 地址
- 支持按模块、操作类型筛选
- 支持导出

---

## 数据库表结构

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户表 | username, password(BCrypt), nickname, role(admin/global/normal), status |
| `projects` | 项目表 | name, city, type(收入/支出合同), stage, expansion_method, content, total_amount, receipt_amount, cost, start_date, end_date, partner_id, created_by |
| `payments` | 款项表 | project_id, payment_type, payment_condition, payment_ratio, payment_amount, is_paid, payment_date |
| `attachments` | 附件表 | project_id, knowledge_id, attachment_type, file_path, file_name, file_size |
| `knowledge` | 知识库条目表 | question, answer(富文本), category, tags, view_count, created_by, 全文索引 |
| `knowledge_views` | 知识浏览记录表 | knowledge_id, user_id, viewed_at |
| `partners` | 合作方表 | name, type, tax_id, address, bank, bank_account, contact, contact_phone |
| `information` | 资讯表 | partner_id, project_id, information_date, information_type, information_title, information_content |
| `dictionaries` | 字典表 | dict_code, dict_name, dict_type, description, sort_order, status |
| `dictionary_items` | 字典项表 | dict_id, item_code, item_name, item_value, parent_id, sort_order, status |
| `operation_logs` | 操作日志表 | user_id, username, module, operation, target_id, target_name, content, ip |

**数据库视图：**
- `v_project_full` - 项目完整信息视图（含合作方、创建人）
- `v_partner_projects` - 合作方项目统计视图
- `v_knowledge_full` - 知识库完整信息视图（含创建人、附件数统计）

---

## API 接口文档

### 认证接口 (auth.js)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/profile` | 获取当前用户信息 |
| PUT | `/api/auth/password` | 修改密码 |

### 项目接口 (projects.js)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 获取项目列表（支持分页/筛选/排序） |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/:id` | 获取项目详情 |
| PUT | `/api/projects/:id` | 更新项目 |
| DELETE | `/api/projects/:id` | 删除项目 |
| GET | `/api/projects/export` | 导出项目 (xlsx/csv/json) |
| POST | `/api/projects/import` | 导入项目 |
| GET | `/api/projects/filters` | 获取筛选选项 |
| GET | `/api/projects/dashboard` | 获取数据概览 |
| GET | `/api/projects/city-distribution` | 获取城市分布统计 |

### 合作方接口 (partners.js)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/partners` | 获取合作方列表 |
| GET | `/api/partners/all` | 获取所有合作方（下拉选择） |
| GET | `/api/partners/types` | 获取合作方类型选项 |
| GET | `/api/partners/search` | 搜索合作方 |
| GET | `/api/partners/:id` | 获取合作方详情 |
| POST | `/api/partners` | 创建合作方 |
| PUT | `/api/partners/:id` | 更新合作方 |
| DELETE | `/api/partners/:id` | 删除合作方 |
| GET | `/api/partners/export` | 导出合作方 |

### 用户接口 (users.js)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取用户列表 |
| GET | `/api/users/:id` | 获取用户详情 |
| POST | `/api/users` | 创建用户 |
| PUT | `/api/users/:id` | 更新用户 |
| DELETE | `/api/users/:id` | 删除用户 |
| PUT | `/api/users/:id/reset-password` | 重置密码 |
| GET | `/api/users/roles` | 获取角色选项 |

### 资讯接口 (information.js)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/information` | 获取资讯列表 |
| GET | `/api/information/:id` | 获取资讯详情 |
| POST | `/api/information` | 创建资讯 |
| PUT | `/api/information/:id` | 更新资讯 |
| DELETE | `/api/information/:id` | 删除资讯 |

### 知识库接口 (knowledge.js)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/knowledge` | 获取知识库列表（分页/筛选/搜索） |
| GET | `/api/knowledge/:id` | 获取知识详情 |
| POST | `/api/knowledge` | 创建知识条目 |
| PUT | `/api/knowledge/:id` | 更新知识条目 |
| DELETE | `/api/knowledge/:id` | 删除知识条目 |
| POST | `/api/knowledge/batch-delete` | 批量删除 |
| GET | `/api/knowledge/filters` | 获取筛选选项（分类、热门标签） |
| GET | `/api/knowledge/export` | 导出知识库 (xlsx/csv/json) |
| POST | `/api/knowledge/import` | 导入知识库 |
| POST | `/api/knowledge/:id/view` | 记录浏览 |

### 附件接口 (attachments.js)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/attachments/types` | 获取附件类型选项 |
| GET | `/api/attachments/project/:projectId` | 获取项目附件列表 |
| GET | `/api/attachments/knowledge/:knowledgeId` | 获取知识库附件列表 |
| POST | `/api/attachments` | 上传附件（支持 project_id 或 knowledge_id） |
| GET | `/api/attachments/:id/download` | 下载附件 |
| DELETE | `/api/attachments/:id` | 删除附件 |
| PUT | `/api/attachments/:id` | 更新附件类型 |

### 字典接口 (dictionaries.js)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dictionaries` | 获取字典列表 |
| GET | `/api/dictionaries/:id` | 获取字典详情 |
| GET | `/api/dictionaries/code/:dictCode` | 根据编码获取字典项 |
| POST | `/api/dictionaries` | 创建字典 |
| PUT | `/api/dictionaries/:id` | 更新字典 |
| DELETE | `/api/dictionaries/:id` | 删除字典 |
| POST | `/api/dictionaries/:id/items` | 添加字典项 |
| PUT | `/api/dictionaries/:dictId/items/:itemId` | 更新字典项 |
| DELETE | `/api/dictionaries/:dictId/items/:itemId` | 删除字典项 |

### 日志接口 (logs.js)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/logs` | 获取操作日志列表 |
| GET | `/api/logs/export` | 导出操作日志 |
| GET | `/api/logs/filters` | 获取日志筛选选项 |

---

## 快速开始

### 环境要求

- Node.js >= 18.x
- MySQL >= 8.0

### 1. 克隆项目

```bash
git clone https://github.com/1anc3r/project_management_system.git
cd project_management_system
```

### 2. 数据库初始化

```bash
mysql -u root -p < database/init.sql
```

或登录 MySQL 后执行：

```sql
source database/init.sql
```

> 默认管理员账号：`admin` / `admin123`

### 3. 后端配置

```bash
cd backend
cp .env.example .env  # 编辑 .env 配置数据库连接信息
npm install
npm start               # 生产模式
# 或
npm run dev             # 开发模式（热更新）
```

后端服务默认运行在 `http://localhost:3000`

### 4. 前端配置

```bash
cd frontend
npm install
npm run dev              # 开发模式
# 或
npm run build            # 生产构建
```

前端开发服务器默认运行在 `http://localhost:5173`

---

## 项目亮点

- **字典驱动设计** - 所有下拉选项均来自字典表，支持动态配置，无需修改代码
- **数据可视化** - ECharts 图表 + Leaflet 地图，直观展示项目分布和趋势
- **全生命周期管理** - 覆盖项目从意向到完结的完整流程
- **知识库管理** - 基于 MySQL ngram 全文索引的搜索，支持富文本编辑、标签分类、附件关联、访问统计
- **权限控制** - 基于角色的细粒度权限控制（管理员/全局用户/普通用户）
- **操作审计** - 自动记录所有增删改操作，支持追溯
- **导入导出** - 支持 Excel/CSV/JSON 多种格式
- **款项跟踪** - 支持多笔款项按比例分配，自动计算已开票/待开票金额
- **附件管理** - 支持项目和知识库附件分类上传、下载、管理

---

## License

MIT
