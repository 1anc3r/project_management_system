import request from './request'

// 获取数据概览
export const getDashboard = () => {
  return request.get('/api/projects/dashboard')
}

// 获取项目城市分布统计
export const getCityDistribution = () => {
  return request.get('/api/projects/city-distribution')
}


// 获取项目列表
export const getProjects = (params) => {
  return request.get('/api/projects', { params })
}

// 获取项目详情
export const getProjectById = (id) => {
  return request.get(`/api/projects/${id}`)
}

// 创建项目
export const createProject = (data) => {
  return request.post('/api/projects', data)
}

// 更新项目
export const updateProject = (id, data) => {
  return request.put(`/api/projects/${id}`, data)
}

// 删除项目
export const deleteProject = (id) => {
  return request.delete(`/api/projects/${id}`)
}

// 导出项目
export const exportProjects = (params) => {
  return request.get('/api/projects/export', { 
    params,
    responseType: 'blob'
  })
}

// 导入项目
export const importProjects = (formData) => {
  return request.post('/api/projects/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取筛选选项
export const getFilterOptions = () => {
  return request.get('/api/projects/filters')
}
