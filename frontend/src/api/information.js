import request from './request'

// 获取资讯列表
export const getInformationList = (params) => {
  return request.get('/api/information', { params })
}

// 获取资讯详情
export const getInformationById = (id) => {
  return request.get(`/api/information/${id}`)
}

// 创建资讯
export const createInformation = (data) => {
  return request.post('/api/information', data)
}

// 更新资讯
export const updateInformation = (id, data) => {
  return request.put(`/api/information/${id}`, data)
}

// 删除资讯
export const deleteInformation = (id) => {
  return request.delete(`/api/information/${id}`)
}

// 获取资讯类型选项
export const getInformationTypes = () => {
  return request.get('/api/information/types')
}

// 根据合作方ID获取资讯列表
export const getInformationByPartner = (partnerId, params) => {
  return request.get(`/api/information/by-partner/${partnerId}`, { params })
}

// 根据项目ID获取资讯列表
export const getInformationByProject = (projectId, params) => {
  return request.get(`/api/information/by-project/${projectId}`, { params })
}

// 获取所有资讯（仪表盘用）
export const getAllInformation = (params) => {
  return request.get('/api/information/all', { params })
}
