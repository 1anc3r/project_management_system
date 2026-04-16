import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 创建axios实例
const request = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 如果是 blob 响应，直接返回 response 对象
    if (response.config.responseType === 'blob') {
      return response
    }
    
    const res = response.data
    
    // 如果响应码不是200，说明出错了
    if (res.code !== 200 && res.code !== 201) {
      ElMessage.error(res.message || '请求失败')
      
      // 401 未授权，跳转到登录页
      if (res.code === 401) {
        const userStore = useUserStore()
        userStore.logout()
        window.location.href = '/login'
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络错误'
    ElMessage.error(message)
    
    // // 401 未授权
    // if (error.response?.status === 401) {
    //   const userStore = useUserStore()
    //   userStore.logout()
    //   window.location.href = '/login'
    // }
    
    return Promise.reject(error)
  }
)

export default request
