import request from './request'

// 获取附件类型选项
export const getAttachmentTypes = () => {
  return request.get('/api/attachments/types')
}

// 获取项目附件列表
export const getAttachmentsByProject = (projectId) => {
  return request.get(`/api/attachments/project/${projectId}`)
}

// 上传附件
export const uploadAttachment = (formData) => {
  return request.post('/api/attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除附件
export const deleteAttachment = (id) => {
  return request.delete(`/api/attachments/${id}`)
}

// 下载附件
export const downloadAttachment = (id) => {
  return request.get(`/api/attachments/${id}/download`, {
    responseType: 'blob'
  })
}

// 更新附件类型
export const updateAttachment = (id, data) => {
  return request.put(`/api/attachments/${id}`, data)
}
