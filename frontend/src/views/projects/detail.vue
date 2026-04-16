<template>
  <div class="project-detail">
    <el-page-header @back="handleBack" title="项目详情" />
    
    <el-card v-loading="loading" class="detail-card">
      <template #header>
        <div class="card-header">
          <span class="title">{{ project.name }}</span>
          <el-tag :type="getStageType(project.stage)" size="large">{{ project.stage }}</el-tag>
        </div>
      </template>
      
      <!-- 基本信息 -->
      <div class="section">
        <div class="section-title">基本信息</div>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="项目名称">{{ project.name }}</el-descriptions-item>
          <el-descriptions-item label="履约地点">{{ project.city }}</el-descriptions-item>
          <el-descriptions-item label="项目阶段">
            <el-tag :type="getStageType(project.stage)" size="small">{{ project.stage }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="签约方式">{{ project.expansion_method }}</el-descriptions-item>
          <el-descriptions-item label="项目内容">{{ project.content }}</el-descriptions-item>
          <el-descriptions-item label="项目周期">
            {{ formatDate(project.start_date) }} 至 {{ formatDate(project.end_date) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <!-- 金额信息 -->
      <div class="section">
        <div class="section-title">金额信息</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="amount-card highlight">
              <div class="amount-label">合同总金额</div>
              <div class="amount-value">{{ formatAmount(project.total_amount) }} 万元</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="amount-card">
              <div class="amount-label">已开票金额</div>
              <div class="amount-value">{{ formatAmount(project.receipt_amount) }} 万元</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="amount-card">
              <div class="amount-label">待开票金额</div>
              <div class="amount-value">{{ formatAmount(project.pending_amount) }} 万元</div>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 15px">
          <el-col :span="8">
            <div class="amount-card highlight">
              <div class="amount-label">成本</div>
              <div class="amount-value">{{ formatAmount(project.cost) }} 万元</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="amount-card">
              <div class="amount-label">毛利</div>
              <div class="amount-value">{{ formatAmount(project.profit) }} 万元</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="amount-card">
              <div class="amount-label">毛利率</div>
              <div class="amount-value">{{ formatPercent(project.profit_rate) }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 款项情况 -->
      <div class="section">
        <div class="section-title">款项情况</div>
        <el-table :data="project.payments" border>
          <el-table-column type="index" label="序号" width="50" align="center" />
          <el-table-column prop="payment_type" label="款项" width="100" />
          <el-table-column prop="payment_condition" label="款项条件" min-width="200" show-overflow-tooltip />
          <el-table-column prop="payment_ratio" label="支付比例" width="100" align="right">
            <template #default="{ row }">{{ row.payment_ratio }}%</template>
          </el-table-column>
          <el-table-column prop="payment_amount" label="款项金额" width="120" align="right">
            <template #default="{ row }">{{ formatAmount(row.payment_amount) }} 万元</template>
          </el-table-column>
          <el-table-column prop="is_paid" label="是否支付" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_paid ? 'success' : 'info'" size="small">
                {{ row.is_paid ? '已支付' : '未支付' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="payment_date" label="支付日期" width="120">
            <template #default="{ row }">{{ formatDate(row.payment_date) }}</template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 合作方信息 -->
      <div class="section">
        <div class="section-title">合作方信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="合作方名称" :span="2">{{ project.partner_name }}</el-descriptions-item>
          <el-descriptions-item label="纳税人识别号" :span="2">{{ project.partner_tax_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ project.partner_address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开户银行">{{ project.partner_bank || '-' }}</el-descriptions-item>
          <el-descriptions-item label="银行账号">{{ project.partner_bank_account || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ project.partner_contact || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ project.partner_contact_phone || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <!-- 附件列表 -->
      <div class="section">
        <div class="section-title">项目附件</div>
        <el-table v-if="project.attachments?.length" :data="project.attachments" border>
          <el-table-column prop="file_name" label="文件名" min-width="250" show-overflow-tooltip />
          <el-table-column prop="attachment_type" label="类型" width="160">
            <template #default="{ row }">
              <el-select v-model="row.attachment_type" size="small" disabled="true" @change="(val) => handleUpdateAttachmentType(row, val)">
                <el-option v-for="type in attachmentTypes" :key="type" :label="type" :value="type" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="file_size" label="大小" width="100">
            <template #default="{ row }">{{ formatFileSize(row.file_size) }}</template>
          </el-table-column>
          <el-table-column prop="created_at" label="上传时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleDownload(row)">下载</el-button>
              <el-button link type="danger" size="small" @click="handleDeleteAttachment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无附件" />
      </div>

      <!-- 编辑对话框 -->
      <ProjectFormDialog
        v-model:visible="formDialogVisible"
        :type="formType"
        :data="project"
        @success="fetchData"
      />
      
      <!-- 操作按钮 -->
      <div class="section actions">
        <el-button type="primary" @click="handleEdit">编辑项目</el-button>
        <el-button @click="handleBack">返回列表</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjectById } from '@/api/projects'
import { downloadAttachment, deleteAttachment, updateAttachment, getAttachmentTypes } from '@/api/attachments'
import { formatAmount, formatPercent, formatDate, formatDateTime, formatFileSize, downloadBlob } from '@/utils/format'
import ProjectFormDialog from './components/ProjectFormDialog.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const project = ref({})
const attachmentTypes = ref([])

// 表单对话框
const formDialogVisible = ref(false)
const formType = ref('edit')
const currentRow = ref(null)

// 获取附件类型列表
const fetchAttachmentTypes = async () => {
  try {
    const res = await getAttachmentTypes()
    attachmentTypes.value = res.data
  } catch (error) {
    console.error('获取附件类型失败:', error)
  }
}

// 标签类型
const getStageType = (stage) => {
  const typeMap = {
    '意向': 'error',
    '签约': 'warning',
    '建设': 'primary',
    '运营': 'primary',
    '交付': 'primary',
    '验收': 'success',
    '完结': 'dark'
  }
  return typeMap[stage] || 'info'
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getProjectById(route.params.id)
    project.value = res.data
  } catch (error) {
    console.error('获取项目详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 返回
const handleBack = () => {
  router.back()
}

// 编辑
const handleEdit = () => {
  console.log('handleEdit')
  formType.value = 'edit'
  currentRow.value = project
  formDialogVisible.value = true
}

// 下载
const handleDownload = async (row) => {
  try {
    const response = await downloadAttachment(row.id)
    downloadBlob(response.data, row.file_name)
  } catch (error) {
    console.error('下载失败:', error)
  }
}

// 删除附件
const handleDeleteAttachment = (row) => {
  ElMessageBox.confirm(`确定要删除附件 "${row.file_name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteAttachment(row.id)
    ElMessage.success('删除成功')
    fetchData()
  })
}

// 更新附件类型
const handleUpdateAttachmentType = async (row, newType) => {
  try {
    await updateAttachment(row.id, { attachment_type: newType })
    ElMessage.success('附件类型更新成功')
  } catch (error) {
    console.error('更新附件类型失败:', error)
    // 恢复原值
    fetchData()
  }
}

onMounted(() => {
  fetchData()
  fetchAttachmentTypes()
})
</script>

<style scoped lang="scss">
.project-detail {
  .el-page-header {
    margin-bottom: 20px;
  }
  
  .detail-card {
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .title {
        font-size: 18px;
        font-weight: 600;
      }
    }
    
    .section {
      margin-bottom: 30px;
      
      .section-title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 15px;
        padding-left: 10px;
        border-left: 4px solid #409EFF;
      }
      
      .amount-card {
        background-color: #f5f7fa;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        
        .amount-label {
          font-size: 13px;
          color: #909399;
          margin-bottom: 8px;
        }
        
        .amount-value {
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }
        
        &.highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          
          .amount-label, .amount-value {
            color: #fff;
          }
        }
      }
    }
    
    .actions {
      display: flex;
      justify-content: center;
      gap: 15px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;
    }
  }
}
</style>
