<template>
  <el-dialog :title="dialogTitle" v-model="visible" width="900px" :close-on-click-modal="false" @close="handleClose"
    class="knowledge-form-dialog" destroy-on-close :fullscreen="isFullscreen">
    <template #header>
      <div class="header">
        <span class="title">{{ dialogTitle }}</span>
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

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="knowledge-form">
      <!-- 标题 -->
      <el-form-item label="标题" prop="question">
        <el-input v-model="form.question" placeholder="请输入标题" maxlength="500" show-word-limit clearable />
      </el-form-item>

      <!-- 分类 -->
      <el-form-item label="分类" prop="category">
        <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%" clearable>
          <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>

      <!-- 标签 -->
      <el-form-item label="标签">
        <TagInput v-model="form.tags" />
        <div class="form-tip">最多10个标签，单个标签最多20个字符</div>
      </el-form-item>

      <!-- 内容 -->
      <el-form-item label="内容" prop="answer">
        <RichTextEditor class="rich-text-editor" v-model="editorAnswer" placeholder="请输入内容..." />
      </el-form-item>

      <!-- 附件上传 -->
      <el-form-item label="附件">
        <el-upload ref="uploadRef" action="/api/attachments" :headers="uploadHeaders" :data="uploadData"
          :on-success="handleUploadSuccess" :on-error="handleUploadError" :on-remove="handleRemoveFile"
          :before-upload="beforeUpload" :file-list="fileList" multiple drag class="uploader">
          <el-icon class="el-icon--upload">
            <Upload />
          </el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持文档、图片等格式，单个文件不超过 50MB
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-divider></el-divider>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Document, Close } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { createKnowledge, updateKnowledge, getKnowledgeById } from '@/api/knowledge'
import { getFilterOptions } from '@/api/knowledge'
import { injectImageToken } from '@/utils/format'
import TagInput from '@/components/TagInput.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'

const props = defineProps({
  visible: Boolean,
  type: {
    type: String,
    default: 'add'
  },
  data: Object
})

const emit = defineEmits(['update:visible', 'success'])

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const dialogTitle = computed(() => props.type === 'add' ? '新增知识条目' : '编辑知识条目')

const userStore = useUserStore()

// 全屏切换
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 表单引用
const formRef = ref(null)
const submitLoading = ref(false)

// 分类选项
const categoryOptions = ref([])

// 表单数据
const form = ref({
  question: '',
  answer: '',
  category: '',
  tags: [],
  attachmentIds: []
})

// 编辑器显示内容（独立变量，用于图片认证token注入）
const editorAnswer = ref('')

// 已上传的附件列表
const uploadedAttachments = ref([])
const fileList = ref([])

// 上传配置
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

const uploadData = computed(() => ({
  knowledge_id: props.data?.id || ''
}))

// 表单验证规则
const rules = {
  question: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, message: '最少2个字符', trigger: 'blur' },
    { max: 500, message: '最多500个字符', trigger: 'blur' }
  ],
  answer: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        const textLength = value ? value.replace(/<[^>]*>/g, '').length : 0
        if (textLength < 10) {
          callback(new Error('内容最少10个字符'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

// 获取分类选项
const fetchCategoryOptions = async () => {
  try {
    const res = await getFilterOptions()
    categoryOptions.value = res.data?.categories || []
  } catch (error) {
    console.error('获取分类选项失败:', error)
  }
}

// 加载编辑数据
const loadEditData = async () => {
  if (props.type === 'edit' && props.data?.id) {
    try {
      const res = await getKnowledgeById(props.data.id)
      const data = res.data
      form.value = {
        question: data.question,
        answer: data.answer,
        category: data.category,
        tags: data.tags || [],
        attachmentIds: data.attachments?.map(a => a.id) || []
      }
      // 为编辑器内容中的图片注入认证token，确保编辑器内图片正常显示
      editorAnswer.value = injectImageToken(data.answer, userStore.token)
      uploadedAttachments.value = data.attachments || []
      fileList.value = data.attachments?.map(a => ({
        name: a.file_name,
        url: a.file_path,
        id: a.id
      })) || []
    } catch (error) {
      console.error('加载知识详情失败:', error)
      ElMessage.error('加载知识详情失败')
    }
  }
}

// 编辑器内容变化时同步到表单（包含token，提交前会清除）
watch(editorAnswer, (val) => {
  form.value.answer = val
})

/**
 * 移除HTML中图片URL的认证token参数
 * 提交前调用，确保数据库存储纯净的URL
 */
const stripImageToken = (html) => {
  if (!html) return html
  return html.replace(/(\/uploads\/[^"']+)([?&])token=[^&"']+/g, '$1')
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请检查表单必填项')
    return
  }

  submitLoading.value = true
  try {
    const submitData = {
      question: form.value.question.trim(),
      answer: stripImageToken(form.value.answer),
      category: form.value.category,
      tags: form.value.tags,
      attachmentIds: form.value.attachmentIds
    }

    if (props.type === 'add') {
      await createKnowledge(submitData)
      ElMessage.success('知识条目创建成功')
    } else {
      await updateKnowledge(props.data.id, submitData)
      ElMessage.success('知识条目更新成功')
    }

    emit('success')
    handleClose()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  form.value = {
    question: '',
    answer: '',
    category: '',
    tags: [],
    attachmentIds: []
  }
  editorAnswer.value = ''
  uploadedAttachments.value = []
  fileList.value = []
  visible.value = false
}

// 上传前检查
const beforeUpload = (file) => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 50MB')
    return false
  }
  return true
}

// 上传成功
const handleUploadSuccess = (response, uploadFile) => {
  if (response.code === 201 && response.data) {
    const attId = response.data.id
    form.value.attachmentIds.push(attId)
    uploadedAttachments.value.push({
      id: attId,
      file_name: response.data.file_name,
      file_size: response.data.file_size || 0,
      file_path: response.data.file_url
    })
    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传失败
const handleUploadError = () => {
  ElMessage.error('文件上传失败')
}

// 移除文件
const handleRemoveFile = (uploadFile) => {
  const attId = uploadFile.id || uploadFile.response?.data?.id
  if (attId) {
    removeAttachment(attId)
  }
}

// 移除附件
const removeAttachment = (attId) => {
  form.value.attachmentIds = form.value.attachmentIds.filter(id => id !== attId)
  uploadedAttachments.value = uploadedAttachments.value.filter(a => a.id !== attId)
  fileList.value = fileList.value.filter(f => f.id !== attId)
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i]
}

// 监听对话框显示
watch(() => props.visible, (val) => {
  if (val) {
    fetchCategoryOptions()
    if (props.type === 'edit') {
      loadEditData()
    }
  }
})
</script>

<style scoped lang="scss">
.knowledge-form-dialog {
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

  .knowledge-form {
    padding-right: 10px;

    .form-tip {
      font-size: 12px;
      color: #909399;
      margin-left: 8px;
    }

    .rich-text-editor {
      width: 100vw;
    }

    .uploader {
      width: 100vw;
    }

    .attachment-list {
      margin-top: 12px;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      padding: 8px 12px;

      .attachment-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid #f0f2f5;

        &:last-child {
          border-bottom: none;
        }

        .att-name {
          flex: 1;
          font-size: 13px;
          color: #606266;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .att-size {
          font-size: 12px;
          color: #909399;
          flex-shrink: 0;
        }
      }
    }
  }
}
</style>
