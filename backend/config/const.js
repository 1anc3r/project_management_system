// 四川省市州列表
const SICHUAN_CITIES = [
  '成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市',
  '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市',
  '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市',
  '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州'
];

// 合作方类型枚举
const PARTNER_TYPES = ['甲方', '乙方', '丙方', '其他'];

// 项目阶段枚举
const PROJECT_STAGES = ['意向', '签约', '建设', '运营', '交付', '验收', '完结'];

// 项目类型枚举
const PROJECT_TYPES = ['收入合同', '支出合同', '框架合同'];

// 项目签约方式枚举
const PROJECT_EXPANSION_METHODS = ['投标', '比选', '比价', '直接谈判', '单一来源', '其他'];

// 项目内容枚举
const PROJECT_CONTENTS = ['系统建设', '数据服务', '技术服务', '业务运营', '业务咨询', '其他'];

// 商机阶段枚举
const OPPORTUNITY_STAGES = ['初步接触', '需求跟踪', '方案编制', '询价报价', '招标投标'];

// 商机意向等级枚举
const OPPORTUNITY_INTEREST_LEVELS = ['积极', '一般', '消极', '未知'];

// 附件类型枚举
const ATTACHMENT_TYPES = ['营业执照', '成本测算表', '招投标文件', '法律审查意见书', '合同/协议', '补充合同/协议', '验收报告', '发票', '需求说明书', '技术解决方案', '其他'];

// 图片文件扩展名
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

/**
 * 可预览的文件扩展名分类
 */
const PREVIEWABLE_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
  pdf: ['.pdf'],
  text: ['.txt', '.csv', '.json', '.md', '.log', '.xml', '.css', '.js', '.html', '.htm', '.yaml', '.yml', '.sql'],
  office: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
};

/**
 * 文本文件 MIME 类型映射
 */
const TEXT_MIME_TYPES = {
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.log': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8'
};

module.exports = {
  SICHUAN_CITIES,
  PARTNER_TYPES,
  PROJECT_STAGES,
  PROJECT_TYPES,
  PROJECT_EXPANSION_METHODS,
  PROJECT_CONTENTS,
  OPPORTUNITY_STAGES,
  OPPORTUNITY_INTEREST_LEVELS,
  ATTACHMENT_TYPES,
  IMAGE_EXTENSIONS,
  PREVIEWABLE_EXTENSIONS,
  TEXT_MIME_TYPES
};