<template>
  <div class="knowledge-container">

    <!-- 搜索和操作栏 -->
    <el-card class="operation-card" shadow="never">
      <div class="operation-bar">
        <div class="left-btns">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
          <el-button :icon="Edit" :disabled="!selectedRows.length" @click="handleBatchEdit">编辑</el-button>
          <el-button type="danger" :icon="Delete" :disabled="!selectedRows.length"
            @click="handleBatchDelete">删除</el-button>
          <el-button :icon="Download" @click="handleExport">导出</el-button>
        </div>

        <div class="center-search">
          <el-input v-model="searchForm.keyword" placeholder="搜索问题、答案关键词……" clearable style="width: 600px"
            @keyup.enter="handleSearch">
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>

        <!-- 视图切换 -->
        <div class="view-toggle">
          <el-radio-group v-model="viewMode" size="middle">
            <el-radio-button label="list">
              <el-icon>
                <List />
              </el-icon> 列表
            </el-radio-button>
            <el-radio-button label="grid">
              <el-icon>
                <Grid />
              </el-icon> 网格
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 列表视图筛选条件 -->
      <div class="filter-bar">
        <el-select v-model="searchForm.category" placeholder="分类" clearable style="width: 150px">
          <el-option v-for="item in filterOptions.categories" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.tags" placeholder="标签" clearable multiple collapse-tags style="width: 150px">
          <el-option v-for="item in filterOptions.hotTags" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.sortBy" placeholder="排序字段" clearable style="width: 150px">
          <el-option label="创建时间" value="created_at" />
          <el-option label="更新时间" value="updated_at" />
          <el-option label="浏览次数" value="view_count" />
        </el-select>
        <el-select v-model="searchForm.sortOrder" style="width: 75px">
          <el-option label="降序" value="desc" />
          <el-option label="升序" value="asc" />
        </el-select>
        <el-button type="primary" plain @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 列表视图 -->
    <el-card v-if="viewMode === 'list'" class="list-card" shadow="never" v-loading="loading">
      <el-table :data="knowledgeList" style="width: 100%" @selection-change="handleSelectionChange"
        @row-click="handleRowClick" highlight-current-row stripe border>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="question" label="标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="question-cell">
              <span class="question-text">{{ row.question }}</span>
              <el-tag v-if="row.attachment_count > 0" size="small" type="info" class="attach-tag">
                <el-icon>
                  <Paperclip />
                </el-icon>{{ row.attachment_count }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="200">
          <template #default="{ row }">
            <el-tag v-for="tag in formatTags(row.tags)" :key="tag" size="small" class="tag-item">
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="view_count" label="浏览量" width="90" align="center">
          <template #default="{ row }">
            <span class="view-count">
              <el-icon>
                <View />
              </el-icon> {{ row.view_count || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_by_name" label="创建人" width="100" align="center" />
        <el-table-column prop="created_at" label="创建时间" width="160" align="center">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="handleEdit(row)" v-if="canEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click.stop="handleView(row)">查看</el-button>
            <el-button link type="danger" size="small" @click.stop="handleDelete(row)"
              v-if="canEdit(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 网格视图 -->
    <el-card v-else class="grid-card" shadow="never" v-loading="loading">
      <el-empty v-if="knowledgeList.length === 0" description="暂无知识条目" />

      <el-row :gutter="20">
        <el-col v-for="item in knowledgeList" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="knowledge-card" shadow="hover" @dblclick="handleView(item)">
            <div class="card-header">
              <div class="card-tags">
                <el-tag size="small" type="primary">{{ item.category }}</el-tag>
              </div>
              <el-dropdown @command="(cmd) => handleCardCommand(cmd, item)">
                <el-icon class="more-icon" size="28">
                  <More />
                </el-icon>
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
              <h4 class="card-title" :title="item.question">{{ item.question }}</h4>
              <p class="card-preview">{{ stripHtml(item.answer_preview || item.answer) }}</p>
              <div class="card-footer">
                <span class="footer-item">
                  <el-icon>
                    <Paperclip />
                  </el-icon> {{ item.attachment_count || 0 }}
                </span>
                <span class="footer-item">
                  <el-icon>
                    <View />
                  </el-icon> {{ item.view_count || 0 }}
                </span>
                <span class="footer-item">{{ item.created_by_name }}</span>
                <span class="footer-item">{{ formatDate(item.created_at) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 批量操作栏 -->
    <div class="batch-bar" v-if="selectedRows.length > 0">
      <span>已选择 {{ selectedRows.length }} 项</span>
    </div>

    <!-- 新增/编辑对话框 -->
    <KnowledgeFormDialog v-model:visible="formDialogVisible" :type="formType" :data="currentRow" @success="fetchData" />

    <!-- 详情对话框 -->
    <KnowledgeDetailDialog v-model:visible="detailDialogVisible" :data="currentRow" @edit="handleEditFromDetail"
      @delete="fetchData" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, List, Grid, Download, Upload, Edit,
  View, Paperclip, Delete
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getKnowledges, deleteKnowledge, batchDeleteKnowledge, exportKnowledge, importKnowledge, getFilterOptions } from '@/api/knowledge'
import { formatDate, formatDateTime, downloadBlob } from '@/utils/format'
import KnowledgeFormDialog from './components/KnowledgeFormDialog.vue'
import KnowledgeDetailDialog from './components/KnowledgeDetailDialog.vue'

const userStore = useUserStore()

// 加载状态
const loading = ref(false)

// 视图模式：list = 列表视图, card = 网格视图
const viewMode = ref('list')

// 知识库列表
const knowledgeList = ref([])
const selectedRows = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  category: '',
  tags: [],
  sortBy: '',
  sortOrder: 'desc'
})

// 筛选选项
const filterOptions = reactive({
  categories: [],
  hotTags: []
})

// 表单对话框
const formDialogVisible = ref(false)
const formType = ref('add')
const currentRow = ref(null)

// 详情对话框
const detailDialogVisible = ref(false)

// 导入对话框
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importFile = ref(null)
const uploadRef = ref(null)

// 权限检查
const canEdit = (row) => {
  if (!row) return false
  const userInfo = userStore.userInfo
  if (userInfo.role === 'admin') return true
  return row.created_by === userInfo.id
}

const canImport = computed(() => {
  return userStore.userInfo.role === 'admin' || userStore.userInfo.role === 'global'
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      category: searchForm.category || undefined,
      tags: searchForm.tags.length > 0 ? searchForm.tags.join(',') : undefined,
      sortBy: searchForm.sortBy || undefined,
      sortOrder: searchForm.sortOrder
    }
    const res = await getKnowledges(params)
    knowledgeList.value = res.data.list || []
    pagination.total = res.data.pagination?.total || 0
    pagination.totalPages = res.data.pagination?.totalPages || 0

    // 更新筛选选项
    if (res.data.filters) {
      filterOptions.categories = res.data.filters.categories || []
      filterOptions.hotTags = res.data.filters.hotTags || []
    }
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    ElMessage.error('获取知识库列表失败')
  } finally {
    loading.value = false
  }
}

// 获取筛选选项
const fetchFilterOptions = async () => {
  try {
    const res = await getFilterOptions()
    if (res.data) {
      filterOptions.categories = res.data.categories || []
      filterOptions.hotTags = res.data.hotTags || []
    }
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
  searchForm.keyword = ''
  searchForm.category = ''
  searchForm.tags = []
  searchForm.sortBy = 'created_at'
  searchForm.sortOrder = 'desc'
  pagination.page = 1
  fetchData()
}

// 清除关键词
const clearKeyword = () => {
  searchForm.keyword = ''
  handleSearch()
}

// 清除分类
const clearCategory = () => {
  searchForm.category = ''
  handleSearch()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 格式化标签
const formatTags = (tagsStr) => {
  if (!tagsStr) return []
  return tagsStr.split(',').map(t => t.trim()).filter(Boolean)
}

// 去除HTML标签
const stripHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
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

// 从详情页编辑
const handleEditFromDetail = (row) => {
  detailDialogVisible.value = false
  handleEdit(row)
}

// 查看详情
const handleView = (row) => {
  currentRow.value = row
  detailDialogVisible.value = true
}

// 行点击
const handleRowClick = (row) => {
  handleView(row)
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除知识条目 "${row.question}" 吗？此操作不可恢复。`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteKnowledge(row.id)
    ElMessage.success('删除成功')
    fetchData()
  }).catch(() => { })
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return
  const ids = selectedRows.value.map(row => row.id)
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 条知识条目吗？此操作不可恢复。`,
    '确认批量删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await batchDeleteKnowledge(ids)
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    fetchData()
  }).catch(() => { })
}

// 导出
const handleExport = async () => {
  try {
    const response = await exportKnowledge({
      format: 'xlsx',
      keyword: searchForm.keyword || undefined,
      category: searchForm.category || undefined,
      tags: searchForm.tags.length > 0 ? searchForm.tags.join(',') : undefined
    })
    downloadBlob(response.data, `knowledge_${new Date().getTime()}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
  importFile.value = null
}

const handleFileChange = (file) => {
  importFile.value = file.raw
}

const confirmImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  importLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)
    const res = await importKnowledge(formData)
    ElMessage.success(res.message || '导入成功')
    importDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importLoading.value = false
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

onMounted(() => {
  fetchFilterOptions()
  fetchData()
})
</script>

<style scoped lang="scss">
.knowledge-container {
  .operation-card {
    margin-bottom: 15px;

    .operation-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 10px;

      .view-toggle {
        .el-radio-group {
          .el-radio-button__inner {
            display: flex;
            align-items: center;
          }
        }
      }
    }

    .filter-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
  }

  .question-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .question-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .attach-tag {
      flex-shrink: 0;
    }
  }

  .tag-item {
    margin-right: 4px;
    margin-bottom: 2px;
  }

  .view-count {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #909399;
    font-size: 13px;
  }

  // 网格视图样式
  .card-col {
    margin-bottom: 16px;
  }

  .knowledge-card {
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

      .card-title {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        line-height: 1.4;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }

      .card-preview {
        flex: 1;
        margin: 0 0 12px;
        font-size: 13px;
        color: #606266;
        line-height: 1.6;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .card-footer {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-top: 10px;
        border-top: 1px solid #ebeef5;
        font-size: 12px;
        color: #909399;

        .footer-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .batch-bar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 100;

    span {
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>
