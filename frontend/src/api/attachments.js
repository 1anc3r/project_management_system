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

// 上传图片（专用于富文本编辑器）
export const uploadImage = (formData) => {
  return request.post('/api/attachments/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取图片预览URL
export const getImagePreviewUrl = (id) => {
  return `/api/attachments/${id}/preview`
}

// 删除附件
export const deleteAttachment = (id) => {
  return request.delete(`/api/attachments/${id}`)
}

// 获取通用文件预览 URL
export const getFileViewUrl = (id) => {
  return `/api/attachments/${id}/view`
}

// 获取文本文件内容
export const getFileContent = (id) => {
  return request.get(`/api/attachments/${id}/content`)
}

// 下载附件
export const downloadAttachment = (id) => {
  return request.get(`/api/attachments/${id}/download`, {
    responseType: 'blob'
  })
}

// 获取文件预览 Blob（通过 Authorization 头鉴权，不在 URL 中暴露登录凭证）
export const getFileViewBlob = (id) => {
  return request.get(`/api/attachments/${id}/view`, {
    responseType: 'blob'
  })
}

/**
 * 申请文件访问凭证（短期、绑定单个文件）
 * @param {Object} params - { ids?: number[], files?: string[] }
 * @returns {Promise<{ tokens: Object, expiresIn: number }>}
 */
export const getAccessTokens = async (params) => {
  const res = await request.post('/api/attachments/access-tokens', params)
  return res.data
}

// 更新附件类型
export const updateAttachment = (id, data) => {
  return request.put(`/api/attachments/${id}`, data)
}

/**
 * 获取附件预览类型
 * @param {string} filename - 文件名
 * @returns {string|null} image | pdf | text | office | null
 */
export const getPreviewType = (filename) => {
  if (!filename) return null
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  const previewMap = {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    pdf: ['.pdf'],
    text: ['.txt', '.csv', '.json', '.md', '.log', '.xml', '.css', '.js', '.html', '.htm', '.yaml', '.yml', '.sql'],
    office: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
  }
  for (const [type, exts] of Object.entries(previewMap)) {
    if (exts.includes(ext)) return type
  }
  return null
}

/**
 * 判断附件是否可预览
 * @param {string} filename - 文件名
 * @returns {boolean}
 */
export const isPreviewable = (filename) => {
  return getPreviewType(filename) !== null
}
