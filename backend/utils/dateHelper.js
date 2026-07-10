const { ATTACHMENT_TYPES, PARTNER_TYPES } = require('../config/const');

// 辅助函数：格式化日期为 YYYY-MM-DD
const formatDate = (dateValue) => {
  if (!dateValue) return null;
  // 处理 ISO 8601 格式 (2025-08-06T16:00:00.000Z)
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    return dateValue.split('T')[0];
  }
  // 如果已经是 YYYY-MM-DD 格式，直接返回
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  // 使用 moment 格式化
  const formatted = moment(dateValue).format('YYYY-MM-DD');
  return formatted === 'Invalid date' ? null : formatted;
};

module.exports = {
  formatDate
};