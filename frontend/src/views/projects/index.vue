<template>
  <div class="projects-container">
    <!-- 操作面板 -->
    <el-card class="operation-card" shadow="never">
      <div class="operation-bar">
        <div class="left-btns">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
          <el-button :icon="Edit" :disabled=!selectedRows.length @click="handleBatchEdit">编辑</el-button>
          <el-button type="danger" :icon="Delete" :disabled=!selectedRows.length @click="handleBatchDelete">删除</el-button>
        </div>
        
        <div class="center-search">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索项目、合作方、地点、联系人"
            clearable
            style="width: 280px"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>
        
        <div class="right-btns">
          <el-button :icon="Upload" @click="handleImport">导入</el-button>
          <el-button :icon="Download" @click="handleExport">导出</el-button>
          <el-button :icon="View" @click="viewMode = viewMode === 'list' ? 'grid' : 'list'">
            {{ viewMode === 'list' ? '网格' : '列表' }}
          </el-button>
        </div>
      </div>
      
      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-select v-model="searchForm.type" placeholder="项目类型" clearable style="width: 120px">
          <el-option v-for="item in filterOptions.types" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.stage" placeholder="项目阶段" clearable style="width: 120px">
          <el-option v-for="item in filterOptions.stages" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.city" placeholder="履约地点" clearable style="width: 140px">
          <el-option v-for="item in filterOptions.cities" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.expansionMethod" placeholder="签约方式" clearable style="width: 130px">
          <el-option v-for="item in filterOptions.expansionMethods" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.content" placeholder="项目内容" clearable style="width: 120px">
          <el-option v-for="item in filterOptions.contents" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.sortField" placeholder="排序字段" clearable style="width: 130px">
          <el-option label="项目阶段" value="stage" />
          <el-option label="合同金额" value="total_amount" />
          <el-option label="已开票金额" value="receipt_amount" />
          <el-option label="成本" value="cost" />
          <el-option label="创建时间" value="created_at" />
        </el-select>
        <el-select v-model="searchForm.sortOrder" placeholder="排序方式" style="width: 100px">
          <el-option label="降序" value="desc" />
          <el-option label="升序" value="asc" />
        </el-select>
        <el-button type="primary" plain @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 列表视图 -->
    <el-card v-if="viewMode === 'list'" class="list-card" shadow="never">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="projectList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblClick"
        border
        stripe
        highlight-current-row
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="name" label="项目名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="项目类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeType(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stage" label="项目阶段" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStageType(row.stage)" size="small">{{ row.stage }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expansion_method" label="签约方式" width="110" />
        <el-table-column prop="total_amount" label="合同总金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="receipt_amount" label="已开票金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.receipt_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="pending_amount" label="待开票金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.pending_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="成本" width="100" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.cost) }}
          </template>
        </el-table-column>
        <el-table-column prop="profit" label="毛利" width="100" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.profit) }}
          </template>
        </el-table-column>
        <el-table-column prop="profit_rate" label="毛利率" width="90" align="right">
          <template #default="{ row }">
            {{ formatPercent(row.profit_rate) }}
          </template>
        </el-table-column>
        <el-table-column prop="partner_name" label="合作方" min-width="150" show-overflow-tooltip />
        <el-table-column prop="partner_contact" label="联系人" width="100" />
        <el-table-column prop="partner_contact_phone" label="联系电话" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
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

    <!-- 网格视图 -->
    <el-card v-else class="grid-card" shadow="never">
      <el-row :gutter="20">
        <el-col v-for="item in projectList" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="project-card" shadow="hover" @dblclick="handleView(item)">
            <div class="card-header">
              <div class="card-tags">
                <el-tag :type="getTypeType(item.type)" size="small">{{ item.type }}</el-tag>
                <el-tag :type="getStageType(item.stage)" size="small">{{ item.stage }}</el-tag>
              </div>
              <el-dropdown @command="(cmd) => handleCardCommand(cmd, item)">
                <el-icon class="more-icon"><More /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="view">查看</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="card-body">
              <h4 class="project-name" :title="item.name">{{ item.name }}</h4>
              <p class="partner-name">{{ item.partner_name }}</p>
              <div class="amount-info">
                <div class="amount-item">
                  <span class="label">合同金额</span>
                  <span class="value">{{ formatAmount(item.total_amount) }}万</span>
                </div>
                <div class="amount-item">
                  <span class="label">已开票</span>
                  <span class="value">{{ formatAmount(item.receipt_amount) }}万</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
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
    <ProjectFormDialog
      v-model:visible="formDialogVisible"
      :type="formType"
      :data="currentRow"
      @success="fetchData"
    />

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入项目" width="500px">
      <el-upload
        ref="uploadRef"
        action=""
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".xlsx,.xls,.csv,.json"
      >
        <el-button type="primary">选择文件</el-button>
        <template #tip>
          <div class="el-upload__tip">
            支持 Excel (.xlsx, .xls)、CSV、JSON 格式文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Edit, Delete, Search, Upload, Download, View, More
} from '@element-plus/icons-vue'
import { getProjects, deleteProject, exportProjects, importProjects, getFilterOptions } from '@/api/projects'
import { formatAmount, formatPercent, downloadBlob } from '@/utils/format'
import ProjectFormDialog from './components/ProjectFormDialog.vue'

const route = useRoute()
const router = useRouter()

// 视图模式
const viewMode = ref('list')

// 加载状态
const loading = ref(false)

// 项目列表
const projectList = ref([])
const selectedRows = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  type: '',
  stage: '',
  city: '',
  expansionMethod: '',
  content: '',
  sortField: '',
  sortOrder: 'desc'
})

// 筛选选项
const filterOptions = reactive({
  stages: [],
  types: [],
  cities: [],
  expansionMethods: [],
  contents: []
})

// 表单对话框
const formDialogVisible = ref(false)
const formType = ref('add')
const currentRow = ref(null)

// 导入对话框
const importDialogVisible = ref(false)
const uploadRef = ref(null)
const importFile = ref(null)

// 获取阶段标签类型
const getStageType = (stage) => {
  const typeMap = {
    '意向': 'danger',
    '签约': 'warning',
    '建设': 'primary',
    '运营': 'primary',
    '交付': 'primary',
    '验收': 'success',
    '完结': 'info'
  }
  return typeMap[stage] || 'info'
}

// 获取项目类型标签类型
const getTypeType = (type) => {
  const typeMap = {
    '收入合同': 'success',
    '支出合同': 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const res = await getProjects(params)
    projectList.value = res.data.list || []
    pagination.total = res.data.pagination?.total || 0
  } catch (error) {
    console.error('获取项目列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取筛选选项
const fetchFilterOptions = async () => {
  try {
    const res = await getFilterOptions()
    filterOptions.stages = res.data.stages
    filterOptions.types = res.data.types
    filterOptions.cities = res.data.cities
    filterOptions.expansionMethods = res.data.expansionMethods
    filterOptions.contents = res.data.contents
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
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = key === 'sortOrder' ? 'desc' : ''
  })
  handleSearch()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchData()
}

// 分页更新
const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

// 新增
const handleAdd = () => {
  formType.value = 'add'
  currentRow.value = null
  formDialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  formType.value = 'edit'
  currentRow.value = row
  formDialogVisible.value = true
}

// 批量编辑
const handleBatchEdit = () => {
  if (selectedRows.value.length === 1) {
    handleEdit(selectedRows.value[0])
  } else {
    ElMessage.warning('请选择一条记录进行编辑')
  }
}

// 查看
const handleView = (row) => {
  router.push({
    name: 'ProjectDetail',
    params: { id: row.id }
  })
}

// 双击行
const handleRowDblClick = (row) => {
  handleView(row)
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除项目 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteProject(row.id)
    ElMessage.success('删除成功')
    fetchData()
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个项目吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    for (const row of selectedRows.value) {
      await deleteProject(row.id)
    }
    ElMessage.success('批量删除成功')
    fetchData()
  })
}

// 导出
const handleExport = async () => {
  try {
    const response = await exportProjects({
      format: 'xlsx',
      keyword: searchForm.keyword,
      stage: searchForm.stage,
      type: searchForm.type
    })
    downloadBlob(response.data, `projects_${new Date().getTime()}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
  }
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
  importFile.value = null
}

// 附件更新
const handleFileChange = (file) => {
  importFile.value = file.raw
}

// 附件导入
const handleImportSubmit = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  
  const formData = new FormData()
  formData.append('file', importFile.value)
  
  try {
    const res = await importProjects(formData)
    ElMessage.success(res.message)
    importDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('导入失败:', error)
  }
}

// 卡片操作
const handleCardCommand = (command, row) => {
  if (command === 'edit') {
    handleEdit(row)
  } else if (command === 'view') {
    handleView(row)
  } else if (command === 'delete') {
    handleDelete(row)
  }
}

onMounted(async () => {
  // 先加载筛选选项
  await fetchFilterOptions()
  
  // 从URL参数获取搜索条件
  if (route.query.city) {
    searchForm.city = route.query.city
  }
  if (route.query.stage) {
    searchForm.stage = route.query.stage
  }
  if (route.query.type) {
    searchForm.type = route.query.type
  }
  if (route.query.keyword) {
    searchForm.keyword = route.query.keyword
  }
  
  // 再获取数据
  fetchData()
})
</script>

<style scoped lang="scss">
.projects-container {
  .operation-card {
    margin-bottom: 15px;
    
    .operation-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
  }
  
  .list-card, .grid-card {
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
  
  .grid-card {
    .project-card {
      margin-bottom: 20px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        
        .card-tags {
          display: flex;
          gap: 5px;
        }
        
        .more-icon {
          cursor: pointer;
          padding: 5px;
          
          &:hover {
            color: #409EFF;
          }
        }
      }
      
      .card-body {
        .project-name {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .partner-name {
          font-size: 13px;
          color: #909399;
          margin-bottom: 12px;
        }
        
        .amount-info {
          display: flex;
          justify-content: space-between;
          
          .amount-item {
            text-align: center;
            
            .label {
              display: block;
              font-size: 12px;
              color: #909399;
              margin-bottom: 4px;
            }
            
            .value {
              font-size: 14px;
              font-weight: 600;
              color: #409EFF;
            }
          }
        }
      }
    }
  }
}
</style>
