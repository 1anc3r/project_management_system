import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, getProfile } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value.role === 'admin')
  const canViewAll = computed(() => ['admin', 'global'].includes(userInfo.value.role))

  // Actions
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  const loginAction = async (credentials) => {
    const res = await login(credentials)
    setToken(res.data.token)
    setUserInfo(res.data.user)
    return res
  }

  const getUserInfo = async () => {
    const res = await getProfile()
    setUserInfo(res.data)
    return res
  }

  const logout = () => {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    canViewAll,
    setToken,
    setUserInfo,
    loginAction,
    getUserInfo,
    logout
  }
})
