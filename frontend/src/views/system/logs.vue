<template>
  <div class="logs-container">
    <!-- 筛选面板 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="searchForm.username"
          placeholder="操作人"
          clearable
          style="width: 150px"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="searchForm.module" placeholder="模块" clearable style="width: 120px">
          <el-option v-for="item in filterOptions.modules" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.operation" placeholder="操作" clearable style="width: 120px">
          <el-option v-for="item in filterOptions.operations" :key="item" :label="item" :value="item" />
        </el-select>
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" :icon="Download" @click="handleExport">导出</el-button>
      </div>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="list-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="logList"
        style="width: 100%"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column prop="module" label="模块" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operation" label="操作" width="100">
          <template #default="{ row }">
            <el-tag :type="getOperationType(row.operation)" size="small">{{ row.operation }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_name" label="数据名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="130" />
        <el-table-column prop="created_at" label="操作时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import { getLogs, exportLogs, getLogFilterOptions } from '@/api/logs'
import { formatDateTime, downloadBlob } from '@/utils/format'

// 加载状态
const loading = ref(false)

// 日志列表
const logList = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  username: '',
  module: '',
  operation: '',
  dateRange: []
})

// 筛选选项
const filterOptions = reactive({
  modules: [],
  operations: []
})

// 获取操作类型
const getOperationType = (operation) => {
  const typeMap = {
    '新增': 'success',
    '编辑': 'primary',
    '删除': 'danger',
    '登录': 'info',
    '登出': 'info',
    '导出': 'warning',
    '导入': 'warning'
  }
  return typeMap[operation] || ''
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      username: searchForm.username,
      module: searchForm.module,
      operation: searchForm.operation,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1]
    }
    const res = await getLogs(params)
    logList.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) {
    console.error('获取操作日志失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取筛选选项
const fetchFilterOptions = async () => {
  try {
    const res = await getLogFilterOptions()
    filterOptions.modules = res.data.modules
    filterOptions.operations = res.data.operations
  } catch (error) {
    console.error('获取筛选选项失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 重置
const handleReset = () => {
  searchForm.username = ''
  searchForm.module = ''
  searchForm.operation = ''
  searchForm.dateRange = []
  handleSearch()
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

// 导出
const handleExport = async () => {
  try {
    const response = await exportLogs({
      format: 'xlsx',
      username: searchForm.username,
      module: searchForm.module,
      operation: searchForm.operation,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1]
    })
    downloadBlob(response.data, `logs_${new Date().getTime()}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
  }
}

onMounted(() => {
  fetchData()
  fetchFilterOptions()
})
</script>

<style scoped lang="scss">
.logs-container {
  .filter-card {
    margin-bottom: 15px;
    
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
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
