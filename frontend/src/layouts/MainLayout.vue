<template>
  <el-container class="main-layout">
    <!-- 左侧导航 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28"><Management /></el-icon>
        <span class="logo-text">项目管理系统</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>数据仪表板</span>
        </el-menu-item>
        
        <el-menu-item index="/projects">
          <el-icon><Folder /></el-icon>
          <span>项目管理</span>
        </el-menu-item>
        
        <el-menu-item index="/partners">
          <el-icon><User /></el-icon>
          <span>合作方管理</span>
        </el-menu-item>
        
        <el-sub-menu v-if="userStore.isAdmin" index="/system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/users">用户管理</el-menu-item>
          <el-menu-item index="/system/logs">操作日志</el-menu-item>
          <el-menu-item index="/system/dictionaries">字典管理</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索项目、合作方、地点、联系人..."
            class="search-input"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userStore.userInfo.nickname || userStore.userInfo.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 标签页 -->
      <div class="tabs-container">
        <div class="tabs-wrapper" ref="tabsWrapper">
          <div
            v-for="(tab, index) in tabStore.visitedViews"
            :key="tab.path"
            class="tab-item"
            :class="{ active: tabStore.activeTab === tab.path }"
            @click="handleTabClick(tab)"
            @contextmenu.prevent="handleContextMenu($event, tab, index)"
          >
            <span class="tab-title">{{ tab.title }}</span>
            <el-icon v-if="tab.name !== 'Dashboard'" class="tab-close" @click.stop="handleCloseTab(tab)">
              <Close />
            </el-icon>
          </div>
        </div>
        
        <el-dropdown @command="handleTabsCommand">
          <el-icon class="tabs-more"><ArrowDown /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="closeOthers">关闭其他</el-dropdown-item>
              <el-dropdown-item command="closeAll">关闭全部</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 主体内容 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component, route }">
          <keep-alive :include="tabStore.cachedViews">
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>

    <!-- 右键菜单 -->
    <div
      v-show="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuLeft + 'px', top: contextMenuTop + 'px' }"
    >
      <div class="menu-item" @click="handleRefresh">刷新</div>
      <div class="menu-item" @click="handleCloseCurrent">关闭</div>
      <div class="menu-item" @click="handleCloseOthers">关闭其他</div>
      <div class="menu-item" @click="handleCloseAll">关闭全部</div>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="400px"
    >
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useTabStore } from '@/stores/tabs'
import { changePassword } from '@/api/auth'
import Sortable from 'sortablejs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const tabStore = useTabStore()

// 搜索
const searchKeyword = ref('')
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/projects',
      query: { keyword: searchKeyword.value.trim() }
    })
  }
}

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 标签页拖拽
const tabsWrapper = ref(null)
let sortable = null

onMounted(() => {
  if (tabsWrapper.value) {
    sortable = Sortable.create(tabsWrapper.value, {
      animation: 150,
      onEnd: (evt) => {
        tabStore.updateTabPosition(evt.oldIndex, evt.newIndex)
      }
    })
  }
})

onUnmounted(() => {
  if (sortable) {
    sortable.destroy()
  }
})

// 监听路由变化，添加标签页
watch(
  () => route,
  (newRoute) => {
    if (newRoute.name && !newRoute.meta.hidden) {
      tabStore.addView(newRoute)
    }
  },
  { immediate: true, deep: true }
)

// 标签页点击
const handleTabClick = (tab) => {
  router.push(tab.fullPath)
}

// 关闭标签页
const handleCloseTab = (tab) => {
  tabStore.removeView(tab.path)
  if (tabStore.activeTab === tab.path && tabStore.visitedViews.length > 0) {
    const lastTab = tabStore.visitedViews[tabStore.visitedViews.length - 1]
    router.push(lastTab.fullPath)
  }
}

// 标签页下拉菜单
const handleTabsCommand = (command) => {
  if (command === 'closeOthers') {
    tabStore.removeOthers(tabStore.activeTab)
  } else if (command === 'closeAll') {
    tabStore.removeAll()
    router.push('/dashboard')
  }
}

// 右键菜单
const contextMenuVisible = ref(false)
const contextMenuLeft = ref(0)
const contextMenuTop = ref(0)
const currentTab = ref(null)
const currentTabIndex = ref(0)

const handleContextMenu = (e, tab, index) => {
  currentTab.value = tab
  currentTabIndex.value = index
  contextMenuLeft.value = e.clientX
  contextMenuTop.value = e.clientY
  contextMenuVisible.value = true
}

const hideContextMenu = () => {
  contextMenuVisible.value = false
}

onMounted(() => {
  document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
})

const handleRefresh = () => {
  hideContextMenu()
  router.replace({
    path: currentTab.value.fullPath
  })
}

const handleCloseCurrent = () => {
  hideContextMenu()
  handleCloseTab(currentTab.value)
}

const handleCloseOthers = () => {
  hideContextMenu()
  tabStore.removeOthers(currentTab.value.path)
  router.push(currentTab.value.fullPath)
}

const handleCloseAll = () => {
  hideContextMenu()
  tabStore.removeAll()
  router.push('/dashboard')
}

// 用户下拉菜单
const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
    })
  } else if (command === 'password') {
    passwordDialogVisible.value = true
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  }
}

// 修改密码
const passwordDialogVisible = ref(false)
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleChangePassword = async () => {
  await passwordFormRef.value.validate()
  await changePassword({
    oldPassword: passwordForm.value.oldPassword,
    newPassword: passwordForm.value.newPassword
  })
  ElMessage.success('密码修改成功')
  passwordDialogVisible.value = false
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    border-bottom: 1px solid #1f2d3d;
    
    .logo-text {
      margin-left: 10px;
      font-size: 16px;
      font-weight: 600;
    }
  }
  
  .sidebar-menu {
    border-right: none;
  }
}

.main-container {
  background-color: #f0f2f5;
}

.header {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  
  .search-input {
    width: 350px;
  }
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 0 10px;
      
      .username {
        margin: 0 8px;
        font-size: 14px;
      }
    }
  }
}

.tabs-container {
  background-color: #fff;
  padding: 6px 10px;
  border-bottom: 1px solid #d8dce5;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  .tabs-wrapper {
    flex: 1;
    display: flex;
    overflow-x: auto;
    
    &::-webkit-scrollbar {
      height: 0;
    }
  }
  
  .tab-item {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    margin-right: 5px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid #d8dce5;
    background-color: #fff;
    color: #495060;
    border-radius: 3px;
    transition: all 0.3s;
    user-select: none;
    
    &:hover {
      background-color: #f0f0f0;
    }
    
    &.active {
      background-color: #409EFF;
      color: #fff;
      border-color: #409EFF;
    }
    
    .tab-title {
      margin-right: 6px;
    }
    
    .tab-close {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }
    }
  }
  
  .tabs-more {
    margin-left: 10px;
    cursor: pointer;
    padding: 5px;
    
    &:hover {
      color: #409EFF;
    }
  }
}

.main-content {
  padding: 15px;
  overflow-y: auto;
}

.context-menu {
  position: fixed;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 3000;
  padding: 5px 0;
  
  .menu-item {
    padding: 8px 20px;
    font-size: 14px;
    cursor: pointer;
    
    &:hover {
      background-color: #f5f7fa;
      color: #409EFF;
    }
  }
}
</style>
