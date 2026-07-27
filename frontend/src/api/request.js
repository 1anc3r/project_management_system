import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 401 统一处理：清除登录态并通过路由跳转（保留回跳地址），避免整页刷新丢失 SPA 状态
// 使用动态 import 引入 router，规避 request -> router -> store -> api 的循环依赖
const handleUnauthorized = async () => {
  const userStore = useUserStore()
  userStore.logout()
  const { default: router } = await import('@/router')
  const currentPath = router.currentRoute.value.fullPath
  if (currentPath !== '/login') {
    router.push({ path: '/login', query: { redirect: currentPath } })
  }
}

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
        handleUnauthorized()
      }

      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  (error) => {
    // blob 响应的错误体需特殊处理，避免提示 [object Blob]
    if (error.config?.responseType === 'blob' && error.response?.data instanceof Blob) {
      error.response.data.text().then(text => {
        try {
          const data = JSON.parse(text)
          ElMessage.error(data.message || '请求失败')
        } catch {
          ElMessage.error('请求失败')
        }
      })
    } else {
      const message = error.response?.data?.message || error.message || '网络错误'
      ElMessage.error(message)
    }

    // 401 未授权（包括登录过期）
    if (error.response?.status === 401) {
      handleUnauthorized()
    }

    return Promise.reject(error)
  }
)

export default request
