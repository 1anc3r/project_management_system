<template>
  <el-dialog
    :title="dialogTitle"
    v-model="visible"
    width="750px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="information-form-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="资讯日期" prop="information_date">
            <el-date-picker
              v-model="form.information_date"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="资讯类型" prop="information_type">
            <el-select v-model="form.information_type" placeholder="请选择资讯类型" style="width: 100%">
              <el-option v-for="item in informationTypes" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="资讯标题" prop="information_title">
        <el-input v-model="form.information_title" placeholder="请输入资讯标题" />
      </el-form-item>

      <el-form-item label="关联合作方">
        <el-select
          v-model="form.partner_id"
          filterable
          clearable
          placeholder="请选择关联合作方（可选）"
          style="width: 100%"
        >
          <el-option v-for="item in partnerOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="关联项目">
        <el-select
          v-model="form.project_id"
          filterable
          clearable
          placeholder="请选择关联项目（可选）"
          style="width: 100%"
        >
          <el-option v-for="item in projectOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="资讯内容">
        <el-input
          v-model="form.information_content"
          type="textarea"
          :rows="6"
          placeholder="请输入资讯内容"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createInformation, updateInformation, getInformationById } from '@/api/information'
import { getInformationTypes } from '@/api/information'
import { getAllPartners } from '@/api/partners'
import { getProjects } from '@/api/projects'

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

const dialogTitle = computed(() => props.type === 'add' ? '新增资讯' : '编辑资讯')

// 表单引用
const formRef = ref(null)
const submitLoading = ref(false)

// 表单数据
const form = ref({
  information_date: '',
  information_type: '',
  information_title: '',
  information_content: '',
  partner_id: null,
  project_id: null
})

// 选项数据
const informationTypes = ref([])
const partnerOptions = ref([])
const projectOptions = ref([])

// 表单验证规则
const rules = {
  information_date: [{ required: true, message: '请选择资讯日期', trigger: 'change' }],
  information_type: [{ required: true, message: '请选择资讯类型', trigger: 'change' }],
  information_title: [{ required: true, message: '请输入资讯标题', trigger: 'blur' }]
}

// 获取选项数据
const fetchOptions = async () => {
  try {
    const [typeRes, partnerRes, projectRes] = await Promise.all([
      getInformationTypes(),
      getAllPartners(),
      getProjects({ page: 1, pageSize: 1000 })
    ])
    informationTypes.value = typeRes.data || []
    partnerOptions.value = partnerRes.data || []
    projectOptions.value = projectRes.data.list || []
  } catch (error) {
    console.error('获取选项数据失败:', error)
  }
}

// 提交表单
const handleSubmit = async () => {
  await formRef.value.validate()

  submitLoading.value = true
  try {
    const submitData = { ...form.value }
    if (props.type === 'add') {
      await createInformation(submitData)
      ElMessage.success('资讯创建成功')
    } else {
      await updateInformation(props.data.id, submitData)
      ElMessage.success('资讯更新成功')
    }

    emit('success')
    handleClose()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields()
  form.value = {
    information_date: '',
    information_type: '',
    information_title: '',
    information_content: '',
    partner_id: null,
    project_id: null
  }
  visible.value = false
}

// 加载编辑数据
const loadEditData = async () => {
  if (props.type === 'edit' && props.data) {
    try {
      const res = await getInformationById(props.data.id)
      const data = res.data
      form.value = {
        information_date: data.information_date,
        information_type: data.information_type,
        information_title: data.information_title,
        information_content: data.information_content || '',
        partner_id: data.partner_id || null,
        project_id: data.project_id || null
      }
    } catch (error) {
      console.error('加载资讯数据失败:', error)
    }
  }
}

// 监听对话框显示
watch(() => props.visible, (val) => {
  if (val) {
    fetchOptions()
    if (props.type === 'edit') {
      loadEditData()
    }
  }
})
</script>

<style scoped lang="scss">
.information-form-dialog {
  .el-form {
    padding: 10px 0;
  }
}
</style>
