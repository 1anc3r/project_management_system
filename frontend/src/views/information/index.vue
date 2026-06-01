<template>
  <div class="information-container">
    <!-- 操作面板 -->
    <el-card class="operation-card" shadow="never">
      <div class="operation-bar">
        <div class="left-btns">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
          <el-button :icon="Edit" :disabled="!selectedRows.length" @click="handleBatchEdit">编辑</el-button>
          <el-button type="danger" :icon="Delete" :disabled="!selectedRows.length"
            @click="handleBatchDelete">删除</el-button>
        </div>

        <div class="center-search">
          <el-input v-model="searchForm.keyword" placeholder="搜索资讯标题、内容" clearable style="width: 300px"
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
            <el-radio-button label="timeline">
              <el-icon>
                <Timer />
              </el-icon> 时间线
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 列表视图筛选条件 -->
      <div class="filter-bar">
        <el-select v-model="searchForm.informationType" placeholder="资讯类型" clearable style="width: 100px">
          <el-option v-for="item in informationTypes" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.partnerId" placeholder="关联合作方" clearable filterable style="width: 150px">
          <el-option v-for="item in partnerOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-select v-model="searchForm.projectId" placeholder="关联项目" clearable filterable style="width: 150px">
          <el-option v-for="item in projectOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-date-picker v-model="searchForm.startDate" type="date" placeholder="开始日期" value-format="YYYY-MM-DD"
          style="width: 150px" />
        <el-date-picker v-model="searchForm.endDate" type="date" placeholder="结束日期" value-format="YYYY-MM-DD"
          style="width: 150px" />
        <el-select v-model="searchForm.sortField" placeholder="排序字段" clearable style="width: 150px">
          <el-option label="资讯日期" value="information_date" />
          <el-option label="资讯类型" value="information_type" />
          <el-option label="创建时间" value="created_at" />
        </el-select>
        <el-select v-model="searchForm.sortOrder" placeholder="排序方式" style="width: 75px">
          <el-option label="降序" value="desc" />
          <el-option label="升序" value="asc" />
        </el-select>
        <el-button type="primary" plain @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 列表视图 -->
    <template v-if="viewMode === 'list'">
      <el-card class="list-card" shadow="never">
        <el-table ref="tableRef" v-loading="loading" :data="informationList" style="width: 100%"
          @selection-change="handleSelectionChange" @row-dblclick="handleRowDblClick" border stripe
          highlight-current-row>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="information_date" label="资讯日期" width="110" align="center">
            <template #default="{ row }">{{ formatDate(row.information_date) }}</template>
          </el-table-column>
          <el-table-column prop="information_type" label="资讯类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getInfoTypeTag(row.information_type)" size="small">{{ row.information_type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="information_title" label="资讯标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="information_content" label="资讯内容" min-width="250" show-overflow-tooltip />
          <el-table-column prop="partner_name" label="关联合作方" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ row.partner_name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="project_name" label="关联项目" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ row.project_name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="160" align="center">
            <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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
    </template>

    <!-- 时间线视图 -->
    <template v-else class="timeline-card" shadow="never">
      <!-- 资讯列表（可折叠/展开） -->
      <el-row :gutter="20" class="info-row">
        <el-col :span="24">
          <el-card class="info-card" shadow="hover">
            <el-collapse v-model="activeCollapse">
              <el-collapse-item name="information">
                <template #title>
                  <div class="collapse-header">
                    <span class="collapse-title">全部资讯</span>
                    <el-tag type="info" size="small" class="count-tag">{{ informationList.length }} 条</el-tag>
                  </div>
                </template>
                <el-timeline v-if="informationList.length">
                  <el-timeline-item v-for="item in informationList" :key="item.id"
                    :type="getInfoTypeTag(item.information_type)" :timestamp="formatDate(item.information_date)"
                    placement="top">
                    <el-card shadow="never" class="info-item-card">
                      <template #header>
                        <div class="info-item-header">
                          <span class="info-item-title">{{ item.information_title }}</span>
                          <el-tag :type="getInfoTypeTag(item.information_type)" size="small">{{ item.information_type
                          }}</el-tag>
                        </div>
                      </template>
                      <p class="info-item-content">{{ item.information_content || '暂无内容' }}</p>
                      <div class="info-item-meta">
                        <span v-if="item.partner_name" class="meta-item">
                          <el-icon>
                            <User />
                          </el-icon>
                          {{ item.partner_name }}
                        </span>
                        <span v-if="item.project_name" class="meta-item">
                          <el-icon>
                            <Folder />
                          </el-icon>
                          {{ item.project_name }}
                        </span>
                      </div>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
                <el-empty v-else description="暂无资讯" />
              </el-collapse-item>
            </el-collapse>

            <!-- 分页 -->
            <div class="pagination-wrapper">
              <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
                :page-sizes="[20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 批量操作栏 -->
    <div class="batch-bar" v-if="selectedRows.length > 0">
      <span>已选择 {{ selectedRows.length }} 项</span>
    </div>

    <!-- 新增/编辑对话框 -->
    <InformationFormDialog v-model:visible="formDialogVisible" :type="formType" :data="currentRow"
      @success="fetchData" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, List, Timer } from '@element-plus/icons-vue'
import { getInformations, deleteInformation, getInformationTypes } from '@/api/information'
import { getAllPartners } from '@/api/partners'
import { getProjects } from '@/api/projects'
import { formatDate, formatDateTime, getInfoTypeTag } from '@/utils/format'
import InformationFormDialog from './components/InformationFormDialog.vue'

// 加载状态
const loading = ref(false)

// 当前视图：list = 列表视图, timeline = 时间线视图
const viewMode = ref('list')

// 折叠面板激活项
const activeCollapse = ref(['information'])

// 资讯列表
const informationList = ref([])
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
  informationType: '',
  partnerId: '',
  projectId: '',
  startDate: '',
  endDate: '',
  sortField: '',
  sortOrder: 'desc'
})

// 筛选选项
const informationTypes = ref([])
const partnerOptions = ref([])
const projectOptions = ref([])

// 表单对话框
const formDialogVisible = ref(false)
const formType = ref('add')
const currentRow = ref(null)

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      informationType: searchForm.informationType || undefined,
      partnerId: searchForm.partnerId || undefined,
      projectId: searchForm.projectId || undefined,
      startDate: searchForm.startDate || undefined,
      endDate: searchForm.endDate || undefined,
      sortField: searchForm.sortField || undefined,
      sortOrder: searchForm.sortOrder
    }
    const res = await getInformations(params)
    informationList.value = res.data.list || []
    pagination.total = res.data.pagination?.total || 0
  } catch (error) {
    console.error('获取资讯列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取筛选选项
const fetchFilterOptions = async () => {
  try {
    const [typeRes, partnerRes, projectRes] = await Promise.all([
      getInformationTypes(),
      getAllPartners(),
      getProjects({ page: 1, pageSize: 1000 })
    ])
    informationTypes.value = typeRes.data || []
    partnerOptions.value = partnerRes.data || []
    projectOptions.value = projectRes.data.list || []
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

// 双击行
const handleRowDblClick = (row) => {
  handleEdit(row)
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除资讯 "${row.information_title}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteInformation(row.id)
    ElMessage.success('删除成功')
    fetchData()
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条资讯吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    for (const row of selectedRows.value) {
      await deleteInformation(row.id)
    }
    ElMessage.success('批量删除成功')
    fetchData()
  })
}

// 表单提交成功后的处理
const handleFormSuccess = () => {
  fetchData()
}

onMounted(() => {
  fetchFilterOptions()
  fetchData()
})
</script>

<style scoped lang="scss">
.information-container {
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

  .list-card,
  .info-card {
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .info-row {
    .info-card {
      .collapse-header {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;

        .collapse-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
          padding-left: 10px;
          border-left: 4px solid #409EFF;
        }

        .count-tag {
          font-size: 12px;
        }
      }

      .info-item-card {
        margin-bottom: 5px;

        .info-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .info-item-title {
            font-weight: 600;
            font-size: 14px;
          }
        }

        .info-item-content {
          font-size: 13px;
          color: #606266;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .info-item-meta {
          margin-top: 8px;
          display: flex;
          gap: 15px;

          .meta-item {
            font-size: 12px;
            color: #909399;
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }
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
