<template>
  <div class="users-container">
    <!-- 操作面板 -->
    <el-card class="operation-card" shadow="never">
      <div class="operation-bar">
        <div class="left-btns">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
        </div>
        
        <div class="center-search">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索用户名、姓名"
            clearable
            style="width: 250px"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>
        
        <div class="right-filters">
          <el-select v-model="searchForm.role" placeholder="角色" clearable style="width: 120px" @change="handleSearch">
            <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 100px" @change="handleSearch">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="list-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="userList"
        style="width: 100%"
        border
        stripe
      >
        <el-table-column prop="username" label="账号" width="120" />
        <el-table-column prop="nickname" label="姓名" width="120">
          <template #default="{ row }">{{ row.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)" size="small">{{ getRoleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button 
              link 
              :type="row.status === 1 ? 'danger' : 'success'" 
              size="small" 
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="formType === 'add' ? '新增用户' : '编辑用户'"
      v-model="formDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" :disabled="formType === 'edit'" />
        </el-form-item>
        
        <el-form-item v-if="formType === 'add'" label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        
        <el-form-item label="姓名" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入姓名" />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      title="重置密码"
      v-model="passwordDialogVisible"
      width="400px"
    >
      <el-form :model="passwordForm" label-width="100px">
        <el-form-item label="新密码" required>
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPassword" :loading="passwordLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getUsers, createUser, updateUser, deleteUser, resetPassword, getRoles } from '@/api/users'
import { formatDateTime } from '@/utils/format'

// 加载状态
const loading = ref(false)

// 用户列表
const userList = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  role: '',
  status: ''
})

// 角色选项
const roleOptions = ref([])

// 表单对话框
const formDialogVisible = ref(false)
const formType = ref('add')
const formRef = ref(null)
const submitLoading = ref(false)
const form = ref({
  username: '',
  password: '',
  nickname: '',
  role: 'normal',
  status: 1
})

// 表单验证规则
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

// 密码对话框
const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)
const passwordForm = ref({
  userId: null,
  newPassword: ''
})

// 获取角色类型
const getRoleType = (role) => {
  const typeMap = {
    'admin': 'danger',
    'global': 'warning',
    'normal': ''
  }
  return typeMap[role] || ''
}

// 获取角色标签
const getRoleLabel = (role) => {
  const labelMap = {
    'admin': '管理员',
    'global': '全局用户',
    'normal': '普通用户'
  }
  return labelMap[role] || role
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      role: searchForm.role,
      status: searchForm.status
    }
    const res = await getUsers(params)
    userList.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取角色选项
const fetchRoles = async () => {
  try {
    const res = await getRoles()
    roleOptions.value = res.data
  } catch (error) {
    console.error('获取角色选项失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

// 新增
const handleAdd = () => {
  formType.value = 'add'
  form.value = {
    username: '',
    password: '',
    nickname: '',
    role: 'normal',
    status: 1
  }
  formDialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  formType.value = 'edit'
  form.value = {
    username: row.username,
    nickname: row.nickname || '',
    role: row.role,
    status: row.status
  }
  formDialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  await formRef.value.validate()
  
  submitLoading.value = true
  try {
    if (formType.value === 'add') {
      await createUser(form.value)
      ElMessage.success('用户创建成功')
    } else {
      const { username, ...updateData } = form.value
      const user = userList.value.find(u => u.username === username)
      if (user) {
        await updateUser(user.id, updateData)
        ElMessage.success('用户更新成功')
      }
    }
    
    formDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields()
  formDialogVisible.value = false
}

// 切换状态
const handleToggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const statusText = newStatus === 1 ? '启用' : '禁用'
  
  try {
    await updateUser(row.id, { status: newStatus })
    ElMessage.success(`${statusText}成功`)
    fetchData()
  } catch (error) {
    console.error('切换状态失败:', error)
  }
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchData()
  })
}

// 重置密码
const handleResetPassword = (row) => {
  passwordForm.value = {
    userId: row.id,
    newPassword: ''
  }
  passwordDialogVisible.value = true
}

const handleSubmitPassword = async () => {
  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }
  
  passwordLoading.value = true
  try {
    await resetPassword(passwordForm.value.userId, passwordForm.value.newPassword)
    ElMessage.success('密码重置成功')
    passwordDialogVisible.value = false
  } catch (error) {
    console.error('重置密码失败:', error)
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchRoles()
})
</script>

<style scoped lang="scss">
.users-container {
  .operation-card {
    margin-bottom: 15px;
    
    .operation-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
  }
  
  .list-card {
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
