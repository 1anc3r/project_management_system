<template>
  <el-dialog
    v-model="visible"
    title="合作方详情"
    width="700px"
    destroy-on-close
  >
    <el-descriptions :column="2" border v-if="partner">
      <el-descriptions-item label="合作方名称" :span="2">{{ partner.name }}</el-descriptions-item>
      <el-descriptions-item label="纳税人识别号" :span="2">{{ partner.tax_id || '-' }}</el-descriptions-item>
      <el-descriptions-item label="类型" :span="2">
        <el-tag size="small">{{ partner.type }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="地址" :span="2">{{ partner.address || '-' }}</el-descriptions-item>
      <el-descriptions-item label="开户银行">{{ partner.bank || '-' }}</el-descriptions-item>
      <el-descriptions-item label="银行账号">{{ partner.bank_account || '-' }}</el-descriptions-item>
      <el-descriptions-item label="联系人">{{ partner.contact || '-' }}</el-descriptions-item>
      <el-descriptions-item label="联系电话">{{ partner.contact_phone || '-' }}</el-descriptions-item>
    </el-descriptions>
    
    <div class="stats-section" v-if="partner">
      <div class="section-title">合作统计</div>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="stat-card">
            <div class="stat-label">关联项目数</div>
            <div class="stat-value">{{ partner.project_count || 0 }} 个</div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="stat-card">
            <div class="stat-label">合同总金额</div>
            <div class="stat-value">{{ formatAmount(partner.total_contract_amount) }} 万元</div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handleEdit">编辑</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { formatAmount } from '@/utils/format'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  partner: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'edit'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 编辑
const handleEdit = () => {
  visible.value = false
  emit('edit', props.partner)
}
</script>

<style scoped lang="scss">
.stats-section {
  margin-top: 20px;
  
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 15px;
    padding-left: 10px;
    border-left: 4px solid #409EFF;
  }
  
  .stat-card {
    background-color: #f5f7fa;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    
    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
    }
    
    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: #409EFF;
    }
  }
}
</style>
