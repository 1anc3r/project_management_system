import request from './request'

// 获取操作日志列表
export const getLogs = (params) => {
  return request.get('/api/logs', { params })
}

// 导出操作日志
export const exportLogs = (params) => {
  return request.get('/api/logs/export', { 
    params,
    responseType: 'blob'
  })
}

// 获取筛选选项
export const getLogFilterOptions = () => {
  return request.get('/api/logs/filters')
}
