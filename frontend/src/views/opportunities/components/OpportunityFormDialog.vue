<template>
  <el-dialog :title="dialogTitle" v-model="visible" width="900px" :close-on-click-modal="false" @close="handleClose"
    class="opportunity-form-dialog" destroy-on-close :fullscreen="isFullscreen">
    <template #header>
      <div class="header">
        <span class="title"><el-icon><Document /></el-icon>{{ dialogTitle }}</span>
        <div class="header-actions">
          <el-button v-if="showTransferBtn" type="success" size="small" @click="handleTransferToProject">
            流转到项目
          </el-button>
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

    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="opportunity-form">
      <!-- 商机基本信息 -->
      <div class="form-section">
        <div class="section-title">商机基本信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商机名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商机名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商机来源">
              <el-input v-model="form.source" placeholder="请输入商机来源" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商机阶段" prop="stage">
              <el-select v-model="form.stage" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in stages" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="意向等级" prop="interest">
              <el-select v-model="form.interest" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in interests" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计金额" prop="estimated_amount">
              <el-input-number v-model="form.estimated_amount" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计成交日期">
              <el-date-picker v-model="form.estimated_date" type="date" placeholder="选择日期" style="width: 100%"
                value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 商机合作方信息 -->
      <div class="form-section">
        <div class="section-title">商机合作方信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合作方名称" prop="partner_id">
              <el-select v-model="form.partner_id" filterable remote placeholder="请输入合作方名称搜索"
                :remote-method="searchPartners" :loading="partnerLoading" style="width: 100%"
                @change="handlePartnerChange">
                <el-option v-for="item in partnerOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <div class="payment-toolbar">
            <el-button type="primary" :icon="Plus" @click="handleAddPartner">新增合作方</el-button>
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

      <!-- 附件信息 -->
      <div class="form-section">
        <div class="section-title">附件信息</div>
        <el-upload ref="uploadRef" action="" :auto-upload="false" :on-change="handleFileChange" :file-list="fileList"
          multiple class="upload-area">
          <el-button type="primary" :icon="Upload">选择文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              支持需求说明书、技术解决方案等
            </div>
          </template>
        </el-upload>

        <!-- 已上传附件列表 -->
        <el-table v-if="existingAttachments.length > 0" :data="existingAttachments" border size="small"
          class="attachment-table">
          <el-table-column prop="file_name" label="文件名" min-width="200" show-overflow-tooltip />
          <el-table-column prop="attachment_type" label="类型" width="160">
            <template #default="{ row }">
              <el-select v-model="row.attachment_type" size="small"
                @change="(val) => handleUpdateAttachmentType(row, val)">
                <el-option v-for="type in attachmentTypeOptions" :key="type" :label="type" :value="type" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="file_size" label="大小" width="100">
            <template #default="{ row }">
              {{ formatFileSize(row.file_size) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openPreview(row)">预览</el-button>
              <el-button link type="primary" size="small" @click="handleDownload(row)">下载</el-button>
              <el-button link type="danger" size="small" @click="handleDeleteAttachment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-form>

    <template #footer>
      <el-divider></el-divider>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存</el-button>
    </template>
  </el-dialog>

  <!-- 新增合作方对话框 -->
  <PartnerFormDialog v-model:visible="partnerDialogVisible" :type="'add'" @success="handlePartnerDialogSuccess" />

  <!-- 附件预览对话框 -->
  <AttachmentPreviewDialog v-model="previewVisible" :attachment="previewAttachment" />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Upload, FullScreen, Close } from '@element-plus/icons-vue'
import { createOpportunity, updateOpportunity, getOpportunityById } from '@/api/opportunities'
import { searchPartners as searchPartnersApi } from '@/api/partners'
import { downloadAttachment, uploadAttachment, deleteAttachment, updateAttachment, getAttachmentTypes } from '@/api/attachments'
import { getDictionaryByCode } from '@/api/dictionaries'
import { formatFileSize, downloadBlob } from '@/utils/format'
import PartnerFormDialog from '../../partners/components/PartnerFormDialog.vue'
import AttachmentPreviewDialog from '@/components/AttachmentPreviewDialog.vue'

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

const dialogTitle = computed(() => props.type === 'add' ? '新增商机' : '编辑商机')

// 表单引用
const formRef = ref(null)
const uploadRef = ref(null)

// 加载状态
const submitLoading = ref(false)
const partnerLoading = ref(false)

// 全屏切换
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 数字转换辅助函数
const toNum = (val) => {
  if (val === null || val === undefined) return 0
  const n = parseFloat(val)
  return Number.isFinite(n) ? n : 0
}

// 表单默认值
const DEFAULT_FORM = {
  name: '',
  source: '',
  stage: '初步接触',
  interest: '未知',
  estimated_amount: 0,
  estimated_date: '',
  partner_id: null
}

// 表单数据
const form = ref({ ...DEFAULT_FORM })

// 选项（从字典获取）
const stages = ref([])
const interests = ref([])
const attachmentTypeOptions = ref([])

// 合作方信息
const partnerOptions = ref([])
const partnerInfo = ref({})

// 合作方表单对话框
const partnerDialogVisible = ref(false)

// 附件
const fileList = ref([])
const existingAttachments = ref([])
const newFiles = ref([])

// 附件预览状态
const previewVisible = ref(false)
const previewAttachment = ref(null)

// 获取字典选项
const fetchDictOptions = async () => {
  try {
    const [stageRes, interestRes, attachmentRes] = await Promise.all([
      getDictionaryByCode('opportunity_stage'),
      getDictionaryByCode('opportunity_interest'),
      getDictionaryByCode('attachment_type')
    ])
    stages.value = stageRes.data.items || []
    interests.value = interestRes.data.items || []
    attachmentTypeOptions.value = attachmentRes.data.items || []
  } catch (error) {
    console.error('获取字典选项失败:', error)
  }
}

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入商机名称', trigger: 'blur' }],
  stage: [{ required: true, message: '请选择商机阶段', trigger: 'change' }],
  interest: [{ required: true, message: '请选择意向等级', trigger: 'change' }],
  partner_id: [{ required: true, message: '请选择合作方', trigger: 'change' }]
}

// 搜索合作方
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
  partnerDialogVisible.value = true
}

// 合作方对话框成功回调
const handlePartnerDialogSuccess = (newPartner) => {
  if (newPartner && newPartner.id) {
    partnerOptions.value = [newPartner]
    form.value.partner_id = newPartner.id
    handlePartnerChange(newPartner.id)
  }
}

// 文件上传
const handleFileChange = (file) => {
  newFiles.value.push(file.raw)
}

// 打开附件预览
const openPreview = (att) => {
  previewAttachment.value = att
  previewVisible.value = true
}

// 文件下载
const handleDownload = async (row) => {
  try {
    const response = await downloadAttachment(row.id)
    downloadBlob(response.data, row.file_name)
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
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
    ElMessage.error('删除附件失败')
  }
}

// 更新附件类型
const handleUpdateAttachmentType = async (row, newType) => {
  try {
    await updateAttachment(row.id, { attachment_type: newType })
    ElMessage.success('附件类型更新成功')
  } catch (error) {
    console.error('更新附件类型失败:', error)
    ElMessage.error('更新附件类型失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (err) {
    ElMessage.warning('请检查表单必填项')
    return
  }

  submitLoading.value = true
  try {
    const submitData = { ...form.value }
    let opportunityId

    if (props.type === 'add') {
      const res = await createOpportunity(submitData)
      opportunityId = res.data.id
      ElMessage.success('商机创建成功')
    } else {
      await updateOpportunity(props.data.id, submitData)
      opportunityId = props.data.id
      ElMessage.success('商机更新成功')
    }

    // 上传新附件
    for (const file of newFiles.value) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('opportunity_id', opportunityId)
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

// 关闭对话框
const handleClose = () => {
  form.value = { ...DEFAULT_FORM }
  partnerInfo.value = {}
  partnerOptions.value = []
  fileList.value = []
  existingAttachments.value = []
  newFiles.value = []
  visible.value = false
}

// 加载编辑数据
const loadEditData = async () => {
  if (props.type !== 'edit' || !props.data) return
  try {
    const { data } = await getOpportunityById(props.data.id)

    form.value = {
      name: data.name || '',
      source: data.source || '',
      stage: data.stage || '初步接触',
      interest: data.interest || '未知',
      estimated_amount: toNum(data.estimated_amount),
      estimated_date: data.estimated_date || '',
      partner_id: data.partner_id
    }

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
      partnerOptions.value = [{
        id: data.partner_id,
        name: data.partner_name
      }]
    }
  } catch (error) {
    console.error('加载商机数据失败:', error)
    ElMessage.error('加载商机数据失败')
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
.opportunity-form-dialog {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 16px;

    .title {
      gap: 8px;
      display: flex;
      align-items: center;
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
  }

  .upload-area {
    margin-bottom: 15px;
  }

  .attachment-table {
    margin-top: 15px;
  }
}
</style>
