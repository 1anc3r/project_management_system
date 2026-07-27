/**
 * 分页参数解析工具
 * 统一分页参数校验，pageSize 设置上限防止恶意大页查询拖垮数据库
 */

const MAX_PAGE_SIZE = 100;
// 导出接口最大行数上限
const MAX_EXPORT_ROWS = 10000;

/**
 * 解析分页参数
 * @param {Object} query - req.query
 * @param {number} [defaultPageSize=20]
 * @returns {{ page: number, pageSize: number, offset: number, limit: number }}
 */
const parsePage = (query = {}, defaultPageSize = 20) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(query.pageSize) || defaultPageSize)
  );
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize
  };
};

module.exports = {
  parsePage,
  MAX_PAGE_SIZE,
  MAX_EXPORT_ROWS
};
