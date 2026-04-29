<template>
  <el-dialog
    :title="dialogTitle"
    v-model="visible"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="project-form-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="110px"
      class="project-form"
    >
      <!-- 项目基本信息 -->
      <div class="form-section">
        <div class="section-title">项目基本信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="履约地点" prop="city">
              <el-select v-model="form.city" placeholder="请选择履约地点" style="width: 100%">
                <el-option
                  v-for="city in cities"
                  :key="city"
                  :label="city"
                  :value="city"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="项目类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in types"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="拓展方式" prop="expansion_method">
              <el-select v-model="form.expansion_method" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in expansionMethods"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="项目内容" prop="content">
              <el-select v-model="form.content" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in contents"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="项目阶段" prop="stage">
              <el-select v-model="form.stage" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in stages"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="起始日期" prop="start_date">
              <el-date-picker
                v-model="form.start_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="终止日期" prop="end_date">
              <el-date-picker
                v-model="form.end_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="合同总金额" prop="total_amount">
              <el-input-number
                v-model="form.total_amount"
                :precision="2"
                :min="0"
                style="width: 100%"
                @change="calculateAmounts"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="已开票金额" prop="receipt_amount">
              <el-input-number
                v-model="form.receipt_amount"
                :precision="2"
                :disabled=true
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="待开票金额">
              <el-input-number
                v-model="form.pending_amount"
                :precision="2"
                :disabled=true
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="成本" prop="cost">
              <el-input-number
                v-model="form.cost"
                :precision="2"
                :min="0"
                style="width: 100%"
                @change="calculateAmounts"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="毛利">
              <el-input-number
                v-model="form.profit"
                :precision="2"
                :disabled=true
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="毛利率">
              <el-input v-model="form.profit_rate" disabled>
                <template #append>%</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 项目款项情况 -->
      <div class="form-section">
        <div class="section-title">
          项目款项情况
          <el-tag v-if="paymentRatioWarning" type="danger" size="small" style="margin-left: 10px">
            款项比例总和 {{ paymentTotalRatio }}%，必须等于100%
          </el-tag>
          <el-tag v-else-if="payments.length > 0" type="success" size="small" style="margin-left: 10px">
            款项比例总和 100%
          </el-tag>
        </div>
        
        <div class="payment-toolbar">
          <el-button type="primary" size="small" :icon="Plus" @click="handleAddPayment">新增款项</el-button>
        </div>
        
        <el-table :data="payments" border size="small">
          <el-table-column type="index" label="序号" width="50" align="center" />
          <el-table-column label="款项" width="120">
            <template #default="{ row, $index }">
              <el-select v-model="row.payment_type" size="small">
                <el-option
                  v-for="type in paymentTypes"
                  :key="type"
                  :label="type"
                  :value="type"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="款项条件" min-width="150">
            <template #default="{ row, $index }">
              <el-input v-model="row.payment_condition" size="small" placeholder="支付条件" />
            </template>
          </el-table-column>
          <el-table-column label="支付比例(%)" width="110">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.payment_ratio"
                :precision="2"
                :min="0"
                :max="100"
                size="small"
                style="width: 100%"
                @change="calculateAmounts()"
              />
            </template>
          </el-table-column>
          <el-table-column label="款项金额(万元)" width="120">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.payment_amount"
                :precision="2"
                :min="0"
                size="small"
                style="width: 100%"
                :disabled=true
              />
            </template>
          </el-table-column>
          <el-table-column label="是否支付" width="80" align="center">
            <template #default="{ row, $index }">
              <el-checkbox v-model="row.is_paid"
                :true-value="1"
                :false-label="0"
                @change="calculateAmounts()"/>
            </template>
          </el-table-column>
          <el-table-column label="支付日期" width="140">
            <template #default="{ row, $index }">
              <el-date-picker
                v-model="row.payment_date"
                type="date"
                size="small"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="handleDeletePayment($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 项目合作方信息 -->
      <div class="form-section">
        <div class="section-title">项目合作方信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合作方名称" prop="partner_id">
              <el-select
                v-model="form.partner_id"
                filterable
                remote
                placeholder="请输入合作方名称搜索"
                :remote-method="searchPartners"
                :loading="partnerLoading"
                style="width: 100%"
                @change="handlePartnerChange"
              >
                <el-option
                  v-for="item in partnerOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <div class="payment-toolbar">
            <el-button type="primary" size="small" :icon="Plus" @click="handleAddPartner">新增合作方</el-button>
          </div>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="纳税人识别号">
              <el-input v-model="partnerInfo.tax_id" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合作方地址">
              <el-input v-model="partnerInfo.address" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开户银行">
              <el-input v-model="partnerInfo.bank" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号">
              <el-input v-model="partnerInfo.bank_account" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="partnerInfo.contact" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="partnerInfo.contact_phone" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 项目附件 -->
      <div class="form-section">
        <div class="section-title">项目附件</div>
        <el-upload
          ref="uploadRef"
          action=""
          :auto-upload="false"
          :on-change="handleFileChange"
          :file-list="fileList"
          multiple
          class="upload-area"
        >
          <el-button type="primary" :icon="Upload">选择文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              支持测算表、报价函、合同/协议、验收报告等文件
            </div>
          </template>
        </el-upload>
        
        <!-- 已上传附件列表 -->
        <el-table v-if="existingAttachments.length > 0" :data="existingAttachments" border size="small" class="attachment-table">
          <el-table-column prop="file_name" label="文件名" min-width="200" />
          <el-table-column prop="attachment_type" label="类型" width="160">
            <template #default="{ row }">
              <el-select v-model="row.attachment_type" size="small" @change="(val) => handleUpdateAttachmentType(row, val)">
                <el-option v-for="type in attachmentTypeOptions" :key="type" :label="type" :value="type" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="file_size" label="大小" width="100">
            <template #default="{ row }">
              {{ formatFileSize(row.file_size) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row, $index }">
              <el-button link type="primary" size="small" @click="handleDownload(row)">下载</el-button>
              <el-button link type="danger" size="small" @click="handleDeleteAttachment(row)">删除</el-button>
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

  <!-- 编辑合作方对话框 -->
  <PartnerFormDialog
    v-model:visible="partnerDialogVisible"
    :type="partnerDialogType"
    :data="partnerDialogData"
    @success="handlePartnerDialogSuccess"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import { createProject, updateProject, getProjectById } from '@/api/projects'
import { searchPartners as searchPartnersApi } from '@/api/partners'
import { downloadAttachment, uploadAttachment, deleteAttachment, updateAttachment, getAttachmentTypes } from '@/api/attachments'
import { getDictionaryByCode } from '@/api/dictionaries'
import { formatFileSize, downloadBlob } from '@/utils/format'
import PartnerFormDialog from '../../partners/components/PartnerFormDialog.vue'

const props = defineProps({
  visible: Boolean,
  type: { type: String, default: 'add' },
  data: Object
})

const emit = defineEmits(['update:visible', 'success'])

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const dialogTitle = computed(() => props.type === 'add' ? '新增项目' : '编辑项目')

// 表单引用
const formRef = ref(null)
const uploadRef = ref(null)

// 加载状态
const submitLoading = ref(false)
const partnerLoading = ref(false)

// 数字转换辅助函数 - 确保所有金额字段为 number 类型，避免 ElInputNumber 类型警告
const toNum = (val) => {
  if (val === null || val === undefined) return 0
  const n = parseFloat(val)
  return Number.isFinite(n) ? n : 0
}

// 表单默认值（常量，避免重复定义）
const DEFAULT_FORM = {
  name: '',
  city: '',
  type: '收入合同',
  expansion_method: '',
  content: '',
  stage: '意向',
  total_amount: 0,
  receipt_amount: 0,
  pending_amount: 0,
  cost: 0,
  profit: 0,
  profit_rate: 0,
  start_date: '',
  end_date: '',
  partner_id: null
}

// 表单数据
const form = ref({ ...DEFAULT_FORM })

// 款项列表
const payments = ref([])
const paymentTypes = ref([])

// 合作方信息
const partnerOptions = ref([])
const partnerInfo = ref({})

// 合作方表单对话框
const partnerDialogVisible = ref(false)
const partnerDialogType = ref('add')
const partnerDialogData = ref(null)

// 附件
const fileList = ref([])
const existingAttachments = ref([])
const newFiles = ref([])
const attachmentTypeOptions = ref([])

// 选项（从字典获取）
const stages = ref([])
const types = ref([])
const expansionMethods = ref([])
const contents = ref([])
const cities = ref([])

// 获取字典选项
const fetchDictOptions = async () => {
  try {
    const [stageRes, typeRes, expansionRes, contentRes, cityRes, paymentRes, attachmentRes] = await Promise.all([
      getDictionaryByCode('project_stage'),
      getDictionaryByCode('project_type'),
      getDictionaryByCode('expansion_method'),
      getDictionaryByCode('project_content'),
      getDictionaryByCode('project_city'),
      getDictionaryByCode('payment_type'),
      getAttachmentTypes()
    ])
    stages.value = stageRes.data.items || []
    types.value = typeRes.data.items || []
    expansionMethods.value = expansionRes.data.items || []
    contents.value = contentRes.data.items || []
    cities.value = cityRes.data.items || []
    paymentTypes.value = paymentRes.data.items || []
    attachmentTypeOptions.value = attachmentRes.data || []
  } catch (error) {
    console.error('获取字典选项失败:', error)
  }
}

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  city: [{ required: true, message: '请选择履约地点', trigger: 'change' }],
  type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  stage: [{ required: true, message: '请选择项目阶段', trigger: 'change' }],
  expansion_method: [{ required: true, message: '请选择拓展方式', trigger: 'change' }],
  content: [{ required: true, message: '请选择项目内容', trigger: 'change' }],
  partner_id: [{ required: true, message: '请选择合作方', trigger: 'change' }]
}

// 款项比例总和（返回数字，避免隐式类型转换）
const paymentTotalRatio = computed(() =>
  payments.value.reduce((sum, p) => sum + toNum(p.payment_ratio), 0)
)

// 款项比例校验提醒
const paymentRatioWarning = computed(() => {
  if (payments.value.length === 0) return false
  return Math.abs(paymentTotalRatio.value - 100) > 0.01
})

// 计算金额（统一入口，避免重复计算）
const calculateAmounts = () => {
  form.value.receipt_amount = 0

  payments.value.forEach(payment => {
    payment.payment_amount = parseFloat(((form.value.total_amount * toNum(payment.payment_ratio)) / 100).toFixed(2))
    if (payment.is_paid) {
      form.value.receipt_amount += payment.payment_amount
    }
  })
  form.value.receipt_amount = parseFloat(form.value.receipt_amount.toFixed(2))

  form.value.pending_amount = parseFloat((form.value.total_amount - form.value.receipt_amount).toFixed(2))
  form.value.profit = parseFloat((form.value.total_amount - form.value.cost).toFixed(2))
  form.value.profit_rate = form.value.total_amount > 0
    ? parseFloat(((form.value.profit / form.value.total_amount) * 100).toFixed(2))
    : 0
}

// 搜索合作方（增加空值保护）
const searchPartners = async (query) => {
  if (!query || String(query).trim().length < 1) return
  partnerLoading.value = true
  try {
    const res = await searchPartnersApi(query)
    partnerOptions.value = res.data
  } catch (error) {
    console.error('搜索合作方失败:', error)
  } finally {
    partnerLoading.value = false
  }
}

// 合作方选择变化
const handlePartnerChange = (partnerId) => {
  const partner = partnerOptions.value.find(p => p.id === partnerId)
  partnerInfo.value = partner ? { ...partner } : {}
}

// 新增合作方
const handleAddPartner = () => {
  partnerDialogType.value = 'add'
  partnerDialogData.value = null
  partnerDialogVisible.value = true
}

// 合作方对话框成功回调
const handlePartnerDialogSuccess = () => {
  if (partnerInfo.value.name) {
    searchPartners(partnerInfo.value.name)
  }
}

// 新增款项
const handleAddPayment = () => {
  payments.value.push({
    payment_type: '首款',
    payment_condition: '',
    payment_ratio: 0,
    payment_amount: 0,
    is_paid: false,
    payment_date: ''
  })
}

// 删除款项
const handleDeletePayment = (index) => {
  payments.value.splice(index, 1)
  calculateAmounts()
}

// 文件上传（同步维护 newFiles 列表）
const handleFileChange = (file) => {
  newFiles.value.push(file.raw)
}

// 文件下载
const handleDownload = async (row) => {
  try {
    const response = await downloadAttachment(row.id)
    downloadBlob(response.data, row.file_name)
  } catch (error) {
    console.error('下载失败:', error)
  }
}

// 删除附件
const handleDeleteAttachment = async (row) => {
  try {
    await deleteAttachment(row.id)
    existingAttachments.value = existingAttachments.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除附件失败:', error)
  }
}

// 更新附件
const handleUpdateAttachmentType = async (row, newType) => {
  try {
    await updateAttachment(row.id, { attachment_type: newType })
    ElMessage.success('附件类型更新成功')
  } catch (error) {
    console.error('更新附件类型失败:', error)
  }
}

// 提交表单（修复验证异常处理）
const handleSubmit = async () => {
  if (payments.value.length > 0 && paymentRatioWarning.value) {
    ElMessage.warning('款项比例总和必须等于100%')
    return
  }

  try {
    await formRef.value.validate()
  } catch (err) {
    ElMessage.warning('请检查表单必填项')
    return
  }

  submitLoading.value = true
  try {
    const submitData = { ...form.value, payments: payments.value }
    let projectId

    if (props.type === 'add') {
      const res = await createProject(submitData)
      projectId = res.data.id
      ElMessage.success('项目创建成功')
    } else {
      await updateProject(props.data.id, submitData)
      projectId = props.data.id
      ElMessage.success('项目更新成功')
    }

    // 上传新附件
    for (const file of newFiles.value) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_id', projectId)
      formData.append('attachment_type', '其他')
      await uploadAttachment(formData)
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

// 关闭对话框（简化重置逻辑，移除无意义的 resetFields）
const handleClose = () => {
  form.value = { ...DEFAULT_FORM }
  payments.value = []
  partnerInfo.value = {}
  fileList.value = []
  existingAttachments.value = []
  newFiles.value = []
  visible.value = false
}

// 加载编辑数据（简化映射逻辑）
const loadEditData = async () => {
  if (props.type !== 'edit' || !props.data) return
  try {
    const { data } = await getProjectById(props.data.id)

    // 使用 toNum 确保所有金额字段为 number 类型
    form.value = {
      name: data.name || '',
      city: data.city || '',
      type: data.type || '收入合同',
      expansion_method: data.expansion_method || '',
      content: data.content || '',
      stage: data.stage || '意向',
      total_amount: toNum(data.total_amount),
      receipt_amount: toNum(data.receipt_amount),
      pending_amount: toNum(data.pending_amount),
      cost: toNum(data.cost),
      profit: toNum(data.profit),
      profit_rate: toNum(data.profit_rate),
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      partner_id: data.partner_id
    }

    // 加载款项（同时转换数字类型）
    payments.value = (data.payments || []).map(p => ({
      ...p,
      payment_ratio: toNum(p.payment_ratio),
      payment_amount: toNum(p.payment_amount)
    }))

    // 加载合作方信息
    partnerInfo.value = {
      name: data.partner_name,
      tax_id: data.partner_tax_id,
      address: data.partner_address,
      bank: data.partner_bank,
      bank_account: data.partner_bank_account,
      contact: data.partner_contact,
      contact_phone: data.partner_contact_phone
    }

    // 加载附件
    existingAttachments.value = data.attachments || []

    // 设置合作方选项
    if (data.partner_id) {
      partnerOptions.value = [{ id: data.partner_id, name: data.partner_name }]
    }
  } catch (error) {
    console.error('加载项目数据失败:', error)
    ElMessage.error('加载项目数据失败')
  }
}

// 监听对话框显示
watch(() => props.visible, (val) => {
  if (val) {
    fetchDictOptions()
    if (props.type === 'edit') {
      loadEditData()
    }
  }
})
</script>

<style scoped lang="scss">
.project-form-dialog {
  .form-section {
    margin-bottom: 25px;
    
    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 15px;
      padding-left: 10px;
      border-left: 4px solid #409EFF;
    }
    
    .payment-toolbar {
      margin-bottom: 10px;
    }
  }
  
  .upload-area {
    margin-bottom: 15px;
  }
  
  .attachment-table {
    margin-top: 15px;
  }
}
</style>
