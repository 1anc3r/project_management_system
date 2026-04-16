import request from './request'

// 获取用户列表
export const getUsers = (params) => {
  return request.get('/api/users', { params })
}

// 获取用户详情
export const getUserById = (id) => {
  return request.get(`/api/users/${id}`)
}

// 创建用户
export const createUser = (data) => {
  return request.post('/api/users', data)
}

// 更新用户
export const updateUser = (id, data) => {
  return request.put(`/api/users/${id}`, data)
}

// 删除用户
export const deleteUser = (id) => {
  return request.delete(`/api/users/${id}`)
}

// 重置密码
export const resetPassword = (id, newPassword) => {
  return request.put(`/api/users/${id}/reset-password`, { newPassword })
}

// 获取角色选项
export const getRoles = () => {
  return request.get('/api/users/roles')
}
