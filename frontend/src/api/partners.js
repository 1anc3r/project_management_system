import request from './request'

// 获取合作方列表
export const getPartners = (params) => {
  return request.get('/api/partners', { params })
}

// 获取所有合作方（下拉选择用）
export const getAllPartners = () => {
  return request.get('/api/partners/all')
}

// 获取合作方类型选项
export const getPartnerTypes = () => {
  return request.get('/api/partners/types')
}

// 获取合作方详情
export const getPartnerById = (id) => {
  return request.get(`/api/partners/${id}`)
}

// 创建合作方
export const createPartner = (data) => {
  return request.post('/api/partners', data)
}

// 更新合作方
export const updatePartner = (id, data) => {
  return request.put(`/api/partners/${id}`, data)
}

// 删除合作方
export const deletePartner = (id) => {
  return request.delete(`/api/partners/${id}`)
}

// 导出合作方
export const exportPartners = (params) => {
  return request.get('/api/partners/export', { 
    params,
    responseType: 'blob'
  })
}

// 搜索合作方
export const searchPartners = (keyword) => {
  return request.get('/api/partners/search', { params: { keyword } })
}
