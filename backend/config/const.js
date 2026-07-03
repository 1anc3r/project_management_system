// 项目阶段枚举
const PROJECT_STAGES = ['意向', '签约', '建设', '运营', '交付', '验收', '完结'];

// 项目类型枚举
const PROJECT_TYPES = ['收入合同', '支出合同'];

// 签约方式枚举
const PROJECT_EXPANSION_METHODS = ['投标', '比选', '比价', '直接谈判', '单一来源', '其他'];

// 项目内容枚举
const PROJECT_CONTENTS = ['系统建设', '数据服务', '技术服务', '业务运营', '业务咨询', '其他'];

// 四川省市州列表
const SICHUAN_CITIES = [
  '成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市',
  '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市',
  '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市',
  '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州'
];

// 项目类型枚举
const PARTNER_TYPES = ['甲方', '乙方', '丙方', '其他'];

// 附件类型枚举
const ATTACHMENT_TYPES = ['测算表', '报价函', '合同/协议', '补充合同/协议', '法律审查意见书', '营业执照', '验收报告', '发票', '其他'];

// 图片文件扩展名
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

module.exports = {
  PROJECT_STAGES,
  PROJECT_TYPES,
  PROJECT_EXPANSION_METHODS,
  PROJECT_CONTENTS,
  SICHUAN_CITIES,
  PARTNER_TYPES,
  ATTACHMENT_TYPES,
  IMAGE_EXTENSIONS
};