const { ATTACHMENT_TYPES, PARTNER_TYPES } = require('../config/const');

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
    sortAttachmentsByType,
    sortPartnersByType
};