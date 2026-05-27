<template>
  <el-dialog
    :title="dialogTitle"
    v-model="visible"
    width="900px"
    :close-on-click-modal="false"
    class="knowledge-detail-dialog"
    destroy-on-close
  >
    <div v-loading="loading" class="detail-content">
      <!-- 头部信息 -->
      <div class="detail-header" v-if="detailData">
        <div class="detail-meta">
          分类：<el-tag type="primary" size="small" class="meta-tag">{{ detailData.category }}</el-tag>
          标签：<el-tag
            v-for="tag in formatTags(detailData.tags)"
            :key="tag"
            size="small"
            class="meta-tag"
          >
            {{ tag }}
          </el-tag>
          <span class="meta-item">
            <el-icon><User /></el-icon> {{ detailData.created_by_name }}
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon> {{ formatDateTime(detailData.created_at) }}
          </span>
          <span class="meta-item">
            <el-icon><View /></el-icon> {{ detailData.view_count || 0 }} 次浏览
          </span>
        </div>
      </div>

      <!-- 内容 -->
      <div class="detail-body" v-if="detailData">
        <el-divider content-position="left">内容</el-divider>
        <RichTextEditor v-model="detailData.answer" :readOnly="true" placeholder=" " />
      </div>

      <!-- 附件列表 -->
      <div class="detail-attachments" v-if="detailData?.attachments?.length > 0">
        <el-divider content-position="left">附件 ({{ detailData.attachments.length }})</el-divider>
        <div class="attachment-list">
          <div
            v-for="att in detailData.attachments"
            :key="att.id"
            class="attachment-item"
          >
            <el-icon class="att-icon"><Document /></el-icon>
            <span class="att-name" :title="att.file_name">{{ att.file_name }}</span>
            <span class="att-size">{{ att.fileSizeText || formatFileSize(att.file_size) }}</span>
            <el-button
              link
              type="primary"
              size="small"
              @click="downloadAttachment(att.id)"
            >
              <el-icon><Download /></el-icon> 下载
            </el-button>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="detail-footer" v-if="detailData">
        <el-button @click="handleClose">
          <el-icon><ArrowLeft /></el-icon> 返回列表
        </el-button>
        <div class="footer-actions">
          <el-button type="primary" @click="handleEdit" v-if="canEdit">
            <el-icon><Edit /></el-icon> 编辑
          </el-button>
          <el-button type="danger" @click="handleDelete" v-if="canEdit">
            <el-icon><Delete /></el-icon> 删除
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User, Calendar, View, Document, Download,
  ArrowLeft, Edit, Delete
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getKnowledgeDetail, deleteKnowledge, recordView } from '@/api/knowledge'
import { formatDateTime } from '@/utils/format'
import RichTextEditor from '@/components/RichTextEditor.vue'

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
const detailData = ref(null)

// 对话框标题
const dialogTitle = computed(() => {
  if (detailData.value) {
    return detailData.value.question?.length > 30
      ? detailData.value.question.substring(0, 30) + '...'
      : detailData.value.question
  }
  return '知识详情'
})

// 权限检查
const canEdit = computed(() => {
  if (!detailData.value) return false
  const userInfo = userStore.userInfo
  if (userInfo.role === 'admin') return true
  return detailData.value.created_by === userInfo.id
})

// 获取详情
const fetchDetail = async () => {
  if (!props.data?.id) return
  loading.value = true
  try {
    // 先记录浏览
    await recordView(props.data.id)
    // 再获取详情
    const res = await getKnowledgeDetail(props.data.id)
    detailData.value = res.data
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
  if (detailData.value) {
    emit('edit', detailData.value)
  }
}

// 删除
const handleDelete = () => {
  if (!detailData.value) return
  ElMessageBox.confirm(
    `确定要删除知识条目 "${detailData.value.question}" 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteKnowledge(detailData.value.id)
    ElMessage.success('删除成功')
    visible.value = false
    emit('delete')
  }).catch(() => {})
}

// 关闭
const handleClose = () => {
  detailData.value = null
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
  .detail-content {
    .detail-header {
      margin-bottom: 16px;

      .detail-title {
        margin: 0 0 12px;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        line-height: 1.4;
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
      .answer-content {
        font-size: 14px;
        line-height: 1.8;
        color: #303133;

        :deep(h1) {
          font-size: 22px;
          font-weight: bold;
          margin: 20px 0 12px;
          color: #303133;
        }

        :deep(h2) {
          font-size: 18px;
          font-weight: bold;
          margin: 16px 0 10px;
          color: #303133;
        }

        :deep(h3) {
          font-size: 16px;
          font-weight: bold;
          margin: 14px 0 8px;
          color: #303133;
        }

        :deep(p) {
          margin: 10px 0;
        }

        :deep(ul), :deep(ol) {
          padding-left: 24px;
          margin: 10px 0;
        }

        :deep(li) {
          margin: 4px 0;
        }

        :deep(a) {
          color: #409EFF;
          text-decoration: underline;

          &:hover {
            color: #66b1ff;
          }
        }

        :deep(pre) {
          background-color: #f5f7fa;
          padding: 16px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 12px 0;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
        }

        :deep(code) {
          background-color: #f5f7fa;
          padding: 2px 8px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }

        :deep(blockquote) {
          border-left: 4px solid #dcdfe6;
          padding: 8px 16px;
          margin: 12px 0;
          background-color: #f5f7fa;
          color: #606266;
        }

        :deep(table) {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;

          th, td {
            border: 1px solid #dcdfe6;
            padding: 8px 12px;
            text-align: left;
          }

          th {
            background-color: #f5f7fa;
            font-weight: 600;
          }
        }

        :deep(img) {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
      }
    }

    .detail-attachments {
      margin-top: 16px;

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
        }
      }
    }

    .detail-footer {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;

      .footer-actions {
        display: flex;
        gap: 12px;
      }
    }
  }
}
</style>
