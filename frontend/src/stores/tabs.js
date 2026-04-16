import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTabStore = defineStore('tabs', () => {
  // State
  const visitedViews = ref([
    { name: 'Dashboard', path: '/dashboard', title: '数据概览', fullPath: '/dashboard' }
  ])
  const cachedViews = ref(['Dashboard'])
  const activeTab = ref('/dashboard')

  // Getters
  const tabsList = computed(() => visitedViews.value)

  // Actions
  const addView = (view) => {
    // 检查是否已存在
    const exists = visitedViews.value.some(v => v.path === view.path)
    if (!exists) {
      visitedViews.value.push({
        name: view.name,
        path: view.path,
        title: view.meta?.title || view.name,
        fullPath: view.fullPath
      })
      // 添加到缓存
      if (view.name && !cachedViews.value.includes(view.name)) {
        cachedViews.value.push(view.name)
      }
    }
    activeTab.value = view.path
  }

  const removeView = (path) => {
    const index = visitedViews.value.findIndex(v => v.path === path)
    if (index > -1) {
      const view = visitedViews.value[index]
      visitedViews.value.splice(index, 1)
      // 从缓存中移除
      const cacheIndex = cachedViews.value.indexOf(view.name)
      if (cacheIndex > -1) {
        cachedViews.value.splice(cacheIndex, 1)
      }
      
      // 如果关闭的是当前激活的标签，激活相邻标签
      if (activeTab.value === path) {
        const nextView = visitedViews.value[index] || visitedViews.value[index - 1]
        if (nextView) {
          activeTab.value = nextView.path
        }
      }
    }
  }

  const removeOthers = (path) => {
    const current = visitedViews.value.find(v => v.path === path)
    const dashboard = visitedViews.value.find(v => v.name === 'Dashboard')
    visitedViews.value = [dashboard]
    cachedViews.value = ['Dashboard']
    if (current) {
      visitedViews.value.push(current)
      cachedViews.value.push(current.name)
      activeTab.value = path
    }
  }

  const removeAll = () => {
    const dashboard = visitedViews.value.find(v => v.name === 'Dashboard')
    if (dashboard) {
      visitedViews.value = [dashboard]
      cachedViews.value = ['Dashboard']
      activeTab.value = '/dashboard'
    } else {
      visitedViews.value = []
      cachedViews.value = []
      activeTab.value = ''
    }
  }

  const setActiveTab = (path) => {
    activeTab.value = path
  }

  const updateTabPosition = (oldIndex, newIndex) => {
    const item = visitedViews.value.splice(oldIndex, 1)[0]
    visitedViews.value.splice(newIndex, 0, item)
  }

  return {
    visitedViews,
    cachedViews,
    activeTab,
    tabsList,
    addView,
    removeView,
    removeOthers,
    removeAll,
    setActiveTab,
    updateTabPosition
  }
})
