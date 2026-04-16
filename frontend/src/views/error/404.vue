<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <p class="error-message">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="handleBack">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const handleBack = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.error-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  
  .error-content {
    text-align: center;
    
    .error-code {
      font-size: 120px;
      font-weight: 700;
      color: #409EFF;
      margin-bottom: 20px;
      line-height: 1;
    }
    
    .error-message {
      font-size: 18px;
      color: #606266;
      margin-bottom: 30px;
    }
  }
}
</style>
