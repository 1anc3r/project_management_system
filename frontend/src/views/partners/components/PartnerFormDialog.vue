<template>
  <el-dialog
    :title="dialogTitle"
    v-model="visible"
    width="850px"
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

      <!-- 联系人列表 -->
      <div class="contacts-section">
        <div class="section-title">
          联系人列表
          <el-tag v-if="contacts.length > 0" type="info" size="small" style="margin-left: 10px">
            {{ contacts.length }} 位
          </el-tag>
        </div>
        <div class="contacts-toolbar">
          <el-button type="primary" size="small" :icon="Plus" @click="handleAddContact">新增联系人</el-button>
        </div>
        
        <el-table :data="contacts" border size="small">
          <el-table-column type="index" label="序号" width="50" align="center" />
          <el-table-column label="姓名" width="120">
            <template #default="{ row, $index }">
              <el-input v-model="row.name" size="small" placeholder="姓名" />
            </template>
          </el-table-column>
          <el-table-column label="联系电话" width="140">
            <template #default="{ row, $index }">
              <el-input v-model="row.phone" size="small" placeholder="联系电话" />
            </template>
          </el-table-column>
          <el-table-column label="职务" min-width="120">
            <template #default="{ row, $index }">
              <el-input v-model="row.position" size="small" placeholder="职务" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="handleDeleteContact($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
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
import { Plus } from '@element-plus/icons-vue'
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
  bank_account: ''
})

// 联系人列表
const contacts = ref([])

// 合作方类型
const partnerTypes = ['甲方', '乙方', '丙方', '其他']

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入合作方名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择合作方类型', trigger: 'change' }]
}

// 表单默认值
const DEFAULT_FORM = {
  name: '',
  type: '其他',
  tax_id: '',
  address: '',
  bank: '',
  bank_account: ''
}

// 新增联系人
const handleAddContact = () => {
  contacts.value.push({
    name: '',
    phone: '',
    position: ''
  })
}

// 删除联系人
const handleDeleteContact = (index) => {
  contacts.value.splice(index, 1)
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (err) {
    ElMessage.warning('请检查表单必填项')
    return
  }

  // 验证联系人：如果有输入内容但未填姓名的行，给出提示
  const invalidContacts = contacts.value.filter(c => !c.name.trim() && (c.phone || c.position))
  if (invalidContacts.length > 0) {
    ElMessage.warning('请填写所有联系人的姓名，或删除多余行')
    return
  }

  submitLoading.value = true
  try {
    // 过滤掉空行（未填写姓名的）
    const validContacts = contacts.value.filter(c => c.name.trim())

    const submitData = {
      ...form.value,
      contacts: validContacts
    }

    if (props.type === 'add') {
      await createPartner(submitData)
      ElMessage.success('合作方创建成功')
    } else {
      await updatePartner(props.data.id, submitData)
      ElMessage.success('合作方更新成功')
    }

    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
    console.error('保存失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  form.value = { ...DEFAULT_FORM }
  contacts.value = []
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
        bank_account: data.bank_account || ''
      }
      // 加载联系人列表
      contacts.value = (data.contacts || []).map(c => ({
        id: c.id,
        name: c.name || '',
        phone: c.phone || '',
        position: c.position || ''
      }))
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

<style scoped lang="scss">
.contacts-section {
  margin-top: 5px;

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 15px;
    padding-left: 10px;
    border-left: 4px solid #409EFF;
  }

  .contacts-toolbar {
    margin-bottom: 10px;
  }
}
</style>
