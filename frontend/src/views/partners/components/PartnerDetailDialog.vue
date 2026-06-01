<template>
  <el-dialog v-model="visible" title="合作方详情" width="900px" destroy-on-close>
    <!-- 头部信息 -->
    <div class="detail-header" v-if="partner">
      <div class="detail-title">
        <span class="title-text">{{ partner.name }}</span>
        <div class="header-tags">
          <el-tag :type="getPartnerTypeTag(partner.type)" size="large">{{ partner.type || '其他' }}</el-tag>
        </div>
      </div>
    </div>
    <el-descriptions :column="2" border v-if="partner">
      <el-descriptions-item label="合作方名称" :span="2">{{ partner.name }}</el-descriptions-item>
      <el-descriptions-item label="类型" :span="2">
        <el-tag :type="getPartnerTypeTag(partner.type)" size="small">{{ partner.type }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="纳税人识别号">{{ partner.tax_id || '-' }}</el-descriptions-item>
      <el-descriptions-item label="地址">{{ partner.address || '-' }}</el-descriptions-item>
      <el-descriptions-item label="开户银行">{{ partner.bank || '-' }}</el-descriptions-item>
      <el-descriptions-item label="银行账号">{{ partner.bank_account || '-' }}</el-descriptions-item>
    </el-descriptions>

    <!-- 联系人列表 -->
    <div class="contacts-section" v-if="partner">
      <div class="section-title">
        联系人列表
        <el-tag type="info" size="small" class="count-tag">{{ contactsList.length }} 位</el-tag>
      </div>
      <el-table v-if="contactsList.length" :data="contactsList" border size="small">
        <el-table-column type="index" label="序号" width="50" align="center" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column prop="position" label="职务" min-width="150">
          <template #default="{ row }">{{ row.position || '-' }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无联系人" />
    </div>

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

    <!-- 相关资讯列表（可折叠/展开） -->
    <div class="info-section" v-if="partner">
      <el-collapse v-model="activeCollapse">
        <el-collapse-item name="information">
          <template #title>
            <div class="collapse-title">
              <span class="section-title">相关资讯</span>
              <el-tag type="info" size="small" class="count-tag">{{ informationList.length }} 条</el-tag>
            </div>
          </template>
          <el-timeline v-if="informationList.length">
            <el-timeline-item v-for="item in informationList" :key="item.id"
              :type="getInfoTypeTag(item.information_type)" :timestamp="formatDate(item.information_date)"
              placement="top">
              <el-card shadow="never" class="info-card">
                <template #header>
                  <div class="info-header">
                    <span class="info-title">{{ item.information_title }}</span>
                    <el-tag :type="getInfoTypeTag(item.information_type)" size="small">{{ item.information_type
                      }}</el-tag>
                  </div>
                </template>
                <p class="info-content">{{ item.information_content || '暂无内容' }}</p>
                <p v-if="item.project_name" class="info-project">
                  <el-icon>
                    <Link />
                  </el-icon>
                  关联项目：{{ item.project_name }}
                </p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无相关资讯" />
        </el-collapse-item>
      </el-collapse>
    </div>

    <template #footer>
      <el-button @click="visible = false">
        <el-icon>
          <ArrowLeft />
        </el-icon> 返回列表
      </el-button>
      <el-button type="primary" @click="handleEdit">编辑</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Link } from '@element-plus/icons-vue'
import { formatDate, formatAmount, getPartnerTypeTag, getInfoTypeTag } from '@/utils/format'
import { getPartnerById } from '@/api/partners'
import { getInformationByPartner } from '@/api/information'

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

// 折叠面板激活项
const activeCollapse = ref(['information'])
// 资讯列表
const informationList = ref([])
// 联系人列表
const contactsList = ref([])

// 获取合作方详情（包括联系人）
const fetchPartnerDetail = async () => {
  if (!props.partner?.id) return
  try {
    const res = await getPartnerById(props.partner.id)
    contactsList.value = res.data.contacts || []
  } catch (error) {
    console.error('获取合作方联系人失败:', error)
    contactsList.value = []
  }
}

// 获取资讯列表
const fetchInformationData = async () => {
  if (!props.partner?.id) return
  try {
    const res = await getInformationByPartner(props.partner.id, { limit: 50 })
    informationList.value = res.data || []
  } catch (error) {
    console.error('获取资讯列表失败:', error)
    informationList.value = []
  }
}

// 监听合作方变化，加载数据
watch(() => props.partner?.id, (newId) => {
  if (newId && visible.value) {
    fetchPartnerDetail()
    fetchInformationData()
  }
})

watch(() => visible.value, (val) => {
  if (val && props.partner?.id) {
    fetchPartnerDetail()
    fetchInformationData()
  }
})

// 编辑
const handleEdit = () => {
  visible.value = false
  emit('edit', props.partner)
}
</script>

<style scoped lang="scss">
.detail-header {
  margin-bottom: 20px;

  .detail-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;

    .title-text {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }

    .header-tags {
      display: flex;
      gap: 8px;
    }
  }
}

.contacts-section {
  margin-top: 20px;

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 15px;
    padding-left: 10px;
    border-left: 4px solid #409EFF;
  }

  .count-tag {
    font-size: 12px;
    margin-left: 10px;
  }
}

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

.info-section {
  margin-top: 20px;

  .collapse-title {
    display: flex;
    align-items: center;
    gap: 10px;

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      padding-left: 10px;
      border-left: 4px solid #409EFF;
    }

    .count-tag {
      font-size: 12px;
    }
  }

  .info-card {
    margin-bottom: 5px;

    .info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .info-title {
        font-weight: 600;
        font-size: 14px;
      }
    }

    .info-content {
      font-size: 13px;
      color: #606266;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .info-project {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
