-- =====================================================
-- 数据库初始化脚本
-- MySQL 8.0
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS project_management DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE project_management;

-- =====================================================
-- 1. 合作方表 partners
-- =====================================================
DROP TABLE IF EXISTS partners;
CREATE TABLE partners (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT '合作方名称',
    type VARCHAR(50) DEFAULT '其他' COMMENT '合作方类型(甲方/乙方/丙方/其他)',
    tax_id VARCHAR(50) DEFAULT NULL COMMENT '纳税人识别号',
    address VARCHAR(255) DEFAULT NULL COMMENT '地址',
    bank VARCHAR(255) DEFAULT NULL COMMENT '开户银行',
    bank_account VARCHAR(100) DEFAULT NULL COMMENT '银行账号',
    contact VARCHAR(50) DEFAULT NULL COMMENT '联系人',
    contact_phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_tax_id (tax_id),
    KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合作方信息表';

-- =====================================================
-- 2. 项目表 projects
-- =====================================================
DROP TABLE IF EXISTS projects;
CREATE TABLE projects (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT '项目名称',
    city VARCHAR(100) NOT NULL COMMENT '履约地点',
    type varchar(50) DEFAULT NULL COMMENT '项目类型（收入合同、支出合同）',
    stage VARCHAR(50) NOT NULL COMMENT '项目阶段(意向/建设/运营/完结)',
    expansion_method VARCHAR(50) NOT NULL COMMENT '签约方式(投标/比选/比价/直接谈判/单一来源采购/其他)',
    content VARCHAR(50) NOT NULL COMMENT '项目主要内容(系统建设/数据服务/技术服务/业务运营/业务咨询/其他)',
    total_amount DECIMAL(16,2) NOT NULL DEFAULT 0.00 COMMENT '合同总金额(万元)',
    receipt_amount DECIMAL(16,2) NOT NULL DEFAULT 0.00 COMMENT '已开票金额(万元)',
    cost DECIMAL(16,2) NOT NULL DEFAULT 0.00 COMMENT '成本(万元)',
    start_date DATE DEFAULT NULL COMMENT '起始日期',
    end_date DATE DEFAULT NULL COMMENT '终止日期',
    partner_id BIGINT UNSIGNED NOT NULL COMMENT '合作方ID',
    created_by BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_stage (stage),
    KEY idx_partner_id (partner_id),
    KEY idx_created_by (created_by),
    CONSTRAINT fk_project_partner FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目信息表';

-- =====================================================
-- 3. 项目款项表 payments
-- =====================================================
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    project_id BIGINT UNSIGNED NOT NULL COMMENT '项目ID',
    payment_type VARCHAR(50) NOT NULL COMMENT '款项(首款/第二笔款/第三笔款/尾款/其他)',
    payment_condition TEXT DEFAULT NULL COMMENT '支付条件',
    payment_ratio DECIMAL(8,4) NOT NULL DEFAULT 0.0000 COMMENT '支付比例(%)',
    payment_amount DECIMAL(16,2) NOT NULL DEFAULT 0.00 COMMENT '支付金额(万元)',
    is_paid TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否支付(0否1是)',
    payment_date DATE DEFAULT NULL COMMENT '支付日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_project_id (project_id),
    CONSTRAINT fk_payment_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目款项表';

-- =====================================================
-- 4. 项目附件表 attachments
-- =====================================================
DROP TABLE IF EXISTS attachments;
CREATE TABLE attachments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    project_id BIGINT UNSIGNED NOT NULL COMMENT '项目ID',
    attachment_type VARCHAR(50) NOT NULL COMMENT '附件类型(测算表/报价函/合同/协议/补充合同/协议/法律审查意见书/营业执照/验收报告/其他)',
    file_path VARCHAR(512) NOT NULL COMMENT '文件路径',
    file_name VARCHAR(255) DEFAULT NULL COMMENT '原文件名',
    file_size BIGINT DEFAULT NULL COMMENT '文件大小(字节)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    PRIMARY KEY (id),
    KEY idx_project_id (project_id),
    CONSTRAINT fk_attachment_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目附件表';

-- =====================================================
-- 5. 用户表 users
-- =====================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '账号',
    password VARCHAR(100) NOT NULL COMMENT '密码(BCrypt加密)',
    nickname VARCHAR(50) DEFAULT NULL COMMENT '姓名/昵称',
    role VARCHAR(50) NOT NULL DEFAULT 'normal' COMMENT '角色(admin-管理员/global-全局用户/normal-普通用户)',
    status TINYINT(1) DEFAULT 1 COMMENT '状态(0禁用1正常)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    KEY idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- =====================================================
-- 6. 操作日志表 operation_logs
-- =====================================================
DROP TABLE IF EXISTS operation_logs;
CREATE TABLE operation_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
    user_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
    username VARCHAR(50) DEFAULT NULL COMMENT '操作人账号',
    module VARCHAR(50) DEFAULT NULL COMMENT '模块(项目/合作方/用户/系统)',
    operation VARCHAR(50) DEFAULT NULL COMMENT '操作(新增/编辑/删除/登录/登出/导出/导入)',
    target_id BIGINT UNSIGNED DEFAULT NULL COMMENT '数据ID',
    target_name VARCHAR(255) DEFAULT NULL COMMENT '数据名称',
    content TEXT DEFAULT NULL COMMENT '操作内容详情(JSON格式)',
    ip VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_module (module),
    KEY idx_operation (operation),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- =====================================================
-- 初始化数据
-- =====================================================

-- 插入默认管理员账号 (密码: admin123)
-- 使用BCrypt加密后的密码哈希
INSERT INTO users (username, password, nickname, role, status) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '系统管理员', 'admin', 1);

-- 注意：密码哈希是使用 bcrypt.hashSync('admin123', 10) 生成的
-- 如需修改默认密码，请使用后端提供的密码重置功能

-- 插入示例合作方数据
INSERT INTO partners (name, type, tax_id, address, bank, bank_account, contact, contact_phone) VALUES
('四川科技有限公司', '甲方', '91510000MA61R00001', '成都市高新区天府大道1号', '中国工商银行成都分行', '4402012345678901234', '张三', '13800138001'),
('成都信息服务公司', '乙方', '91510000MA61R00002', '成都市武侯区人民南路2号', '中国建设银行成都分行', '5102012345678901234', '李四', '13800138002'),
('重庆数据技术公司', '丙方', '91500000MA61R00003', '重庆市渝北区新南路3号', '中国银行重庆分行', '6202012345678901234', '王五', '13800138003');

-- 插入示例项目数据
INSERT INTO projects (name, city, type, stage, expansion_method, content, total_amount, receipt_amount, cost, start_date, end_date, partner_id, created_by) VALUES
('智慧园区管理系统建设项目', '成都市', '收入合同', '建设', '投标', '系统建设', 500.00, 150.00, 300.00, '2024-01-15', '2024-12-31', 1, 1),
('数据治理平台开发项目', '绵阳市', '收入合同', '运营', '比选', '数据服务', 300.00, 200.00, 150.00, '2023-06-01', '2024-06-01', 2, 1),
('政务云运维服务项目', '成都市', '收入合同', '完结', '直接谈判', '技术服务', 800.00, 800.00, 500.00, '2023-01-01', '2023-12-31', 1, 1),
('智慧城市大数据分析平台', '德阳市', '支出合同', '意向', '比价', '系统建设', 1200.00, 0.00, 0.00, '2024-07-01', '2025-06-30', 3, 1),
('企业数字化转型咨询项目', '成都市', '支出合同', '建设', '单一来源采购', '业务咨询', 150.00, 50.00, 80.00, '2024-03-01', '2024-09-30', 2, 1);

-- 插入示例款项数据
INSERT INTO payments (project_id, payment_type, payment_condition, payment_ratio, payment_amount, is_paid, payment_date) VALUES
(1, '首款', '合同签订后15个工作日内支付', 30.00, 150.00, 1, '2024-01-20'),
(1, '第二笔款', '系统上线验收后支付', 40.00, 200.00, 0, NULL),
(1, '尾款', '质保期满后支付', 30.00, 150.00, 0, NULL),
(2, '首款', '合同签订后支付', 50.00, 150.00, 1, '2023-06-05'),
(2, '尾款', '项目验收后支付', 50.00, 150.00, 1, '2024-05-20'),
(3, '首款', '合同签订后支付', 40.00, 320.00, 1, '2023-01-10'),
(3, '第二笔款', '中期验收后支付', 30.00, 240.00, 1, '2023-06-15'),
(3, '尾款', '终验后支付', 30.00, 240.00, 1, '2023-12-20');

-- 插入示例操作日志
INSERT INTO operation_logs (user_id, username, module, operation, target_id, target_name, content, ip) VALUES
(1, 'admin', '系统', '登录', NULL, NULL, '{"message": "用户登录成功"}', '127.0.0.1'),
(1, 'admin', '项目', '新增', 1, '智慧园区管理系统建设项目', '{"name": "智慧园区管理系统建设项目", "total_amount": 500}', '127.0.0.1'),
(1, 'admin', '合作方', '新增', 1, '四川科技有限公司', '{"name": "四川科技有限公司", "tax_id": "91510000MA61R00001"}', '127.0.0.1');

-- =====================================================
-- 创建视图（方便查询）
-- =====================================================

-- 项目完整信息视图
CREATE OR REPLACE VIEW v_project_full AS
SELECT 
    p.id,
    p.name AS project_name,
    p.city,
    p.stage,
    p.expansion_method,
    p.content,
    p.total_amount,
    p.receipt_amount,
    (p.total_amount - p.receipt_amount) AS pending_amount,
    p.cost,
    (p.total_amount - p.cost) AS profit,
    CASE 
        WHEN p.total_amount > 0 THEN ROUND((p.total_amount - p.cost) / p.total_amount * 100, 2)
        ELSE 0 
    END AS profit_rate,
    p.start_date,
    p.end_date,
    p.created_at,
    p.updated_at,
    par.id AS partner_id,
    par.name AS partner_name,
    par.tax_id AS partner_tax_id,
    par.contact AS partner_contact,
    par.contact_phone AS partner_contact_phone,
    u.nickname AS creator_name
FROM projects p
LEFT JOIN partners par ON p.partner_id = par.id
LEFT JOIN users u ON p.created_by = u.id;

-- 合作方项目统计视图
CREATE OR REPLACE VIEW v_partner_projects AS
SELECT 
    par.id,
    par.name,
    par.type,
    par.tax_id,
    par.address,
    par.contact,
    par.contact_phone,
    COUNT(p.id) AS project_count,
    SUM(p.total_amount) AS total_contract_amount,
    SUM(p.receipt_amount) AS total_receipt_amount
FROM partners par
LEFT JOIN projects p ON par.id = p.partner_id
GROUP BY par.id, par.name, par.type, par.tax_id, par.address, par.contact, par.contact_phone;

-- =====================================================
-- 7. 字典表 dictionaries
-- =====================================================
DROP TABLE IF EXISTS dictionaries;
CREATE TABLE dictionaries (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    dict_code VARCHAR(50) NOT NULL COMMENT '字典编码',
    dict_name VARCHAR(100) NOT NULL COMMENT '字典名称',
    dict_type VARCHAR(20) NOT NULL DEFAULT 'string' COMMENT '字典类型(string/int/boolean)',
    description VARCHAR(255) DEFAULT NULL COMMENT '字典描述',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    status TINYINT(1) DEFAULT 1 COMMENT '状态(0禁用1启用)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_dict_code (dict_code),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典表';

-- =====================================================
-- 8. 字典项表 dictionary_items
-- =====================================================
DROP TABLE IF EXISTS dictionary_items;
CREATE TABLE dictionary_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    dict_id BIGINT UNSIGNED NOT NULL COMMENT '字典ID',
    item_code VARCHAR(50) NOT NULL COMMENT '字典项编码',
    item_name VARCHAR(100) NOT NULL COMMENT '字典项名称',
    item_value VARCHAR(255) DEFAULT NULL COMMENT '字典项值',
    parent_id BIGINT UNSIGNED DEFAULT NULL COMMENT '父级ID（用于级联字典）',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    status TINYINT(1) DEFAULT 1 COMMENT '状态(0禁用1启用)',
    remark VARCHAR(255) DEFAULT NULL COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_dict_item (dict_id, item_code),
    KEY idx_dict_id (dict_id),
    KEY idx_status (status),
    CONSTRAINT fk_dict_item_dict FOREIGN KEY (dict_id) REFERENCES dictionaries(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典项表';

-- =====================================================
-- 初始化字典数据
-- =====================================================

-- 合作方类型
INSERT INTO dictionaries (dict_code, dict_name, dict_type, description, sort_order) VALUES
('partner_type', '合作方类型', 'string', '合作方类型字典', 1);

INSERT INTO dictionary_items (dict_id, item_code, item_name, item_value, sort_order) 
SELECT id, '甲方', '甲方', '甲方', 1 FROM dictionaries WHERE dict_code = 'partner_type'
UNION ALL
SELECT id, '乙方', '乙方', '乙方', 2 FROM dictionaries WHERE dict_code = 'partner_type'
UNION ALL
SELECT id, '丙方', '丙方', '丙方', 3 FROM dictionaries WHERE dict_code = 'partner_type'
UNION ALL
SELECT id, '其他', '其他', '其他', 4 FROM dictionaries WHERE dict_code = 'partner_type';

-- 项目阶段
INSERT INTO dictionaries (dict_code, dict_name, dict_type, description, sort_order) VALUES
('project_stage', '项目阶段', 'string', '项目阶段字典', 2);

INSERT INTO dictionary_items (dict_id, item_code, item_name, item_value, sort_order) 
SELECT id, '意向', '意向', '意向', 1 FROM dictionaries WHERE dict_code = 'project_stage'
UNION ALL
SELECT id, '建设', '建设', '建设', 2 FROM dictionaries WHERE dict_code = 'project_stage'
UNION ALL
SELECT id, '运营', '运营', '运营', 3 FROM dictionaries WHERE dict_code = 'project_stage'
UNION ALL
SELECT id, '完结', '完结', '完结', 4 FROM dictionaries WHERE dict_code = 'project_stage';

-- 签约方式
INSERT INTO dictionaries (dict_code, dict_name, dict_type, description, sort_order) VALUES
('expansion_method', '签约方式', 'string', '项目签约方式字典', 3);

INSERT INTO dictionary_items (dict_id, item_code, item_name, item_value, sort_order) 
SELECT id, '投标', '投标', '投标', 1 FROM dictionaries WHERE dict_code = 'expansion_method'
UNION ALL
SELECT id, '比选', '比选', '比选', 2 FROM dictionaries WHERE dict_code = 'expansion_method'
UNION ALL
SELECT id, '比价', '比价', '比价', 3 FROM dictionaries WHERE dict_code = 'expansion_method'
UNION ALL
SELECT id, '直接谈判', '直接谈判', '直接谈判', 4 FROM dictionaries WHERE dict_code = 'expansion_method'
UNION ALL
SELECT id, '单一来源采购', '单一来源采购', '单一来源采购', 5 FROM dictionaries WHERE dict_code = 'expansion_method'
UNION ALL
SELECT id, '其他', '其他', '其他', 6 FROM dictionaries WHERE dict_code = 'expansion_method';

-- 项目内容
INSERT INTO dictionaries (dict_code, dict_name, dict_type, description, sort_order) VALUES
('project_content', '项目内容', 'string', '项目内容字典', 4);

INSERT INTO dictionary_items (dict_id, item_code, item_name, item_value, sort_order) 
SELECT id, '系统建设', '系统建设', '系统建设', 1 FROM dictionaries WHERE dict_code = 'project_content'
UNION ALL
SELECT id, '数据服务', '数据服务', '数据服务', 2 FROM dictionaries WHERE dict_code = 'project_content'
UNION ALL
SELECT id, '技术服务', '技术服务', '技术服务', 3 FROM dictionaries WHERE dict_code = 'project_content'
UNION ALL
SELECT id, '业务运营', '业务运营', '业务运营', 4 FROM dictionaries WHERE dict_code = 'project_content'
UNION ALL
SELECT id, '业务咨询', '业务咨询', '业务咨询', 5 FROM dictionaries WHERE dict_code = 'project_content'
UNION ALL
SELECT id, '其他', '其他', '其他', 6 FROM dictionaries WHERE dict_code = 'project_content';

-- 履约地点（四川省市州）
INSERT INTO dictionaries (dict_code, dict_name, dict_type, description, sort_order) VALUES
('project_city', '履约地点', 'string', '项目履约地点字典', 5);

INSERT INTO dictionary_items (dict_id, item_code, item_name, item_value, sort_order) 
SELECT id, '成都市', '成都市', '成都市', 1 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '自贡市', '自贡市', '自贡市', 2 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '攀枝花市', '攀枝花市', '攀枝花市', 3 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '泸州市', '泸州市', '泸州市', 4 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '德阳市', '德阳市', '德阳市', 5 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '绵阳市', '绵阳市', '绵阳市', 6 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '广元市', '广元市', '广元市', 7 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '遂宁市', '遂宁市', '遂宁市', 8 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '内江市', '内江市', '内江市', 9 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '乐山市', '乐山市', '乐山市', 10 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '南充市', '南充市', '南充市', 11 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '眉山市', '眉山市', '眉山市', 12 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '宜宾市', '宜宾市', '宜宾市', 13 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '广安市', '广安市', '广安市', 14 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '达州市', '达州市', '达州市', 15 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '雅安市', '雅安市', '雅安市', 16 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '巴中市', '巴中市', '巴中市', 17 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '资阳市', '资阳市', '资阳市', 18 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '阿坝藏族羌族自治州', '阿坝藏族羌族自治州', '阿坝藏族羌族自治州', 19 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '甘孜藏族自治州', '甘孜藏族自治州', '甘孜藏族自治州', 20 FROM dictionaries WHERE dict_code = 'project_city'
UNION ALL
SELECT id, '凉山彝族自治州', '凉山彝族自治州', '凉山彝族自治州', 21 FROM dictionaries WHERE dict_code = 'project_city';

-- 款项类型
INSERT INTO dictionaries (dict_code, dict_name, dict_type, description, sort_order) VALUES
('payment_type', '款项类型', 'string', '项目款项类型字典', 6);

INSERT INTO dictionary_items (dict_id, item_code, item_name, item_value, sort_order) 
SELECT id, '首款', '首款', '首款', 1 FROM dictionaries WHERE dict_code = 'payment_type'
UNION ALL
SELECT id, '第二笔款', '第二笔款', '第二笔款', 2 FROM dictionaries WHERE dict_code = 'payment_type'
UNION ALL
SELECT id, '第三笔款', '第三笔款', '第三笔款', 3 FROM dictionaries WHERE dict_code = 'payment_type'
UNION ALL
SELECT id, '尾款', '尾款', '尾款', 4 FROM dictionaries WHERE dict_code = 'payment_type'
UNION ALL
SELECT id, '其他', '其他', '其他', 5 FROM dictionaries WHERE dict_code = 'payment_type';

-- 附件类型
INSERT INTO dictionaries (dict_code, dict_name, dict_type, description, sort_order) VALUES
('attachment_type', '附件类型', 'string', '项目附件类型字典', 7);

INSERT INTO dictionary_items (dict_id, item_code, item_name, item_value, sort_order) 
SELECT id, '合同/协议', '合同/协议', '合同/协议', 3 FROM dictionaries WHERE dict_code = 'attachment_type'
UNION ALL
SELECT id, '补充合同/协议', '补充合同/协议', '补充合同/协议', 4 FROM dictionaries WHERE dict_code = 'attachment_type'
UNION ALL
SELECT id, '验收报告', '验收报告', '验收报告', 7 FROM dictionaries WHERE dict_code = 'attachment_type'
UNION ALL
SELECT id, '发票', '发票', '发票', 8 FROM dictionaries WHERE dict_code = 'attachment_type'
UNION ALL
SELECT id, '其他', '其他', '其他', 9 FROM dictionaries WHERE dict_code = 'attachment_type';

-- =====================================================
-- 完成
-- =====================================================
SELECT '数据库初始化完成！' AS message;
