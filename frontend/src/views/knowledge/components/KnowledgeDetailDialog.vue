<template>
  <el-dialog :title="知识详情" v-model="visible" width="900px" :close-on-click-modal="false" class="knowledge-detail-dialog"
    destroy-on-close :fullscreen="isFullscreen">
    <template #header>
      <div class="header">
        <span class="title">知识详情</span>
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
      <div class="detail-header" v-if="knowledgeData">
        <div class="detail-title">
          <span class="title-text">{{ knowledgeData.question }}</span>
        </div>
        <div class="detail-meta">
          分类：<el-tag type="primary" size="small" class="meta-tag">{{ knowledgeData.category }}</el-tag>
          标签：<el-tag v-for="tag in formatTags(knowledgeData.tags)" :key="tag" size="small" class="meta-tag">
            {{ tag }}
          </el-tag>
          <span class="meta-item">
            <el-icon>
              <User />
            </el-icon> {{ knowledgeData.created_by_name }}
          </span>
          <span class="meta-item">
            <el-icon>
              <Calendar />
            </el-icon> {{ formatDateTime(knowledgeData.created_at) }}
          </span>
          <span class="meta-item">
            <el-icon>
              <View />
            </el-icon> {{ knowledgeData.view_count || 0 }} 次浏览
          </span>
        </div>
      </div>

      <!-- 内容 -->
      <div class="detail-body" v-if="knowledgeData">
        <el-divider content-position="left">内容</el-divider>
        <RichTextEditor v-model="processedAnswer" :readOnly="true" placeholder=" " />
      </div>

      <!-- 附件列表 -->
      <div class="detail-attachments" v-if="knowledgeData?.attachments?.length > 0">
        <el-divider content-position="left">
          附件 ({{ knowledgeData.attachments.length }})
        </el-divider>

        <!-- 附件列表 -->
        <div class="section">
          <el-table v-if="attachments?.length" :data="attachments" border size="small">
            <el-table-column prop="file_name" label="文件名" min-width="250" show-overflow-tooltip />
            <el-table-column prop="file_size" label="大小" width="100">
              <template #default="{ row }">{{ formatFileSize(row.file_size) }}</template>
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
      </div>

      <!-- 附件预览对话框 -->
      <AttachmentPreviewDialog v-model="previewVisible" :attachment="previewAttachment" />

      <!-- 底部操作 -->
      <div class="detail-footer" v-if="knowledgeData">
        <el-button @click="handleClose">
          <el-icon>
            <ArrowLeft />
          </el-icon> 返回列表
        </el-button>
        <el-button type="primary" @click="handleEdit">
          <el-icon>
            <Edit />
          </el-icon> 编辑
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User, Calendar, View, Document, Download,
  ArrowLeft, Edit, Delete, Picture, ZoomIn
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getKnowledgeById, deleteKnowledge, recordView } from '@/api/knowledge'
import { formatDateTime, injectImageToken } from '@/utils/format'
import { isPreviewable } from '@/api/attachments'
import RichTextEditor from '@/components/RichTextEditor.vue'
import AttachmentPreviewDialog from '@/components/AttachmentPreviewDialog.vue'

const props = defineProps({
  visible: Boolean,
  data: Object
})

const emit = defineEmits(['update:visible', 'edit', 'delete'])

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const userStore = useUserStore()

// 加载状态
const loading = ref(false)

// 详情数据
const knowledgeData = ref(null)

// 附件预览状态
const previewVisible = ref(false)
const previewAttachment = ref(null)

// 全屏切换
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 处理后的内容（为图片 URL 添加认证 token）
const processedAnswer = computed(() => {
  if (!knowledgeData.value?.answer) return ''
  return injectImageToken(knowledgeData.value.answer, userStore.token)
})

// 权限检查
const canEdit = computed(() => {
  if (!knowledgeData.value) return false
  const userInfo = userStore.userInfo
  if (userInfo.role === 'admin') return true
  return knowledgeData.value.created_by === userInfo.id
})

// 非图片附件列表
const attachments = computed(() => {
  if (!knowledgeData.value?.attachments) return []
  return knowledgeData.value.attachments.filter(att => att)
})

/**
 * 打开附件预览对话框
 */
const openPreview = (att) => {
  previewAttachment.value = att
  previewVisible.value = true
}

// 获取详情
const fetchDetail = async () => {
  if (!props.data?.id) return
  loading.value = true
  try {
    // 先记录浏览
    await recordView(props.data.id)
    // 再获取详情
    const res = await getKnowledgeById(props.data.id)
    knowledgeData.value = res.data
  } catch (error) {
    console.error('获取知识详情失败:', error)
    ElMessage.error('获取知识详情失败')
  } finally {
    loading.value = false
  }
}

// 格式化标签
const formatTags = (tags) => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  return tags.split(',').map(t => t.trim()).filter(Boolean)
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i]
}

// 下载附件
const downloadAttachment = (attId) => {
  const token = userStore.token
  window.open(`/api/attachments/${attId}/download?token=${token}`, '_blank')
}

// 编辑
const handleEdit = () => {
  if (canEdit()) {
    if (knowledgeData.value) {
      emit('edit', knowledgeData.value)
    }
  } else {
    ElMessage.warning('您没有权限编辑该知识条目')
  }
}

// 删除
const handleDelete = () => {
  if (!knowledgeData.value) return
  if (canEdit()) {
    ElMessageBox.confirm(
      `确定要删除知识条目 "${knowledgeData.value.question}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      await deleteKnowledge(knowledgeData.value.id)
      ElMessage.success('删除成功')
      visible.value = false
      emit('delete')
    }).catch(() => { })
  } else {
    ElMessage.warning('您没有权限删除该知识条目')
  }
}

// 关闭
const handleClose = () => {
  knowledgeData.value = null
  visible.value = false
}

// 监听对话框显示
watch(() => props.visible, (val) => {
  if (val && props.data?.id) {
    fetchDetail()
  }
})
</script>

<style scoped lang="scss">
.knowledge-detail-dialog {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 16px;

    .title {
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
      margin-bottom: 16px;

      .detail-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;

        .title-text {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
        }
      }

      .detail-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .meta-tag {
          margin-right: 4px;
        }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #606266;
          margin-left: 8px;
        }
      }
    }

    .detail-body {
      :deep(.ql-toolbar) {
        display: none !important;
      }

      :deep(.ql-container) {
        border: none;
      }

      :deep(.ql-editor) {
        padding: 0;
        min-height: auto;
      }
    }

    .detail-attachments {
      margin-top: 16px;

      .attachment-stat {
        font-size: 12px;
        color: #909399;
        margin-left: 8px;
        font-weight: normal;
      }

      .attachment-list {
        border: 1px solid #ebeef5;
        border-radius: 4px;
        padding: 8px 16px;

        .attachment-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f0f2f5;

          &:last-child {
            border-bottom: none;
          }

          .att-icon {
            font-size: 20px;
            color: #409EFF;
            flex-shrink: 0;
          }

          .att-name {
            flex: 1;
            font-size: 14px;
            color: #606266;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .att-size {
            font-size: 12px;
            color: #909399;
            flex-shrink: 0;
            min-width: 60px;
            text-align: right;
          }

          .att-actions {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
          }
        }
      }
    }

    .detail-footer {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;
    }
  }
}
</style>
