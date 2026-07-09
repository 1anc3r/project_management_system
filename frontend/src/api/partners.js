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

// 导出合作方联系人
export const exportPartnerContacts = (params) => {
  return request.get('/api/partners/export-contacts', {
    params,
    responseType: 'blob'
  })
}

// 搜索合作方
export const searchPartners = (keyword) => {
  return request.get('/api/partners/search', { params: { keyword } })
}

// 获取合作方地址及经纬度坐标
export const getPartnerLocations = (id) => {
  return request.get(`/api/partners/${id}/addresses`)
}

// 获取合作方联系人列表
export const getPartnerContacts = (id) => {
  return request.get(`/api/partners/${id}/contacts`)
}

// 添加合作方联系人
export const addPartnerContact = (id, data) => {
  return request.post(`/api/partners/${id}/contacts`, data)
}

// 更新合作方联系人
export const updatePartnerContact = (id, contactId, data) => {
  return request.put(`/api/partners/${id}/contacts/${contactId}`, data)
}

// 删除合作方联系人
export const deletePartnerContact = (id, contactId) => {
  return request.delete(`/api/partners/${id}/contacts/${contactId}`)
}

// 批量更新联系人排序
export const sortPartnerContacts = (id, contacts) => {
  return request.put(`/api/partners/${id}/contacts-sort`, { contacts })
}

// 获取筛选选项
export const getFilterOptions = () => {
  return request.get('/api/partners/filters')
}
