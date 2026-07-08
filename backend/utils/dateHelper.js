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

// 辅助函数：对附件列表进行排序
const sortAttachmentsByType = (attachments) => {
  return attachments.sort((a, b) => {
    const indexA = ATTACHMENT_TYPES.indexOf(a.attachment_type);
    const indexB = ATTACHMENT_TYPES.indexOf(b.attachment_type);
    
    // 未在列表中的类型排到最后
    const priorityA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const priorityB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
    
    return priorityA - priorityB;
  });
};

// 辅助函数：对附件列表进行排序
const sortPartnersByType = (partners) => {
  return partners.sort((a, b) => {
    const indexA = PARTNER_TYPES.indexOf(a.type);
    const indexB = PARTNER_TYPES.indexOf(b.type);
    
    // 未在列表中的类型排到最后
    const priorityA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const priorityB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
    
    return priorityA - priorityB;
  });
};

module.exports = {
  formatDate,
  sortAttachmentsByType,
  sortPartnersByType
};