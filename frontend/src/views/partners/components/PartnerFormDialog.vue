<template>
  <el-dialog :title="dialogTitle" v-model="visible" width="900px" :close-on-click-modal="false" @close="handleClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-form-item label="合作方名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入合作方名称" />
      </el-form-item>

      <el-form-item label="合作方类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择合作方类型" style="width: 100%">
          <el-option v-for="item in partnerTypes" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="纳税人识别号" prop="tax_id">
            <el-input v-model="form.tax_id" placeholder="请输入纳税人识别号" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="地址" prop="address">
            <el-input v-model="form.address" placeholder="请输入地址" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开户银行" prop="bank">
            <el-input v-model="form.bank" placeholder="请输入开户银行" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="银行账号" prop="bank_account">
            <el-input v-model="form.bank_account" placeholder="请输入银行账号" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 联系人列表（支持拖拽排序） -->
      <div class="contacts-section">
        <div class="section-title">
          联系人列表
          <el-tag v-if="contacts.length > 0" type="info" size="small" style="margin-left: 10px">
            {{ contacts.length }} 位
          </el-tag>
          <el-tag v-if="contacts.length > 1" type="warning" size="small" style="margin-left: 8px">
            <el-icon>
              <Rank />
            </el-icon> 可拖拽排序
          </el-tag>
        </div>
        <div class="contacts-toolbar">
          <el-button type="primary" size="small" :icon="Plus" @click="handleAddContact">新增联系人</el-button>
        </div>

        <!-- 联系人表格（支持拖拽排序） -->
        <el-table ref="contactsTableRef" :data="contacts" border size="small" row-key="tempId"
          class="contacts-sortable-table">
          <el-table-column width="50" align="center">
            <template #default>
              <el-icon class="drag-handle" title="按住拖拽排序">
                <Rank />
              </el-icon>
            </template>
          </el-table-column>
          <el-table-column type="index" label="序号" width="50" align="center" />
          <el-table-column label="姓名" width="120">
            <template #default="{ row }">
              <el-input v-model="row.name" size="small" placeholder="姓名" />
            </template>
          </el-table-column>
          <el-table-column label="联系电话" width="140">
            <template #default="{ row }">
              <el-input v-model="row.phone" size="small" placeholder="联系电话" />
            </template>
          </el-table-column>
          <el-table-column label="职务" min-width="120">
            <template #default="{ row }">
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
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Rank } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
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
const contactsTableRef = ref(null)

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

// 临时ID计数器（用于拖拽的 row-key）
let tempIdCounter = 0

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

/**
 * 生成唯一临时ID（用于拖拽排序的 row-key）
 */
const generateTempId = () => {
  return `contact_${Date.now()}_${tempIdCounter++}`
}

/**
 * 新增联系人
 */
const handleAddContact = () => {
  contacts.value.push({
    tempId: generateTempId(),
    name: '',
    phone: '',
    position: '',
    sort_order: contacts.value.length
  })
  // 新增后重新初始化拖拽
  nextTick(() => {
    initSortable()
  })
}

/**
 * 删除联系人
 */
const handleDeleteContact = (index) => {
  contacts.value.splice(index, 1)
  // 删除后重新计算排序序号
  recalcSortOrder()
}

/**
 * 重新计算排序序号
 */
const recalcSortOrder = () => {
  contacts.value.forEach((contact, index) => {
    contact.sort_order = index
  })
}

/**
 * 初始化拖拽排序
 * 使用 SortableJS 实现表格行拖拽
 */
let sortableInstance = null

const initSortable = () => {
  // 销毁旧的 Sortable 实例
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }

  const tableEl = contactsTableRef.value?.$el
  if (!tableEl) return

  const tbodyEl = tableEl.querySelector('.el-table__body tbody')
  if (!tbodyEl) return

  // 至少需要2行才启用拖拽
  if (contacts.value.length < 2) return

  sortableInstance = Sortable.create(tbodyEl, {
    animation: 200,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onStart: () => {
      // 拖拽开始时添加视觉反馈
      tableEl.classList.add('is-dragging')
    },
    onEnd: (evt) => {
      tableEl.classList.remove('is-dragging')
      const { oldIndex, newIndex } = evt

      if (oldIndex === newIndex) return

      // 重新排列数据数组
      const movedItem = contacts.value.splice(oldIndex, 1)[0]
      contacts.value.splice(newIndex, 0, movedItem)

      // 重新计算排序序号
      recalcSortOrder()

      ElMessage.success('排序已更新，请点击保存按钮提交')
    }
  })
}

/**
 * 提交表单
 */
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
    // 过滤掉空行（未填写姓名的），并保留排序序号
    const validContacts = contacts.value
      .filter(c => c.name.trim())
      .map((c, index) => ({
        id: c.id || undefined,  // 保留原有ID（编辑模式下）
        name: c.name.trim(),
        phone: c.phone || null,
        position: c.position || null,
        sort_order: index
      }))

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

/**
 * 关闭对话框
 */
const handleClose = () => {
  form.value = { ...DEFAULT_FORM }
  contacts.value = []
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
  visible.value = false
}

/**
 * 加载编辑数据
 */
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
      // 加载联系人列表（保留排序序号）
      contacts.value = (data.contacts || []).map(c => ({
        tempId: generateTempId(),
        id: c.id,
        name: c.name || '',
        phone: c.phone || '',
        position: c.position || '',
        sort_order: c.sort_order !== undefined ? c.sort_order : 0
      }))

      // 数据加载完成后初始化拖拽
      nextTick(() => {
        initSortable()
      })
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
  if (val && props.type === 'add') {
    // 新增模式时清空联系人并初始化拖拽
    contacts.value = []
    nextTick(() => {
      initSortable()
    })
  }
})

onMounted(() => {
  // 组件挂载时不需要初始化，等对话框打开时再初始化
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
    display: flex;
    align-items: center;
  }

  .contacts-toolbar {
    margin-bottom: 10px;
  }
}

// 拖拽手柄样式
.drag-handle {
  cursor: grab;
  color: #909399;
  font-size: 16px;
  transition: color 0.2s;

  &:hover {
    color: #409EFF;
  }

  &:active {
    cursor: grabbing;
  }
}

// 拖拽时的行样式
:deep(.sortable-ghost) {
  opacity: 0.5;
  background-color: #ecf5ff !important;
  border: 2px dashed #409EFF !important;
}

:deep(.sortable-chosen) {
  background-color: #f5f7fa;
}

:deep(.sortable-drag) {
  opacity: 0.9;
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

// 拖拽过程中的表格样式
:deep(.is-dragging) {
  .el-table__row {
    transition: none;
  }
}

// 表格行hover时显示拖拽图标
:deep(.contacts-sortable-table) {
  .el-table__row {
    .drag-handle {
      opacity: 0.5;
    }

    &:hover .drag-handle {
      opacity: 1;
    }
  }
}
</style>
