<template>
  <el-dialog v-model="visible" title="商机详情" width="900px" :close-on-click-modal="false" class="opportunity-detail-dialog"
    destroy-on-close :fullscreen="isFullscreen">
    <template #header>
      <div class="header">
        <span class="title"><el-icon><Document /></el-icon>商机详情</span>
        <div class="header-actions">
          <el-button link size="small" @click="toggleFullscreen">
            <el-icon>
              <FullScreen v-if="!isFullscreen" />
              <Close v-else />
            </el-icon>
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </el-button>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="detail-content">
      <!-- 头部信息 -->
      <div class="detail-header" v-if="opportunityData">
        <div class="detail-title">
          <span class="title-text">{{ opportunityData.name }}</span>
          <div class="header-tags">
            <el-tag :type="getOpportunityStageTag(opportunityData.stage)" size="large">{{ opportunityData.stage }}</el-tag>
            <el-tag :type="getOpportunityInterestTag(opportunityData.interest)" size="large">{{ opportunityData.interest }}</el-tag>
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="section" v-if="opportunityData">
        <div class="section-title">基本信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商机名称">{{ opportunityData.name }}</el-descriptions-item>
          <el-descriptions-item label="商机来源">{{ opportunityData.source || '-' }}</el-descriptions-item>
          <el-descriptions-item label="商机阶段">
            <el-tag :type="getOpportunityStageTag(opportunityData.stage)" size="small">{{ opportunityData.stage }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="意向等级">
            <el-tag :type="getOpportunityInterestTag(opportunityData.interest)" size="small">{{ opportunityData.interest }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预计金额">{{ formatAmount(opportunityData.estimated_amount) }}万元</el-descriptions-item>
          <el-descriptions-item label="预计成交日期">{{ formatDate(opportunityData.estimated_date) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 合作方信息 -->
      <div class="section" v-if="opportunityData">
        <div class="section-title">合作方信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="合作方名称" :span="2">
            {{ opportunityData.partner_name }}
            <el-button type="primary" size="small" @click="handleViewPartner">查看</el-button>
          </el-descriptions-item>
          <el-descriptions-item label="纳税人识别号" :span="2">{{ opportunityData.partner_tax_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ opportunityData.partner_address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ opportunityData.partner_contact || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ opportunityData.partner_contact_phone || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 附件列表 -->
      <div class="section" v-if="opportunityData">
        <div class="section-title">
          附件列表
          <el-tag type="info" size="small" class="count-tag">{{ opportunityData.attachments?.length || 0 }} 个</el-tag>
        </div>
        <el-table v-if="opportunityData.attachments?.length" :data="opportunityData.attachments" border size="small">
          <el-table-column prop="file_name" label="文件名" min-width="250" show-overflow-tooltip />
          <el-table-column prop="attachment_type" label="类型" width="140">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.attachment_type || '其他' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="file_size" label="大小" width="100">
            <template #default="{ row }">{{ formatFileSize(row.file_size) }}</template>
          </el-table-column>
          <el-table-column prop="created_at" label="上传时间" width="140">
            <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openPreview(row)">预览</el-button>
              <el-button link type="primary" size="small" @click="handleDownload(row)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无附件" />
      </div>
    </div>

    <!-- 合作方详情对话框 -->
    <PartnerDetailDialog v-model="partnerDialogVisible" :partner="partnerDetailData" />

    <!-- 附件预览对话框 -->
    <AttachmentPreviewDialog v-model="previewVisible" :attachment="previewAttachment" />

    <template #footer>
      <el-button @click="handleClose">
        <el-icon>
          <ArrowLeft />
        </el-icon> 返回列表
      </el-button>
      <el-button type="primary" @click="handleEdit">编辑</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, FullScreen, Close } from '@element-plus/icons-vue'
import { getOpportunityById } from '@/api/opportunities'
import { getPartnerById } from '@/api/partners'
import { downloadAttachment } from '@/api/attachments'
import { formatAmount, formatDate, formatDateTime, formatFileSize, downloadBlob, getOpportunityStageTag, getOpportunityInterestTag } from '@/utils/format'
import PartnerDetailDialog from '../../partners/components/PartnerDetailDialog.vue'
import AttachmentPreviewDialog from '@/components/AttachmentPreviewDialog.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  opportunity: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'edit'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 加载状态
const loading = ref(false)

// 商机详情数据
const opportunityData = ref(null)

// 详情对话框
const partnerDialogVisible = ref(false)
const partnerDetailData = ref(null)

// 附件预览状态
const previewVisible = ref(false)
const previewAttachment = ref(null)

// 全屏切换
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 获取商机详情
const fetchOpportunityDetail = async () => {
  if (!props.opportunity?.id) return
  loading.value = true
  try {
    const oppRes = await getOpportunityById(props.opportunity.id)
    opportunityData.value = oppRes.data
    // 加载合作方详情数据
    if (opportunityData.value.partner_id) {
      try {
        const partRes = await getPartnerById(opportunityData.value.partner_id)
        partnerDetailData.value = partRes.data
      } catch (e) {
        partnerDetailData.value = null
      }
    }
  } catch (error) {
    console.error('获取商机详情失败:', error)
    ElMessage.error('获取商机详情失败')
  } finally {
    loading.value = false
  }
}

// 监听对话框显示
watch(() => visible.value, (val) => {
  if (val && props.opportunity?.id) {
    opportunityData.value = null
    fetchOpportunityDetail()
  }
})

// 监听商机ID变化
watch(() => props.opportunity?.id, (newId) => {
  if (newId && visible.value) {
    opportunityData.value = null
    fetchOpportunityDetail()
  }
})

// 查看合作方
const handleViewPartner = () => {
  partnerDialogVisible.value = true
}

// 打开附件预览
const openPreview = (att) => {
  previewAttachment.value = att
  previewVisible.value = true
}

// 下载附件
const handleDownload = async (row) => {
  try {
    const response = await downloadAttachment(row.id)
    downloadBlob(response.data, row.file_name)
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

// 编辑
const handleEdit = () => {
  visible.value = false
  emit('edit', props.opportunity)
}

// 关闭
const handleClose = () => {
  opportunityData.value = null
  visible.value = false
}
</script>

<style scoped lang="scss">
.opportunity-detail-dialog {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 16px;

    .title {
      gap: 8px;
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: 500;
      color: #303133;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .detail-content {
    .detail-header {
      margin-bottom: 20px;

      .detail-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;

        .title-text {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }

        .header-tags {
          display: flex;
          gap: 8px;
        }
      }
    }

    .section {
      margin-bottom: 20px;

      .section-title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 15px;
        padding-left: 10px;
        border-left: 4px solid #409EFF;
      }

      .count-tag {
        font-size: 12px;
        margin-left: 10px;
        font-weight: normal;
      }
    }
  }
}
</style>
