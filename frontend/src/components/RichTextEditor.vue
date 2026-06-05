<template>
  <div class="rich-text-editor">
    <QuillEditor ref="quillEditorRef" v-model:content="content" :options="editorOptions" contentType="html" theme="snow"
      @ready="onEditorReady" @textChange="onTextChange" @selectionChange="onSelectionChange" />
    <!-- 隐藏的文件输入框，用于图片上传 -->
    <input ref="imageInputRef" type="file" accept="image/*" style="display: none" @change="handleImageFileChange" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { uploadImage } from '@/api/attachments'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'ready'])

const quillEditorRef = ref(null)
const imageInputRef = ref(null)
const content = ref(props.modelValue)
let quillInstance = null

// 编辑器配置
const editorOptions = ref({
  theme: 'snow',
  placeholder: props.placeholder,
  readOnly: props.readOnly,
  modules: {
    toolbar: {
      container: [
        // 文本样式
        ['bold', 'italic', 'underline', 'strike'],
        // 标题
        [{ header: 1 }, { header: 2 }],
        // 字体大小
        [{ size: ['small', false, 'large', 'huge'] }],
        // 颜色
        [{ color: [] }, { background: [] }],
        // 对齐
        [{ align: [] }],
        // 列表
        [{ list: 'ordered' }, { list: 'bullet' }],
        // 缩进
        [{ indent: '-1' }, { indent: '+1' }],
        // 引用、代码块
        ['blockquote', 'code-block'],
        // 链接、图片
        ['link', 'image'],
        // 清除格式
        ['clean']
      ],
      handlers: {
        // 自定义图片上传处理
        image: function () {
          // 触发隐藏的文件选择框
          if (imageInputRef.value) {
            imageInputRef.value.click()
          }
        }
      }
    },
    // 粘贴处理配置
    clipboard: {
      matchVisual: false
    }
  }
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal
  }
})

// 监听内部值变化
watch(content, (newVal) => {
  emit('update:modelValue', newVal)
  emit('change', newVal)
})

/**
 * 编辑器就绪回调
 */
const onEditorReady = (quill) => {
  quillInstance = quill

  // 注册粘贴图片上传处理
  setupPasteImageHandler(quill)

  // 注册拖拽图片上传处理
  setupDropImageHandler(quill)

  emit('ready', quill)
}

/**
 * 设置粘贴图片处理
 * 用户从截图工具或网页复制粘贴图片时触发上传
 */
const setupPasteImageHandler = (quill) => {
  const editorContainer = quill.root

  editorContainer.addEventListener('paste', async (event) => {
    const clipboardData = event.clipboardData || window.clipboardData
    if (!clipboardData) return

    const items = clipboardData.items || clipboardData.files
    if (!items) return

    // 查找图片文件
    let imageFile = null
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type && item.type.startsWith('image/')) {
        imageFile = item.getAsFile()
        break
      }
    }

    if (!imageFile) return

    // 阻止默认粘贴行为（避免同时粘贴为base64）
    event.preventDefault()

    // 获取当前光标位置
    const range = quill.getSelection(true)
    if (!range) {
      ElMessage.warning('请先在编辑器中定位光标位置')
      return
    }

    // 显示占位 loading 文本
    const loadingPlaceholder = '[图片上传中...]'
    quill.insertText(range.index, loadingPlaceholder, { color: '#909399' })
    quill.setSelection(range.index + loadingPlaceholder.length)

    try {
      // 上传图片
      const imageUrl = await doUploadImage(imageFile)

      // 删除占位文本，插入图片
      const placeholderIndex = quill.getText().indexOf(loadingPlaceholder)
      if (placeholderIndex !== -1) {
        quill.deleteText(placeholderIndex, loadingPlaceholder.length)
        quill.insertEmbed(placeholderIndex, 'image', imageUrl)
        // 在图片后插入换行，方便继续输入
        quill.insertText(placeholderIndex + 1, '\n')
        quill.setSelection(placeholderIndex + 2)
      } else {
        // 如果占位符被删除了，在当前位置插入
        const currentRange = quill.getSelection(true)
        quill.insertEmbed(currentRange.index, 'image', imageUrl)
        quill.insertText(currentRange.index + 1, '\n')
        quill.setSelection(currentRange.index + 2)
      }
    } catch (error) {
      // 删除占位文本
      const placeholderIndex = quill.getText().indexOf(loadingPlaceholder)
      if (placeholderIndex !== -1) {
        quill.deleteText(placeholderIndex, loadingPlaceholder.length)
      }
      console.error('粘贴图片上传失败:', error)
      ElMessage.error('图片上传失败，请重试')
    }
  })
}

/**
 * 设置拖拽图片处理
 * 用户拖拽图片文件到编辑器时触发上传
 */
const setupDropImageHandler = (quill) => {
  const editorContainer = quill.root

  editorContainer.addEventListener('dragover', (event) => {
    event.preventDefault()
    editorContainer.style.border = '2px dashed #409EFF'
    editorContainer.style.backgroundColor = '#f0f9ff'
  })

  editorContainer.addEventListener('dragleave', (event) => {
    event.preventDefault()
    editorContainer.style.border = ''
    editorContainer.style.backgroundColor = ''
  })

  editorContainer.addEventListener('drop', async (event) => {
    event.preventDefault()
    editorContainer.style.border = ''
    editorContainer.style.backgroundColor = ''

    const files = event.dataTransfer?.files
    if (!files || files.length === 0) return

    // 过滤出图片文件
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    // 获取放置位置
    const range = quill.getSelection(true)
    let insertIndex = range ? range.index : quill.getLength()

    for (const imageFile of imageFiles) {
      try {
        const imageUrl = await doUploadImage(imageFile)
        quill.insertEmbed(insertIndex, 'image', imageUrl)
        quill.insertText(insertIndex + 1, '\n')
        insertIndex += 2
      } catch (error) {
        console.error('拖拽图片上传失败:', error)
        ElMessage.error(`图片 "${imageFile.name}" 上传失败`)
      }
    }

    quill.setSelection(insertIndex)
  })
}

/**
 * 处理文件选择变化（点击图片按钮后选择文件）
 */
const handleImageFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 重置 input，允许重复选择同一文件
  event.target.value = ''

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }

  // 验证文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }

  if (!quillInstance) {
    ElMessage.error('编辑器未就绪')
    return
  }

  // 获取当前光标位置
  const range = quillInstance.getSelection(true)
  let insertIndex = range ? range.index : quillInstance.getLength()

  try {
    const imageUrl = await doUploadImage(file)

    // 在当前光标位置插入图片
    quillInstance.insertEmbed(insertIndex, 'image', imageUrl)
    // 在图片后插入换行
    quillInstance.insertText(insertIndex + 1, '\n')
    // 移动光标到图片后方
    quillInstance.setSelection(insertIndex + 2)

    ElMessage.success('图片插入成功')
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败，请重试')
  }
}

/**
 * 执行图片上传
 * @param {File} file - 图片文件
 * @returns {Promise<string>} 图片URL
 */
const doUploadImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const res = await uploadImage(formData)
  if (res.code === 201 && res.data) {
    return res.data.file_url
  }
  throw new Error(res.message || '上传失败')
}

// 文本变化
const onTextChange = () => {
  // 可在此添加字数统计等逻辑
}

// 选区变化
const onSelectionChange = (range) => {
  // 选区变化处理
}

// 暴露方法给父组件
defineExpose({
  getEditor: () => quillEditorRef.value?.getQuill(),
  getText: () => quillEditorRef.value?.getText(),
  getHTML: () => quillEditorRef.value?.getHTML(),
  getLength: () => quillEditorRef.value?.getLength(),
  insertText: (index, text, formats) => {
    quillEditorRef.value?.getQuill().insertText(index, text, formats)
  },
  setContents: (delta) => {
    quillEditorRef.value?.getQuill().setContents(delta)
  }
})
</script>

<style scoped lang="scss">
.rich-text-editor {
  position: relative;

  :deep(.ql-toolbar) {
    border-color: #dcdfe6;
    border-radius: 4px 4px 0 0;
    background-color: #f5f7fa;
    position: sticky;
    top: var(--ql-toolbar-top, 0);
    z-index: 100;
    padding: 8px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
  }

  :deep(.ql-container) {
    border-color: #dcdfe6;
    border-radius: 0 0 4px 4px;
    min-height: 200px;
    font-size: 14px;

    .ql-editor {
      min-height: 200px;

      &.ql-blank::before {
        color: #c0c4cc;
        font-style: normal;
      }

      // 编辑器内图片样式
      img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
        cursor: pointer;
        transition: box-shadow 0.2s;

        &:hover {
          box-shadow: 0 0 0 2px #409EFF;
        }
      }
    }
  }

  // 拖拽时的样式
  :deep(.ql-editor.ql-dragover) {
    border: 2px dashed #409EFF;
    background-color: #f0f9ff;
  }
}
</style>
