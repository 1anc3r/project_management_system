/**
 * 字典控制器
 * 处理字典的CRUD操作
 */
const { query, transaction } = require('../config/db');

/**
 * 获取字典列表（包含字典项）
 * GET /api/dictionaries
 */
const getDictionaries = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, parseInt(pageSize) || 20);
    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ` AND (d.dict_code LIKE ? OR d.dict_name LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (status !== undefined && status !== '') {
      whereClause += ' AND d.status = ?';
      params.push(parseInt(status));
    }

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM dictionaries d ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询字典列表
    const dictionaries = await query(
      `SELECT d.id, d.dict_code, d.dict_name, d.dict_type, d.description, d.sort_order, d.status, d.created_at, d.updated_at
      FROM dictionaries d
      ${whereClause}
      ORDER BY d.sort_order ASC, d.id ASC
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // 查询所有字典项
    const dictIds = dictionaries.map(d => d.id);
    let items = [];
    if (dictIds.length > 0) {
      const placeholders = dictIds.map(() => '?').join(',');
      items = await query(
        `SELECT id, dict_id, item_code, item_name, item_value, parent_id, sort_order, status, remark
        FROM dictionary_items
        WHERE dict_id IN (${placeholders})
        ORDER BY sort_order ASC, id ASC`,
        dictIds
      );
    }

    // 将字典项关联到对应的字典
    const dictionariesWithItems = dictionaries.map(dict => ({
      ...dict,
      items: items.filter(item => item.dict_id === dict.id)
    }));

    res.json({
      code: 200,
      data: {
        list: dictionariesWithItems,
        pagination: {
          page: pageNum,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取字典列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取字典列表失败'
    });
  }
};

/**
 * 获取字典详情（包含字典项）
 * GET /api/dictionaries/:id
 */
const getDictionaryById = async (req, res) => {
  try {
    const { id } = req.params;

    // 查询字典
    const dictionaries = await query(
      'SELECT id, dict_code, dict_name, dict_type, description, sort_order, status, created_at, updated_at FROM dictionaries WHERE id = ?',
      [id]
    );

    if (dictionaries.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '字典不存在'
      });
    }

    const dictionary = dictionaries[0];

    // 查询字典项
    const items = await query(
      `SELECT id, item_code, item_name, item_value, parent_id, sort_order, status, remark
      FROM dictionary_items
      WHERE dict_id = ?
      ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    dictionary.items = items;

    res.json({
      code: 200,
      data: dictionary
    });
  } catch (error) {
    console.error('获取字典详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取字典详情失败'
    });
  }
};

/**
 * 根据字典编码获取字典项
 * GET /api/dictionaries/code/:dictCode
 */
const getDictionaryByCode = async (req, res) => {
  try {
    const { dictCode } = req.params;

    // 查询字典
    const dictionaries = await query(
      'SELECT id, dict_code, dict_name, dict_type FROM dictionaries WHERE dict_code = ? AND status = 1',
      [dictCode]
    );

    if (dictionaries.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '字典不存在'
      });
    }

    const dictionary = dictionaries[0];

    // 查询启用的字典项
    const items = await query(
      `SELECT item_code, item_name, item_value, parent_id, sort_order, remark
      FROM dictionary_items
      WHERE dict_id = ? AND status = 1
      ORDER BY sort_order ASC, id ASC`,
      [dictionary.id]
    );

    res.json({
      code: 200,
      data: {
        dictCode: dictionary.dict_code,
        dictName: dictionary.dict_name,
        items: items.map(item => item.item_name)
      }
    });
  } catch (error) {
    console.error('获取字典项错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取字典项失败'
    });
  }
};

/**
 * 创建字典
 * POST /api/dictionaries
 */
const createDictionary = async (req, res) => {
  try {
    const { dict_code, dict_name, dict_type = 'string', description, sort_order = 0, items = [] } = req.body;

    // 参数验证
    if (!dict_code || !dict_name) {
      return res.status(400).json({
        code: 400,
        message: '字典编码和名称不能为空'
      });
    }

    // 检查字典编码是否已存在
    const existing = await query(
      'SELECT id FROM dictionaries WHERE dict_code = ?',
      [dict_code]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '字典编码已存在'
      });
    }

    const result = await transaction(async (connection) => {
      // 创建字典
      const [dictResult] = await connection.execute(
        `INSERT INTO dictionaries (dict_code, dict_name, dict_type, description, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [dict_code, dict_name, dict_type, description || null, sort_order]
      );

      const dictId = dictResult.insertId;

      // 创建字典项
      if (items && items.length > 0) {
        for (const item of items) {
          await connection.execute(
            `INSERT INTO dictionary_items (dict_id, item_code, item_name, item_value, sort_order, remark) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              dictId,
              item.item_code,
              item.item_name,
              item.item_value || item.item_name,
              item.sort_order || 0,
              item.remark || null
            ]
          );
        }
      }

      return dictId;
    });

    res.status(201).json({
      code: 201,
      message: '字典创建成功',
      data: { id: result }
    });
  } catch (error) {
    console.error('创建字典错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建字典失败'
    });
  }
};

/**
 * 更新字典
 * PUT /api/dictionaries/:id
 */
const updateDictionary = async (req, res) => {
  try {
    const { id } = req.params;
    const { dict_name, dict_type, description, sort_order, status } = req.body;

    // 查询原字典
    const existing = await query(
      'SELECT id FROM dictionaries WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '字典不存在'
      });
    }

    // 构建更新字段
    const updateFields = [];
    const params = [];

    if (dict_name !== undefined) {
      updateFields.push('dict_name = ?');
      params.push(dict_name);
    }

    if (dict_type !== undefined) {
      updateFields.push('dict_type = ?');
      params.push(dict_type);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }

    if (sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      params.push(sort_order);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有要更新的字段'
      });
    }

    params.push(id);

    await query(
      `UPDATE dictionaries SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      code: 200,
      message: '字典更新成功',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('更新字典错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新字典失败'
    });
  }
};

/**
 * 删除字典
 * DELETE /api/dictionaries/:id
 */
const deleteDictionary = async (req, res) => {
  try {
    const { id } = req.params;

    // 查询原字典
    const existing = await query(
      'SELECT dict_name FROM dictionaries WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '字典不存在'
      });
    }

    // 删除字典（关联的字典项会通过外键级联删除）
    await query('DELETE FROM dictionaries WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: '字典删除成功',
      data: { id: parseInt(id), dict_name: existing[0].dict_name }
    });
  } catch (error) {
    console.error('删除字典错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除字典失败'
    });
  }
};

/**
 * 添加字典项
 * POST /api/dictionaries/:id/items
 */
const addDictionaryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item_code, item_name, item_value, sort_order = 0, remark } = req.body;

    if (!item_code || !item_name) {
      return res.status(400).json({
        code: 400,
        message: '字典项编码和名称不能为空'
      });
    }

    // 检查字典是否存在
    const dictionaries = await query(
      'SELECT id FROM dictionaries WHERE id = ?',
      [id]
    );

    if (dictionaries.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '字典不存在'
      });
    }

    // 检查字典项编码是否已存在
    const existing = await query(
      'SELECT id FROM dictionary_items WHERE dict_id = ? AND item_code = ?',
      [id, item_code]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '字典项编码已存在'
      });
    }

    const result = await query(
      `INSERT INTO dictionary_items (dict_id, item_code, item_name, item_value, sort_order, remark) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, item_code, item_name, item_value || item_name, sort_order, remark || null]
    );

    res.status(201).json({
      code: 201,
      message: '字典项添加成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('添加字典项错误:', error);
    res.status(500).json({
      code: 500,
      message: '添加字典项失败'
    });
  }
};

/**
 * 更新字典项
 * PUT /api/dictionaries/:id/items/:itemId
 */
const updateDictionaryItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { item_name, item_value, sort_order, status, remark } = req.body;

    // 检查字典项是否存在
    const existing = await query(
      'SELECT id FROM dictionary_items WHERE id = ? AND dict_id = ?',
      [itemId, id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '字典项不存在'
      });
    }

    // 构建更新字段
    const updateFields = [];
    const params = [];

    if (item_name !== undefined) {
      updateFields.push('item_name = ?');
      params.push(item_name);
    }

    if (item_value !== undefined) {
      updateFields.push('item_value = ?');
      params.push(item_value);
    }

    if (sort_order !== undefined) {
      updateFields.push('sort_order = ?');
      params.push(sort_order);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (remark !== undefined) {
      updateFields.push('remark = ?');
      params.push(remark);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有要更新的字段'
      });
    }

    params.push(itemId);

    await query(
      `UPDATE dictionary_items SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      code: 200,
      message: '字典项更新成功',
      data: { id: parseInt(itemId) }
    });
  } catch (error) {
    console.error('更新字典项错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新字典项失败'
    });
  }
};

/**
 * 删除字典项
 * DELETE /api/dictionaries/:id/items/:itemId
 */
const deleteDictionaryItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    // 检查字典项是否存在
    const existing = await query(
      'SELECT item_name FROM dictionary_items WHERE id = ? AND dict_id = ?',
      [itemId, id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '字典项不存在'
      });
    }

    await query('DELETE FROM dictionary_items WHERE id = ?', [itemId]);

    res.json({
      code: 200,
      message: '字典项删除成功',
      data: { id: parseInt(itemId), item_name: existing[0].item_name }
    });
  } catch (error) {
    console.error('删除字典项错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除字典项失败'
    });
  }
};

module.exports = {
  getDictionaries,
  getDictionaryById,
  getDictionaryByCode,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  addDictionaryItem,
  updateDictionaryItem,
  deleteDictionaryItem
};
