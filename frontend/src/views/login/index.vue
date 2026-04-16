<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon size="48" color="#409EFF"><Management /></el-icon>
        <h1 class="title">企业项目全生命周期管理系统</h1>
        <p class="subtitle">Project Management System</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-tips">
        <p>请联系管理员创建账号</p>
      </div>
    </div>
    
    <div class="login-footer">
      <p>© 2024 企业项目全生命周期管理系统</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    await userStore.loginAction({
      username: loginForm.username,
      password: loginForm.password
    })
    
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  .login-box {
    width: 420px;
    padding: 40px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    
    .login-header {
      text-align: center;
      margin-bottom: 30px;
      
      .title {
        margin-top: 16px;
        font-size: 22px;
        font-weight: 600;
        color: #303133;
      }
      
      .subtitle {
        margin-top: 8px;
        font-size: 14px;
        color: #909399;
      }
    }
    
    .login-form {
      .login-btn {
        width: 100%;
      }
    }
    
    .login-tips {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #909399;
    }
  }
  
  .login-footer {
    position: fixed;
    bottom: 20px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
  }
}
</style>
