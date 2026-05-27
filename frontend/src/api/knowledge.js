import request from './request'

/**
 * 知识库 API 接口
 * 提供知识条目的增删改查、搜索、导入导出功能
 */

// 获取知识库列表
export const getKnowledgeList = (params) => {
  return request.get('/api/knowledge', { params })
}

// 获取知识详情
export const getKnowledgeDetail = (id) => {
  return request.get(`/api/knowledge/${id}`)
}

// 创建知识条目
export const createKnowledge = (data) => {
  return request.post('/api/knowledge', data)
}

// 更新知识条目
export const updateKnowledge = (id, data) => {
  return request.put(`/api/knowledge/${id}`, data)
}

// 删除知识条目
export const deleteKnowledge = (id) => {
  return request.delete(`/api/knowledge/${id}`)
}

// 批量删除
export const batchDeleteKnowledge = (ids) => {
  return request.post('/api/knowledge/batch-delete', { ids })
}

// 获取筛选选项
export const getKnowledgeFilters = () => {
  return request.get('/api/knowledge/filters')
}

// 导出知识库
export const exportKnowledge = (params) => {
  return request.get('/api/knowledge/export', {
    params,
    responseType: 'blob'
  })
}

// 导入知识库
export const importKnowledge = (formData) => {
  return request.post('/api/knowledge/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 记录浏览
export const recordView = (id) => {
  return request.post(`/api/knowledge/${id}/view`)
}
