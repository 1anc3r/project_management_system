<template>
  <el-dialog
    :title="dialogTitle"
    v-model="visible"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="110px"
    >
      <el-form-item label="合作方名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入合作方名称" />
      </el-form-item>
      
      <el-form-item label="合作方类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择合作方类型" style="width: 100%">
          <el-option v-for="item in partnerTypes" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="纳税人识别号" prop="tax_id">
        <el-input v-model="form.tax_id" placeholder="请输入纳税人识别号" />
      </el-form-item>
      
      <el-form-item label="地址" prop="address">
        <el-input v-model="form.address" placeholder="请输入地址" />
      </el-form-item>
      
      <el-form-item label="开户银行" prop="bank">
        <el-input v-model="form.bank" placeholder="请输入开户银行" />
      </el-form-item>
      
      <el-form-item label="银行账号" prop="bank_account">
        <el-input v-model="form.bank_account" placeholder="请输入银行账号" />
      </el-form-item>
      
      <el-form-item label="联系人" prop="contact">
        <el-input v-model="form.contact" placeholder="请输入联系人姓名" />
      </el-form-item>
      
      <el-form-item label="联系电话" prop="contact_phone">
        <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
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
import { createPartner, updatePartner, getPartnerById } from '@/api/partners'

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

const dialogTitle = computed(() => props.type === 'add' ? '新增合作方' : '编辑合作方')

// 表单引用
const formRef = ref(null)
const submitLoading = ref(false)

// 表单数据
const form = ref({
  name: '',
  type: '其他',
  tax_id: '',
  address: '',
  bank: '',
  bank_account: '',
  contact: '',
  contact_phone: ''
})

// 合作方类型
const partnerTypes = ['甲方', '乙方', '丙方', '其他']

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入合作方名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择合作方类型', trigger: 'change' }]
}

// 提交表单
const handleSubmit = async () => {
  await formRef.value.validate()
  
  submitLoading.value = true
  try {
    if (props.type === 'add') {
      await createPartner(form.value)
      ElMessage.success('合作方创建成功')
    } else {
      await updatePartner(props.data.id, form.value)
      ElMessage.success('合作方更新成功')
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
    name: '',
    type: '其他',
    tax_id: '',
    address: '',
    bank: '',
    bank_account: '',
    contact: '',
    contact_phone: ''
  }
  visible.value = false
}

// 加载编辑数据
const loadEditData = async () => {
  if (props.type === 'edit' && props.data) {
    try {
      const res = await getPartnerById(props.data.id)
      const data = res.data
      form.value = {
        name: data.name,
        type: data.type,
        tax_id: data.tax_id || '',
        address: data.address || '',
        bank: data.bank || '',
        bank_account: data.bank_account || '',
        contact: data.contact || '',
        contact_phone: data.contact_phone || ''
      }
    } catch (error) {
      console.error('加载合作方数据失败:', error)
    }
  }
}

// 监听对话框显示
watch(() => props.visible, (val) => {
  if (val && props.type === 'edit') {
    loadEditData()
  }
})
</script>
