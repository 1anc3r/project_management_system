<<template>
  <div class="rich-text-editor">
    <QuillEditor
      ref="quillEditorRef"
      v-model:content="content"
      :options="editorOptions"
      contentType="html"
      theme="snow"
      @ready="onEditorReady"
      @textChange="onTextChange"
      @selectionChange="onSelectionChange"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

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
const content = ref(props.modelValue)

// 编辑器配置
const editorOptions = ref({
  theme: 'snow',
  placeholder: props.placeholder,
  readOnly: props.readOnly,
  modules: {
    toolbar: [
      // 文本样式
      ['bold', 'italic', 'underline', 'strike'],
      // 标题
      [{ header: 1 }, { header: 2 }, { header: 3 }, { header: 4 }],
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
      // 链接、图片、视频
      ['link', 'image', 'video'],
      // 清除格式
      ['clean']
    ]
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

// 编辑器就绪
const onEditorReady = (quill) => {
  console.log('Quill 编辑器已就绪', quill)
  emit('ready', quill)
}

// 文本变化
const onTextChange = () => {
  // 可在此添加字数统计等逻辑
}

// 选区变化
const onSelectionChange = (range) => {
  console.log('选区变化:', range)
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
  :deep(.ql-toolbar) {
    border-color: #dcdfe6;
    border-radius: 4px 4px 0 0;
    background-color: #f5f7fa;
  }

  :deep(.ql-toolbar) {
    position: sticky;
    top: 0;                    // 滚动到视口顶部时固定
    z-index: 100;              // 确保在其他内容之上
    padding: 8px;
    background-color: #f5f7fa;
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
    }
  }
}
</style>
