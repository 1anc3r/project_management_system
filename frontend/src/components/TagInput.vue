<template>
  <div class="tag-input">
    <el-tag
      v-for="tag in modelValue"
      :key="tag"
      closable
      :disable-transitions="false"
      @close="removeTag(tag)"
      class="tag-item"
      size="default"
      type="primary"
    >
      {{ tag }}
    </el-tag>
    <el-input
      v-if="inputVisible"
      ref="InputRef"
      v-model="inputValue"
      class="tag-input-field"
      size="small"
      @keyup.enter="addTag"
      @blur="addTag"
      :maxlength="20"
      placeholder="输入标签"
    />
    <el-button v-else class="button-new-tag" size="small" @click="showInput">
      + 新标签
    </el-button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const inputVisible = ref(false)
const inputValue = ref('')
const InputRef = ref(null)

// 显示输入框
const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    InputRef.value?.input?.focus()
  })
}

// 添加标签
const addTag = () => {
  const value = inputValue.value.trim()
  if (value) {
    // 检查是否已存在
    if (!props.modelValue.includes(value)) {
      // 检查数量限制
      if (props.modelValue.length < 10) {
        // 检查长度限制
        if (value.length <= 20) {
          emit('update:modelValue', [...props.modelValue, value])
        }
      }
    }
  }
  inputVisible.value = false
  inputValue.value = ''
}

// 删除标签
const removeTag = (tag) => {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag))
}
</script>

<style scoped lang="scss">
.tag-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  .tag-item {
    margin: 0;
  }

  .tag-input-field {
    width: 100px;
  }

  .button-new-tag {
    padding: 0 8px;
    height: 24px;
    line-height: 22px;
  }
}
</style>
