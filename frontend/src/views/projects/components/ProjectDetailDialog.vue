<template>
  <el-dialog v-model="visible" title="项目详情" width="900px" :close-on-click-modal="false" class="project-detail-dialog"
    destroy-on-close :fullscreen="isFullscreen">
    <template #header>
      <div class="header">
        <span class="title"><el-icon><Document /></el-icon>项目详情</span>
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
      <div class="detail-header" v-if="projectData">
        <div class="detail-title">
          <span class="title-text">{{ projectData.name }}</span>
          <div class="header-tags">
            <el-tag :type="getProjectTypeTag(projectData.type)" size="large">{{ projectData.type || '收入合同' }}</el-tag>
            <el-tag :type="getProjectStageTag(projectData.stage)" size="large">{{ projectData.stage }}</el-tag>
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="section" v-if="projectData">
        <div class="section-title">基本信息</div>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="项目名称" :span="2">{{ projectData.name }}</el-descriptions-item>
          <el-descriptions-item label="履约地点">{{ projectData.city }}</el-descriptions-item>
          <el-descriptions-item label="项目类型">
            <el-tag :type="getProjectTypeTag(projectData.type)" size="small">{{ projectData.type || '收入合同' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="签约方式">{{ projectData.expansion_method }}</el-descriptions-item>
          <el-descriptions-item label="项目内容">{{ projectData.content }}</el-descriptions-item>
          <el-descriptions-item label="项目阶段">
            <el-tag :type="getProjectStageTag(projectData.stage)" size="small">{{ projectData.stage }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="项目周期">
            {{ formatDate(projectData.start_date) }} 至 {{ formatDate(projectData.end_date) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 金额信息 -->
      <div class="section" v-if="projectData">
        <div class="section-title">金额信息</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="amount-card highlight">
              <div class="amount-label">合同总金额</div>
              <div class="amount-value">{{ formatAmount(projectData.total_amount) }} 万元</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="amount-card">
              <div class="amount-label">已开票金额</div>
              <div class="amount-value">{{ formatAmount(projectData.receipt_amount) }} 万元</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="amount-card">
              <div class="amount-label">待开票金额</div>
              <div class="amount-value">{{ formatAmount(projectData.pending_amount) }} 万元</div>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 15px">
          <el-col :span="8">
            <div class="amount-card highlight">
              <div class="amount-label">成本</div>
              <div class="amount-value">{{ formatAmount(projectData.cost) }} 万元</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="amount-card">
              <div class="amount-label">毛利</div>
              <div class="amount-value">{{ formatAmount(projectData.profit) }} 万元</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="amount-card">
              <div class="amount-label">毛利率</div>
              <div class="amount-value">{{ formatPercent(projectData.profit_rate) }}</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 款项情况 -->
      <div class="section" v-if="projectData?.payments?.length">
        <div class="section-title">
          款项情况
          <el-tag type="info" size="small" class="count-tag">{{ projectData.payments.length }} 条</el-tag>
        </div>
        <el-table :data="projectData.payments" border size="small">
          <el-table-column type="index" label="序号" width="50" align="center" />
          <el-table-column prop="payment_type" label="款项" width="100" />
          <el-table-column prop="payment_condition" label="款项条件" min-width="200" show-overflow-tooltip />
          <el-table-column prop="payment_ratio" label="支付比例" width="100" align="right">
            <template #default="{ row }">{{ row.payment_ratio }}%</template>
          </el-table-column>
          <el-table-column prop="payment_amount" label="款项金额" width="120" align="right">
            <template #default="{ row }">{{ formatAmount(row.payment_amount) }} 万元</template>
          </el-table-column>
          <el-table-column prop="is_paid" label="是否开票" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_paid ? 'success' : 'info'" size="small">
                {{ row.is_paid ? '已开票' : '未开票' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="payment_date" label="开票日期" width="120">
            <template #default="{ row }">{{ formatDate(row.payment_date) }}</template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 合作方信息 -->
      <div class="section" v-if="projectData">
        <div class="section-title">合作方信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="合作方名称" :span="2">{{ projectData.partner_name }}
            <el-button type="primary" @click="handleViewPartner">查看</el-button></el-descriptions-item>
          <el-descriptions-item label="纳税人识别号" :span="2">{{ projectData.partner_tax_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ projectData.partner_address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开户银行">{{ projectData.partner_bank || '-' }}</el-descriptions-item>
          <el-descriptions-item label="银行账号">{{ projectData.partner_bank_account || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ projectData.partner_contact || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ projectData.partner_contact_phone || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 附件列表 -->
      <div class="section" v-if="projectData">
        <div class="section-title">
          项目附件
          <el-tag type="info" size="small" class="count-tag">{{ projectData.attachments?.length || 0 }} 个</el-tag>
        </div>
        <el-table v-if="projectData.attachments?.length" :data="projectData.attachments" border size="small">
          <el-table-column prop="file_name" label="文件名" min-width="250" show-overflow-tooltip />
          <el-table-column prop="attachment_type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.attachment_type || '其他' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="file_size" label="大小" width="100">
            <template #default="{ row }">{{ formatFileSize(row.file_size) }}</template>
          </el-table-column>
          <el-table-column prop="created_at" label="上传时间" width="120">
            <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openPreview(row)">预览</el-button>
              <el-button link type="primary" size="small" @click="handleDownload(row)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无附件" />
      </div>

      <!-- 相关资讯列表（可折叠/展开） -->
      <div class="info-section" v-if="projectData">
        <el-collapse v-model="activeCollapse">
          <el-collapse-item name="information">
            <template #title>
              <div class="collapse-title">
                <span class="section-title">相关资讯</span>
                <el-tag type="info" size="small" class="count-tag">{{ informationList.length }} 条</el-tag>
              </div>
            </template>
            <el-timeline v-if="informationList.length">
              <el-timeline-item v-for="item in informationList" :key="item.id"
                :type="getInfoTypeTag(item.information_type)" :timestamp="formatDate(item.information_date)"
                placement="top">
                <el-card shadow="never" class="info-card">
                  <template #header>
                    <div class="info-header">
                      <span class="info-title">{{ item.information_title }}</span>
                      <el-tag :type="getInfoTypeTag(item.information_type)" size="small">{{ item.information_type
                        }}</el-tag>
                    </div>
                  </template>
                  <p class="info-content">{{ item.information_content || '暂无内容' }}</p>
                  <p v-if="item.partner_name" class="info-partner">
                    <el-icon>
                      <Link />
                    </el-icon>
                    关联合作方：{{ item.partner_name }}
                  </p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无相关资讯" />
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <!-- 合作方详情对话框 -->
    <PartnerDetailDialog v-model="partnerDialogVisible" :partner="partnerDetailData"/>

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
import { Link, ArrowLeft } from '@element-plus/icons-vue'
import { getProjectById } from '@/api/projects'
import { getInformationByProject } from '@/api/information'
import { getPartnerById } from '@/api/partners'
import { downloadAttachment } from '@/api/attachments'
import { formatAmount, formatPercent, formatDate, formatDateTime, formatFileSize, downloadBlob, getProjectTypeTag, getProjectStageTag, getInfoTypeTag } from '@/utils/format'
import PartnerDetailDialog from '../../partners/components/PartnerDetailDialog.vue'
import AttachmentPreviewDialog from '@/components/AttachmentPreviewDialog.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  project: {
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

// 项目详情数据
const projectData = ref(null)

// 资讯列表
const informationList = ref([])

// 折叠面板激活项
const activeCollapse = ref(['information'])

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

// 获取项目详情
const fetchProjectDetail = async () => {
  if (!props.project?.id) return
  loading.value = true
  try {
    const proj_res = await getProjectById(props.project.id)
    projectData.value = proj_res.data
    const part_res = await getPartnerById(projectData.value.partner_id)
    partnerDetailData.value = part_res.data
  } catch (error) {
    console.error('获取项目详情失败:', error)
    ElMessage.error('获取项目详情失败')
  } finally {
    loading.value = false
  }
}

// 获取资讯列表
const fetchInformationData = async () => {
  if (!props.project?.id) return
  try {
    const res = await getInformationByProject(props.project.id, { limit: 50 })
    informationList.value = res.data || []
  } catch (error) {
    console.error('获取资讯列表失败:', error)
    informationList.value = []
  }
}

// 监听项目ID变化，加载数据
watch(() => props.project?.id, (newId) => {
  if (newId && visible.value) {
    projectData.value = null
    informationList.value = []
    activeCollapse.value = ['information']
    fetchProjectDetail()
    fetchInformationData()
  }
})

// 监听对话框显示
watch(() => visible.value, (val) => {
  if (val && props.project?.id) {
    projectData.value = null
    informationList.value = []
    activeCollapse.value = ['information']
    fetchProjectDetail()
    fetchInformationData()
  }
})

// 新增合作方
const handleViewPartner = () => {
  partnerDialogVisible.value = true
}

/**
 * 打开附件预览对话框
 */
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
  emit('edit', props.project)
}

// 关闭
const handleClose = () => {
  projectData.value = null
  informationList.value = []
  visible.value = false
}
</script>

<style scoped lang="scss">
.project-detail-dialog {
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

          .amount-label,
          .amount-value {
            color: #fff;
          }
        }
      }
    }

    .info-section {
      margin-top: 10px;

      .collapse-title {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;

        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
          padding-left: 10px;
          border-left: 4px solid #409EFF;
          margin-bottom: 0;
        }

        .count-tag {
          font-size: 12px;
        }
      }

      .info-card {
        margin-bottom: 5px;

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .info-title {
            font-weight: 600;
            font-size: 14px;
          }
        }

        .info-content {
          font-size: 13px;
          color: #606266;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .info-partner {
          margin-top: 8px;
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
</style>
