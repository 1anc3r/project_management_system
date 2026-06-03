<template>
  <el-dialog :title="dialogTitle" v-model="visible" width="900px" :close-on-click-modal="false"
    class="knowledge-detail-dialog" destroy-on-close>
    <div v-loading="loading" class="detail-content">
      <!-- 头部信息 -->
      <div class="detail-header" v-if="detailData">
        <div class="detail-meta">
          分类：<el-tag type="primary" size="small" class="meta-tag">{{ detailData.category }}</el-tag>
          标签：<el-tag v-for="tag in formatTags(detailData.tags)" :key="tag" size="small" class="meta-tag">
            {{ tag }}
          </el-tag>
          <span class="meta-item">
            <el-icon>
              <User />
            </el-icon> {{ detailData.created_by_name }}
          </span>
          <span class="meta-item">
            <el-icon>
              <Calendar />
            </el-icon> {{ formatDateTime(detailData.created_at) }}
          </span>
          <span class="meta-item">
            <el-icon>
              <View />
            </el-icon> {{ detailData.view_count || 0 }} 次浏览
          </span>
        </div>
      </div>

      <!-- 内容 -->
      <div class="detail-body" v-if="detailData">
        <el-divider content-position="left">内容</el-divider>
        <RichTextEditor v-model="processedAnswer" :readOnly="true" placeholder=" " />
      </div>

      <!-- 附件列表 -->
      <div class="detail-attachments" v-if="detailData?.attachments?.length > 0">
        <el-divider content-position="left">
          附件 ({{ detailData.attachments.length }})
        </el-divider>

        <!-- 普通附件列表 -->
        <div class="attachment-list" v-if="attachments.length > 0">
          <div v-for="att in attachments" :key="att.id" class="attachment-item">
            <el-icon class="att-icon">
              <Document />
            </el-icon>
            <span class="att-name" :title="att.file_name">{{ att.file_name }}</span>
            <span class="att-size">{{ att.fileSizeText || formatFileSize(att.file_size) }}</span>
            <div class="att-actions">
              <el-button v-if="isPreviewable(att.file_name)" link type="primary" size="small"
                @click="openPreview(att)">
                <el-icon>
                  <View />
                </el-icon> 预览
              </el-button>
              <el-button link type="primary" size="small" @click="downloadAttachment(att.id)">
                <el-icon>
                  <Download />
                </el-icon> 下载
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 附件预览对话框 -->
      <AttachmentPreviewDialog v-model="previewVisible" :attachment="previewAttachment" />

      <!-- 底部操作 -->
      <div class="detail-footer" v-if="detailData">
        <el-button @click="handleClose">
          <el-icon>
            <ArrowLeft />
          </el-icon> 返回列表
        </el-button>
        <div class="footer-actions">
          <el-button type="primary" @click="handleEdit" v-if="canEdit">
            <el-icon>
              <Edit />
            </el-icon> 编辑
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
const detailData = ref(null)

// 附件预览状态
const previewVisible = ref(false)
const previewAttachment = ref(null)

// 对话框标题
const dialogTitle = computed(() => {
  if (detailData.value) {
    return detailData.value.question?.length > 30
      ? detailData.value.question.substring(0, 30) + '...'
      : detailData.value.question
  }
  return '知识详情'
})

// 处理后的内容（为图片 URL 添加认证 token）
const processedAnswer = computed(() => {
  if (!detailData.value?.answer) return ''
  return injectImageToken(detailData.value.answer, userStore.token)
})

// 权限检查
const canEdit = computed(() => {
  if (!detailData.value) return false
  const userInfo = userStore.userInfo
  if (userInfo.role === 'admin') return true
  return detailData.value.created_by === userInfo.id
})

// 非图片附件列表
const attachments = computed(() => {
  if (!detailData.value?.attachments) return []
  return detailData.value.attachments.filter(att => att)
})

/**
 * 打开附件预览对话框
 */
const openPreview = (att) => {
  previewAttachment.value = att
  previewVisible.value = true
  console.error('openPreview:'+att.type)
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
  }).catch(() => { })
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

      // 图片画廊
      .image-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
        padding: 12px;
        background-color: #f5f7fa;
        border-radius: 8px;

        .image-preview-item {
          position: relative;
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          background-color: #fff;
          border: 1px solid #e4e7ed;
          transition: all 0.3s;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

            .image-overlay {
              opacity: 1;
            }
          }

          .gallery-thumbnail {
            width: 100%;
            height: 120px;
            display: block;

            :deep(img) {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }

          .image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 28px;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;

            .el-icon {
              font-size: 28px;
              color: #fff;
            }
          }

          .image-name {
            display: block;
            padding: 4px 8px;
            font-size: 12px;
            color: #606266;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
            height: 28px;
            line-height: 20px;
          }

          .image-error {
            width: 100%;
            height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #909399;
            background-color: #f5f7fa;

            .el-icon {
              font-size: 32px;
              margin-bottom: 8px;
            }

            span {
              font-size: 12px;
            }
          }
        }
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
