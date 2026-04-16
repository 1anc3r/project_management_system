import request from './request'

// 登录
export const login = (data) => {
  return request.post('/api/auth/login', data)
}

// 登出
export const logout = () => {
  return request.post('/api/auth/logout')
}

// 获取用户信息
export const getProfile = () => {
  return request.get('/api/auth/profile')
}

// 修改密码
export const changePassword = (data) => {
  return request.put('/api/auth/password', data)
}
