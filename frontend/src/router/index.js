import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 路由配置
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据概览', icon: 'DataLine' }
      },
      {
        path: '/projects',
        name: 'Projects',
        component: () => import('@/views/projects/index.vue'),
        meta: { title: '项目管理', icon: 'Folder' }
      },
      {
        path: '/opportunities',
        name: 'Opportunities',
        component: () => import('@/views/opportunities/index.vue'),
        meta: { title: '商机管理', icon: 'SuitcaseLine' }
      },
      {
        path: '/partners',
        name: 'Partners',
        component: () => import('@/views/partners/index.vue'),
        meta: { title: '合作方管理', icon: 'User' }
      },
      {
        path: '/information',
        name: 'Information',
        component: () => import('@/views/information/index.vue'),
        meta: { title: '资讯管理', icon: 'ChatDotRound' }
      },
      {
        path: '/knowledge',
        name: 'Knowledge',
        component: () => import('@/views/knowledge/index.vue'),
        meta: { title: '知识库管理', icon: 'Collection' }
      },
      {
        path: '/tools',
        name: 'Tools',
        component: () => import('@/views/tools/index.vue'),
        meta: { title: '工具箱', icon: 'Box' }
      },
      {
        path: '/system',
        name: 'System',
        component: () => import('@/views/system/index.vue'),
        meta: { title: '系统管理', icon: 'Setting', adminOnly: true },
        redirect: '/system/users',
        children: [
          {
            path: '/system/users',
            name: 'UserManagement',
            component: () => import('@/views/system/users.vue'),
            meta: { title: '用户管理' }
          },
          {
            path: '/system/logs',
            name: 'LogManagement',
            component: () => import('@/views/system/logs.vue'),
            meta: { title: '操作日志' }
          },
          {
            path: '/system/dictionaries',
            name: 'DictionaryManagement',
            component: () => import('@/views/system/dictionaries.vue'),
            meta: { title: '字典管理' }
          }
        ]
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 公开路由直接通过
  if (to.meta.public) {
    next()
    return
  }

  // 检查登录状态
  if (!userStore.token) {
    next('/login')
    return
  }

  // 检查管理员权限
  if (to.meta.adminOnly && userStore.userInfo.role !== 'admin') {
    next('/')
    return
  }

  next()
})

export default router
