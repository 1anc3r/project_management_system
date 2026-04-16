import request from './request'

// 获取字典列表
export const getDictionaries = (params) => {
  return request.get('/api/dictionaries', { params })
}

// 获取字典详情
export const getDictionaryById = (id) => {
  return request.get(`/api/dictionaries/${id}`)
}

// 根据字典编码获取字典项
export const getDictionaryByCode = (dictCode) => {
  return request.get(`/api/dictionaries/code/${dictCode}`)
}

// 创建字典
export const createDictionary = (data) => {
  return request.post('/api/dictionaries', data)
}

// 更新字典
export const updateDictionary = (id, data) => {
  return request.put(`/api/dictionaries/${id}`, data)
}

// 删除字典
export const deleteDictionary = (id) => {
  return request.delete(`/api/dictionaries/${id}`)
}

// 添加字典项
export const addDictionaryItem = (id, data) => {
  return request.post(`/api/dictionaries/${id}/items`, data)
}

// 更新字典项
export const updateDictionaryItem = (dictId, itemId, data) => {
  return request.put(`/api/dictionaries/${dictId}/items/${itemId}`, data)
}

// 删除字典项
export const deleteDictionaryItem = (dictId, itemId) => {
  return request.delete(`/api/dictionaries/${dictId}/items/${itemId}`)
}
