<template>
  <div class="opportunities-container">
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
          <el-input v-model="searchForm.keyword" placeholder="搜索商机名称、合作方、商机来源……" clearable style="width: 400px"
            @keyup.enter="handleSearch">
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>

        <div class="right-btns">
          <!-- 视图切换 -->
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

      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-select v-model="searchForm.stage" placeholder="商机阶段" clearable style="width: 120px">
          <el-option v-for="item in filterOptions.stages" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.interest" placeholder="意向等级" clearable style="width: 120px">
          <el-option v-for="item in filterOptions.interests" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="searchForm.sortField" placeholder="排序字段" clearable style="width: 120px">
          <el-option label="商机阶段" value="stage" />
          <el-option label="意向等级" value="interest" />
          <el-option label="预计金额" value="estimated_amount" />
          <el-option label="预计成交日期" value="estimated_date" />
          <el-option label="创建时间" value="created_at" />
        </el-select>
        <el-select v-model="searchForm.sortOrder" placeholder="排序方式" style="width: 90px">
          <el-option label="降序" value="desc" />
          <el-option label="升序" value="asc" />
        </el-select>
        <el-button type="primary" plain @click="handleSearch">查询</el-button>
        <el-button class="reset-btn" @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 列表视图 -->
    <el-card v-if="viewMode === 'list'" class="list-card" shadow="never" v-loading="loading">
      <el-table ref="tableRef" :data="opportunityList" style="width: 100%" @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblClick" border stripe highlight-current-row>
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="name" label="商机名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="stage" label="商机阶段" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getOpportunityStageTag(row.stage)" size="small">{{ row.stage }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="interest" label="意向等级" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getOpportunityInterestTag(row.interest)" size="small">{{ row.interest }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="estimated_amount" label="预计金额" width="90" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.estimated_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="estimated_date" label="预计成交日期" width="110" align="center"/>
        <el-table-column prop="partner_name" label="合作方" min-width="150" show-overflow-tooltip />
        <el-table-column prop="partner_contact" label="联系人" width="100" />
        <el-table-column prop="partner_contact_phone" label="联系电话" width="120" />
        <el-table-column prop="source" label="商机来源" min-width="180" show-overflow-tooltip />
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
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 网格视图 -->
    <el-card v-else class="grid-card" shadow="never" v-loading="loading">
      <el-empty v-if="opportunityList.length === 0" description="暂无商机" />
      <el-row :gutter="20">
        <el-col v-for="item in opportunityList" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="opportunity-card" shadow="hover" @dblclick="handleView(item)">
            <div class="card-header">
              <div class="card-tags">
                <el-tag :type="getOpportunityStageTag(item.stage)" size="small">{{ item.stage }}</el-tag>
                <el-tag :type="getOpportunityInterestTag(item.interest)" size="small">{{ item.interest }}</el-tag>
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
              <h4 class="opportunity-name" :title="item.name">{{ item.name }}</h4>
              <p class="partner-name">{{ item.partner_name }}</p>
              <div class="meta-info">
                <div class="meta-item">
                  <span class="label">预计金额</span>
                  <span class="value">{{ formatAmount(item.estimated_amount) }}万</span>
                </div>
                <div class="meta-item">
                  <span class="label">预计成交</span>
                  <span class="value">{{ formatDate(item.estimated_date) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

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
    <OpportunityFormDialog v-model:visible="formDialogVisible" :type="formType" :data="currentRow" @success="fetchData" />

    <!-- 详情对话框 -->
    <OpportunityDetailDialog v-model="detailDialogVisible" :opportunity="detailRow" @edit="handleEditFromDetail" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Edit, Delete, Search, More, List, Grid
} from '@element-plus/icons-vue'
import { getOpportunities, deleteOpportunity, getFilterOptions } from '@/api/opportunities'
import { formatAmount, formatDate, getOpportunityStageTag, getOpportunityInterestTag } from '@/utils/format'
import OpportunityFormDialog from './components/OpportunityFormDialog.vue'
import OpportunityDetailDialog from './components/OpportunityDetailDialog.vue'

const userStore = useUserStore()

// 视图模式，默认列表
const viewMode = ref('list')

// 加载状态
const loading = ref(false)

// 商机列表及选中行
const opportunityList = ref([])
const selectedRows = ref([])
const currentRow = ref(null)

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  stage: '',
  interest: '',
  sortField: '',
  sortOrder: 'desc'
})

// 筛选选项
const filterOptions = reactive({
  stages: [],
  interests: []
})

// 表单对话框
const formDialogVisible = ref(false)
const formType = ref('add')

// 详情对话框
const detailDialogVisible = ref(false)
const detailRow = ref(null)

// 权限检查
const canEdit = (row) => {
  if (!row) return false
  const userInfo = userStore.userInfo
  if (userInfo.role === 'admin') return true
  return row.created_by === userInfo.id
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
    const res = await getOpportunities(params)
    opportunityList.value = res.data.list || []
    pagination.total = res.data.pagination?.total || 0
  } catch (error) {
    console.error('获取商机列表失败:', error)
    ElMessage.error('获取商机列表失败')
  } finally {
    loading.value = false
  }
}

// 获取筛选选项
const fetchFilterOptions = async () => {
  try {
    const res = await getFilterOptions()
    filterOptions.stages = res.data.stages || []
    filterOptions.interests = res.data.interests || []
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
  if (canEdit(row)) {
    formType.value = 'edit'
    currentRow.value = row
    formDialogVisible.value = true
  } else {
    ElMessage.warning('您没有权限编辑此商机')
  }
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
  detailRow.value = row
  detailDialogVisible.value = true
}

// 双击行
const handleRowDblClick = (row) => {
  handleView(row)
}

// 从详情页编辑
const handleEditFromDetail = (row) => {
  detailDialogVisible.value = false
  handleEdit(row)
}

// 删除
const handleDelete = (row) => {
  if (canEdit(row)) {
    ElMessageBox.confirm(`确定要删除商机 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await deleteOpportunity(row.id)
      ElMessage.success('删除成功')
      fetchData()
    })
  } else {
    ElMessage.warning('您没有权限删除此商机')
  }
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个商机吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    for (const row of selectedRows.value) {
      if (canEdit(row)) {
        await deleteOpportunity(row.id)
      }
    }
    ElMessage.success('批量删除成功')
    fetchData()
  })
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
  await fetchFilterOptions()
  fetchData()
})
</script>

<style scoped lang="scss">
.opportunities-container {
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

      .reset-btn {
        margin-left: 0px;
      }
    }
  }

  .list-card,
  .grid-card {
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .grid-card {
    .opportunity-card {
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
        .opportunity-name {
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
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 12px;
        }

        .meta-info {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #ebeef5;
          display: flex;
          justify-content: space-between;

          .meta-item {
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
