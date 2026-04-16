<template>
  <div class="partners-container">
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
            placeholder="搜索合作方名称、纳税人识别号、联系人"
            clearable
            style="width: 300px"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>
        
        <div class="right-btns">
          <el-button :icon="Download" @click="handleExport">导出</el-button>
          <el-button :icon="View" @click="viewMode = viewMode === 'list' ? 'grid' : 'list'">
            {{ viewMode === 'list' ? '网格' : '列表' }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 列表视图 -->
    <el-card v-if="viewMode === 'list'" class="list-card" shadow="never">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="partnerList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        border
        stripe
        highlight-current-row
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="name" label="合作方名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tax_id" label="纳税人识别号" width="160" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="120" />
        <el-table-column prop="project_count" label="项目数" width="80" align="center" />
        <el-table-column prop="total_contract_amount" label="合同总金额" width="120" align="right">
          <template #default="{ row }">{{ formatAmount(row.total_contract_amount) }} 万</template>
        </el-table-column>
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
        <el-col v-for="item in partnerList" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="partner-card" shadow="hover">
            <div class="card-header">
              <el-tag size="small">{{ item.type }}</el-tag>
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
              <h4 class="partner-name" :title="item.name">{{ item.name }}</h4>
              <p class="contact-info">
                <el-icon><User /></el-icon>
                {{ item.contact || '暂无联系人' }}
              </p>
              <p class="phone-info">
                <el-icon><Phone /></el-icon>
                {{ item.contact_phone || '暂无电话' }}
              </p>
              <div class="stats">
                <span class="stat-item">
                  <span class="label">项目</span>
                  <span class="value">{{ item.project_count }}</span>
                </span>
                <span class="stat-item">
                  <span class="label">金额</span>
                  <span class="value">{{ formatAmount(item.total_contract_amount) }}万</span>
                </span>
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
    <PartnerFormDialog
      v-model:visible="formDialogVisible"
      :type="formType"
      :data="currentRow"
      @success="fetchData"
    />
    
    <!-- 详情对话框 -->
    <PartnerDetailDialog
      v-model="detailDialogVisible"
      :partner="detailRow"
      @edit="(row) => { handleEdit(row) }"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Edit, Delete, Search, Download, View, More, User, Phone
} from '@element-plus/icons-vue'
import { getPartners, deletePartner, exportPartners } from '@/api/partners'
import { formatAmount, downloadBlob } from '@/utils/format'
import PartnerFormDialog from './components/PartnerFormDialog.vue'
import PartnerDetailDialog from './components/PartnerDetailDialog.vue'

const router = useRouter()

// 视图模式
const viewMode = ref('list')

// 加载状态
const loading = ref(false)

// 合作方列表
const partnerList = ref([])
const selectedRows = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: ''
})

// 表单对话框
const formDialogVisible = ref(false)
const formType = ref('add')
const currentRow = ref(null)

// 详情对话框
const detailDialogVisible = ref(false)
const detailRow = ref(null)

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword
    }
    const res = await getPartners(params)
    partnerList.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (error) {
    console.error('获取合作方列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
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
  detailRow.value = row
  detailDialogVisible.value = true
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除合作方 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deletePartner(row.id)
    ElMessage.success('删除成功')
    fetchData()
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个合作方吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    for (const row of selectedRows.value) {
      await deletePartner(row.id)
    }
    ElMessage.success('批量删除成功')
    fetchData()
  })
}

// 导出
const handleExport = async () => {
  try {
    const response = await exportPartners({
      format: 'xlsx',
      keyword: searchForm.keyword
    })
    downloadBlob(response.data, `partners_${new Date().getTime()}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
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
  fetchData()
})
</script>

<style scoped lang="scss">
.partners-container {
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
  
  .list-card, .grid-card {
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
  
  .grid-card {
    .partner-card {
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
        
        .more-icon {
          cursor: pointer;
          padding: 5px;
          
          &:hover {
            color: #409EFF;
          }
        }
      }
      
      .card-body {
        .partner-name {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .contact-info, .phone-info {
          font-size: 13px;
          color: #606266;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .stats {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #ebeef5;
          
          .stat-item {
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
