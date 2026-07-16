import request from './request'

// 获取商机列表
export const getOpportunities = (params) => {
  return request.get('/api/opportunities', { params })
}

// 获取商机详情
export const getOpportunityById = (id) => {
  return request.get(`/api/opportunities/${id}`)
}

// 创建商机
export const createOpportunity = (data) => {
  return request.post('/api/opportunities', data)
}

// 更新商机
export const updateOpportunity = (id, data) => {
  return request.put(`/api/opportunities/${id}`, data)
}

// 删除商机
export const deleteOpportunity = (id) => {
  return request.delete(`/api/opportunities/${id}`)
}

// 导出商机
export const exportOpportunities = (params) => {
  return request.get('/api/opportunities/export', {
    params,
    responseType: 'blob'
  })
}

// 获取筛选选项
export const getFilterOptions = () => {
  return request.get('/api/opportunities/filters')
}
