<template>
  <el-dialog :title="dialogTitle" v-model="visible" width="850px" :close-on-click-modal="true"
    class="attachment-preview-dialog" destroy-on-close :fullscreen="true" :show-close="true"
    :before-close="handleClose">
    <template #header>
      <div class="preview-header">
        <span class="preview-title">{{ dialogTitle }}</span>
        <el-tag size="small" type="info" class="file-type-tag">{{ previewType ? previewType.toUpperCase() : '未知'
          }}</el-tag>
        <span class="file-size">{{ formatFileSize(fileSize) }}</span>
      </div>
    </template>

    <div v-loading="loading" class="preview-content">
      <!-- 图片预览 -->
      <div v-if="previewType === 'image'" class="preview-image">
        <el-image :src="previewUrl" fit="contain" class="preview-image-display">
          <template #error>
            <div class="preview-error">
              <el-icon>
                <Picture />
              </el-icon>
              <span>图片加载失败</span>
            </div>
          </template>
        </el-image>
      </div>

      <!-- PDF 预览 -->
      <div v-else-if="previewType === 'pdf'" class="preview-pdf">
        <iframe :src="previewUrl" frameborder="0" class="pdf-iframe" title="PDF预览"></iframe>
      </div>

      <!-- 文本文件预览 -->
      <div v-else-if="previewType === 'text'" class="preview-text">
        <div v-if="textContent" class="text-content-wrapper">
          <div class="text-meta">
            <el-tag size="small" type="info">{{ fileExtension.toUpperCase() }}</el-tag>
            <span class="text-size">{{ formatFileSize(fileSize) }}</span>
            <span class="text-line-count">{{ textLineCount }} 行</span>
          </div>
          <pre class="text-content"><code>{{ textContent }}</code></pre>
        </div>
        <div v-else-if="!loading" class="preview-error">
          <el-icon>
            <Document />
          </el-icon>
          <span>无法加载文本内容</span>
        </div>
      </div>

      <!-- Office 文档预览 -->
      <div v-else-if="previewType === 'office'" class="preview-office">
        <div v-if="officePreviewUrl" class="office-iframe-wrapper">
          <iframe :src="officePreviewUrl" frameborder="0" class="office-iframe" title="Office文档预览"></iframe>
        </div>
        <div v-else class="office-fallback">
          <el-icon class="office-icon">
            <Document />
          </el-icon>
          <h3>Office 文档</h3>
          <p class="office-desc">{{ fileName }}</p>
          <p class="office-tip">在线预览需要文件可通过公网访问</p>
          <el-button type="primary" @click="downloadFile">
            <el-icon>
              <Download />
            </el-icon> 下载后查看
          </el-button>
        </div>
      </div>

      <!-- 不支持预览 -->
      <div v-else class="preview-unsupported">
        <el-icon class="unsupported-icon">
          <Document />
        </el-icon>
        <h3>暂不支持在线预览</h3>
        <p class="unsupported-desc">{{ fileName }}</p>
        <p class="unsupported-tip">该文件类型无法在线预览，请下载后查看</p>
        <el-button type="primary" @click="downloadFile">
          <el-icon>
            <Download />
          </el-icon> 下载文件
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Picture, Document, Download, FullScreen, Close
} from '@element-plus/icons-vue'
import { getPreviewType, getFileViewBlob, getFileContent, downloadAttachment } from '@/api/attachments'
import { formatFileSize, downloadBlob } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  attachment: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 状态
const loading = ref(false)
const isFullscreen = ref(false)
const textContent = ref('')
const fileSize = ref(0)
const officePreviewUrl = ref('')
// 图片/PDF 预览的 Blob 对象 URL（通过 Authorization 头鉴权获取，不在 URL 中暴露登录凭证）
const previewObjectUrl = ref('')

// 计算属性
const fileName = computed(() => props.attachment?.file_name || '')
const dialogTitle = computed(() => {
  const name = fileName.value
  return name.length > 40 ? name.substring(0, 40) + '...' : name
})

const previewType = computed(() => {
  return getPreviewType(fileName.value)
})

const fileExtension = computed(() => {
  const name = fileName.value
  const dotIndex = name.lastIndexOf('.')
  return dotIndex > -1 ? name.slice(dotIndex) : ''
})

// 模板中图片与 PDF 统一使用 Blob 对象 URL
const previewUrl = computed(() => previewObjectUrl.value)

const textLineCount = computed(() => {
  if (!textContent.value) return 0
  return textContent.value.split('\n').length
})

// 获取文本文件内容
const fetchTextContent = async () => {
  if (!props.attachment?.id) return
  loading.value = true
  try {
    const res = await getFileContent(props.attachment.id)
    if (res.code === 200) {
      textContent.value = res.data.content
      fileSize.value = res.data.file_size
    }
  } catch (error) {
    console.error('获取文本内容失败:', error)
    ElMessage.error('获取文本内容失败')
  } finally {
    loading.value = false
  }
}

// 获取图片/PDF 文件 Blob 并生成对象 URL
const fetchPreviewBlob = async () => {
  if (!props.attachment?.id) return
  loading.value = true
  try {
    const response = await getFileViewBlob(props.attachment.id)
    previewObjectUrl.value = URL.createObjectURL(response.data)
  } catch (error) {
    console.error('获取文件预览失败:', error)
  } finally {
    loading.value = false
  }
}

// 释放对象 URL，避免内存泄漏
const revokePreviewUrl = () => {
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value)
    previewObjectUrl.value = ''
  }
}

// 设置 Office 预览 URL
const setupOfficePreview = () => {
  // Microsoft Office Online Viewer 需要文件可以通过公网 URL 访问
  // 对于私有部署，通常无法直接使用，这里提供备用方案提示
  // 如系统部署在公网，可改为先申请 access_token 再拼接临时下载链接
  officePreviewUrl.value = '' // 默认使用备用提示
}

// 下载文件（通过 Authorization 头鉴权获取 Blob 后保存）
const downloadFile = async () => {
  if (!props.attachment?.id) return
  try {
    const response = await downloadAttachment(props.attachment.id)
    downloadBlob(response.data, fileName.value || 'download')
  } catch (error) {
    console.error('下载文件失败:', error)
  }
}

// 关闭
const handleClose = () => {
  visible.value = false
  textContent.value = ''
  officePreviewUrl.value = ''
  isFullscreen.value = false
  revokePreviewUrl()
}

// 加载预览内容
const loadPreview = () => {
  if (!props.attachment) return

  fileSize.value = props.attachment.file_size || 0

  if (previewType.value === 'text') {
    fetchTextContent()
  } else if (previewType.value === 'image' || previewType.value === 'pdf') {
    fetchPreviewBlob()
  } else if (previewType.value === 'office') {
    setupOfficePreview()
  }
}

// 监听对话框显示
watch(() => props.modelValue, (val) => {
  if (val) {
    loadPreview()
  }
})
</script>

<style scoped lang="scss">
.attachment-preview-dialog {
  .preview-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;

    .preview-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }
  }

  .preview-content {
    width: 100%;
    min-height: 400px;
    overflow: hidden;

    // 图片预览
    .preview-image {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
      background-color: #f5f7fa;
      border-radius: 4px;

      .preview-image-display {
        max-width: 100%;
        max-height: 100%;

        :deep(img) {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
      }
    }

    // PDF 预览
    .preview-pdf {
      width: 100%;
      height: 84vh;
      background-color: #525659;
      border-radius: 4px;
      overflow: hidden;

      .pdf-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    }

    // 文本预览
    .preview-text {
      .text-content-wrapper {
        .text-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background-color: #f5f7fa;
          border-radius: 4px 4px 0 0;
          border-bottom: 1px solid #e4e7ed;

          .text-size,
          .text-line-count {
            font-size: 12px;
            color: #909399;
          }
        }

        .text-content {
          margin: 0;
          padding: 16px;
          background-color: #fafafa;
          border-radius: 0 0 4px 4px;
          border: 1px solid #e4e7ed;
          border-top: none;
          max-height: 79vh;
          overflow: auto;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: #333;
          white-space: pre-wrap;
          word-wrap: break-word;

          code {
            font-family: inherit;
            background: none;
            padding: 0;
          }
        }
      }
    }

    // Office 预览
    .preview-office {
      .office-iframe-wrapper {
        width: 100%;
        max-height: 80vh;
        min-height: 400px;
        background-color: #f5f7fa;
        border-radius: 4px;
        overflow: hidden;

        .office-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
      }

      .office-fallback {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 40px;
        text-align: center;

        .office-icon {
          font-size: 64px;
          color: #409EFF;
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px;
          color: #303133;
          font-size: 18px;
        }

        .office-desc {
          color: #606266;
          font-size: 14px;
          margin: 0 0 8px;
        }

        .office-tip {
          color: #909399;
          font-size: 12px;
          margin: 0 0 24px;
        }
      }
    }

    // 不支持预览
    .preview-unsupported {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-height: 80vh;
      min-height: 400px;
      text-align: center;

      .unsupported-icon {
        font-size: 64px;
        color: #909399;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px;
        color: #303133;
        font-size: 18px;
      }

      .unsupported-desc {
        color: #606266;
        font-size: 14px;
        margin: 0 0 8px;
      }

      .unsupported-tip {
        color: #909399;
        font-size: 12px;
        margin: 0 0 24px;
      }
    }

    // 错误状态
    .preview-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-height: 80vh;
      min-height: 400px;
      color: #909399;

      .el-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      span {
        font-size: 14px;
      }
    }
  }
}
</style>