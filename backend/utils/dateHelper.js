const moment = require('moment');

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
  // Excel 日期序列号（以 1899-12-30 为第 0 天，有效范围 1900-01-01 ~ 9999-12-31）
  if (typeof dateValue === 'number' && Number.isFinite(dateValue) && dateValue > 59 && dateValue < 2958466) {
    return moment('1899-12-30').add(dateValue, 'days').format('YYYY-MM-DD');
  }
  // 其他情况（Date 对象等）使用 moment 格式化
  const formatted = moment(dateValue).format('YYYY-MM-DD');
  return formatted === 'Invalid date' ? null : formatted;
};

module.exports = {
  formatDate
};
