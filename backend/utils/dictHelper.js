/**
 * 字典助手
 * 统一从字典表读取选项，带 60 秒内存缓存
 * 字典数据变更（字典管理模块）时通过 invalidateDict 主动失效
 */
const { query } = require('../config/db');

const cache = new Map(); // { dictCode: { items, expireAt } }
const TTL = 60 * 1000;

/**
 * 获取字典项列表（item_name 数组）
 * @param {string} dictCode - 字典编码
 * @param {string[]} fallback - 查询失败时的兜底常量
 * @returns {Promise<string[]>}
 */
const getDictItems = async (dictCode, fallback = []) => {
  const hit = cache.get(dictCode);
  if (hit && hit.expireAt > Date.now()) return hit.items;

  try {
    const rows = await query(
      `SELECT di.item_name
       FROM dictionary_items di
       JOIN dictionaries d ON di.dict_id = d.id
       WHERE d.dict_code = ? AND di.status = 1 AND d.status = 1
       ORDER BY di.sort_order ASC`,
      [dictCode]
    );
    const items = rows.map(r => r.item_name);
    cache.set(dictCode, { items, expireAt: Date.now() + TTL });
    return items;
  } catch (error) {
    console.error(`获取字典[${dictCode}]失败:`, error.message);
    return fallback;
  }
};

/**
 * 校验值是否属于指定字典
 * @param {string} dictCode - 字典编码
 * @param {*} value - 待校验的值
 * @param {string[]} fallback - 查询失败时的兜底常量
 * @returns {Promise<boolean>}
 */
const validateDictValue = async (dictCode, value, fallback = []) => {
  const items = await getDictItems(dictCode, fallback);
  // 字典未配置任何启用项时退回常量兜底，避免空字典导致全部校验失败
  const effective = items.length > 0 ? items : fallback;
  return effective.includes(value);
};

/**
 * 使字典缓存失效
 * @param {string} [dictCode] - 指定字典编码；不传则清空全部缓存
 */
const invalidateDict = (dictCode) => {
  if (dictCode) {
    cache.delete(dictCode);
  } else {
    cache.clear();
  }
};

module.exports = {
  getDictItems,
  validateDictValue,
  invalidateDict
};
