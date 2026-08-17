<template>
  <div class="app-container">
    <!-- 头部 -->
    <header class="app-header">
      <div class="app-header-inner">
        <h1>
          <el-icon>
            <CreditCard />
          </el-icon>
          税率计算工具
        </h1>
        <span class="header-sub">增值税 · 附加税 一站式计算</span>
      </div>
    </header>

    <!-- 双栏布局 -->
    <div class="converter-grid">
      <!-- 左栏：增值税计算 -->
      <el-card class="card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon">
              <PriceTag />
            </el-icon>
            <h3>增值税计算</h3>
            <span class="card-badge">VAT</span>
          </div>
        </template>

        <!-- 税率选择 -->
        <div class="rate-group">
          <label class="form-label">税率</label>
          <div class="rate-buttons">
            <button v-for="rate in presetRates" :key="rate" class="rate-btn"
              :class="{ active: selectedRate === rate && !isCustom }" @click="selectPresetRate(rate)">
              {{ rate }}%
            </button>
            <button class="rate-btn rate-btn-custom" :class="{ active: isCustom }" @click="toggleCustom">
              <el-icon>
                <Edit />
              </el-icon>
              自定义
            </button>
          </div>
          <!-- 自定义输入 -->
          <div v-if="isCustom" class="custom-rate-input">
            <el-input v-model="customRateValue" placeholder="输入自定义税率" size="default" style="width: 160px;"
              @input="onCustomRateChange">
              <template #append>%</template>
            </el-input>
            <span class="rate-hint">请输入 0~100 之间的数值</span>
          </div>
          <div class="rate-desc">
            <span v-if="!isCustom && selectedRate === 13">销售/进口货物 · 加工修理修配劳务 · 有形动产租赁</span>
            <span v-else-if="!isCustom && selectedRate === 9">交通运输服务 · 邮政服务 · 基础电信服务 · 建筑服务 ·
              不动产销售/租赁</span>
            <span v-else-if="!isCustom && selectedRate === 6">现代服务 · 金融服务 · 增值电信服务 · 生产生活服务 · 无形资产销售</span>
            <span v-else-if="!isCustom && selectedRate === 5">不动产销售/租赁（老项目） · 劳务派遣服务差额 · 人力资源外包服务</span>
            <span v-else-if="!isCustom && selectedRate === 3">小规模纳税人（3% 征收率）</span>
            <span v-else-if="!isCustom && selectedRate === 1">小规模纳税人（1% 征收率）</span>
            <span v-else-if="!isCustom && selectedRate === 0">出口货物 · 跨境服务</span>
            <span v-else-if="isCustom">自定义税率 {{ customRateValue || '—' }}%</span>
            <span v-else>选择适用税率</span>
          </div>
        </div>

        <!-- 含税价输入 -->
        <div class="input-group">
          <label class="form-label">含税价</label>
          <div class="price-input-wrapper">
            <el-input v-model="priceWithTax" size="large" clearable @input="onPriceInput">
              <template #prepend>¥</template>
              <template #append>元</template>
            </el-input>
          </div>
        </div>

        <!-- 结果区 -->
        <div class="result-grid">
          <div class="result-item">
            <div class="result-label">
              <span class="dot dot-blue"></span>
              不含税价
            </div>
            <div class="result-value">
              <span v-if="priceWithoutTax !== null && priceWithoutTax !== ''">
                {{ priceWithoutTax }}
              </span>
              <span v-else class="placeholder">—</span>
            </div>
            <div class="result-unit">元</div>
          </div>
          <div class="result-item">
            <div class="result-label">
              <span class="dot dot-orange"></span>
              税额
            </div>
            <div class="result-value">
              <span v-if="taxAmount !== null && taxAmount !== ''">
                {{ taxAmount }}
              </span>
              <span v-else class="placeholder">—</span>
            </div>
            <div class="result-unit">元</div>
          </div>
        </div>

        <!-- 实时公式 -->
        <div class="formula-box">
          <div class="formula-title">
            <el-icon>
              <Connection />
            </el-icon>
            实时公式
          </div>
          <div class="formula-content">
            <div v-if="hasValidInput" class="formula-line">
              不含税价 = {{ priceWithTax || '含税价' }} ÷ (1 + {{ displayRate }}%) = <strong>{{ priceWithoutTax
                || '...'
              }}</strong>
            </div>
            <div v-if="hasValidInput" class="formula-line">
              税额 = {{ priceWithTax || '含税价' }} − {{ priceWithoutTax || '不含税价' }} = <strong>{{ taxAmount ||
                '...'
              }}</strong>
            </div>
            <div v-if="hasValidInput" class="formula-line formula-result">
              含税价 = {{ priceWithoutTax || '不含税价' }} × (1 + {{ displayRate }}%) = <strong>{{ priceWithTax
                || '...'
              }}</strong>
            </div>
            <div v-else class="formula-placeholder">输入含税价后自动计算</div>
          </div>
        </div>

        <!-- 示例 -->
        <div class="example-row">
          <span class="label">示例：</span>
          <button class="example-btn" @click="setExample('500000')">¥500,000</button>
          <button class="example-btn" @click="setExample('300000')">¥300,000</button>
        </div>
      </el-card>

      <!-- 右栏：附加税计算 -->
      <el-card class="card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon">
              <Coin />
            </el-icon>
            <h3>附加税计算</h3>
            <span class="card-badge">Surtax</span>
          </div>
        </template>

        <!-- 纳税地点 -->
        <div class="input-group">
          <label class="form-label">纳税地点</label>
          <div class="location-buttons">
            <button v-for="loc in locations" :key="loc.value" class="location-btn"
              :class="{ active: selectedLocation === loc.value }" @click="selectedLocation = loc.value">
              {{ loc.label }}
              <span class="loc-rate">{{ loc.rate }}%</span>
            </button>
          </div>
          <div class="location-hint">
            <el-icon>
              <InfoFilled />
            </el-icon>
            {{ locationDesc }}
          </div>
        </div>

        <div class="converter-grid">
        <!-- 实缴增值税输入 -->
        <div class="input-group">
          <label class="form-label">实缴增值税</label>
          <div class="price-input-wrapper">
            <el-input v-model="actualVAT" size="large" clearable @input="calcSurtax">
              <template #prepend>¥</template>
            </el-input>
          </div>
        </div>

        <!-- 实缴消费税输入 -->
        <div class="input-group">
          <label class="form-label">实缴消费税 <span class="optional">(非必填)</span></label>
          <div class="price-input-wrapper">
            <el-input v-model="actualConsumptionTax" size="large" clearable @input="calcSurtax">
              <template #prepend>¥</template>
            </el-input>
          </div>
        </div>
      </div>

        <!-- 减免选项 -->
        <div class="exemption-group">
          <div class="exemption-item">
            <el-checkbox v-model="halfExemption" @change="calcSurtax">
              小规模纳税人 / 小型微利企业 / 个体工商户
            </el-checkbox>
          </div>
          <div class="exemption-note">
            <el-icon>
              <Warning />
            </el-icon>
            财政部 税务总局〔2023年〕第12号：小规模纳税人 / 小型微利企业 / 个体工商户，城建税 + 教育费附加 + 地方教育附加 减半征收
          </div>
          <div class="exemption-item">
            <el-checkbox v-model="monthlyExemption" @change="calcSurtax">
              销售额 / 营业额 月≤10万 / 季≤30万
            </el-checkbox>
          </div>
          <div class="exemption-note">
            <el-icon>
              <Warning />
            </el-icon>
            财政部 税务总局〔2016年〕第12号：销售额 / 营业额 月≤10万 / 季≤30万，教育费附加 + 地方教育附加 全额免征
          </div>
        </div>

        <!-- 附加税结果 -->
        <div class="surtax-result">
          <div class="surtax-row">
            <span class="surtax-label">计税基数</span>
            <span class="surtax-value">¥{{ surtaxBase }}</span>
          </div>
          <div class="surtax-row">
            <span class="surtax-label">城建税 {{ locationRate }}%
              <span class="surtax-tag" v-if="halfExemption">× 50%</span>
            </span>
            <span class="surtax-value">¥{{ cityTax }}</span>
          </div>
          <div class="surtax-row">
            <span class="surtax-label">教育费附加 3%
              <span class="surtax-tag" v-if="halfExemption&!monthlyExemption">× 50%</span>
              <span class="surtax-tag" v-if="monthlyExemption">免征</span>
            </span>
            <span class="surtax-value">¥{{ educationTax }}</span>
          </div>
          <div class="surtax-row">
            <span class="surtax-label">地方教育附加 2%
              <span class="surtax-tag" v-if="halfExemption&!monthlyExemption">× 50%</span>
              <span class="surtax-tag" v-if="monthlyExemption">免征</span>
            </span>
            <span class="surtax-value">¥{{ localEducationTax }}</span>
          </div>
          <div class="surtax-row total">
            <span class="surtax-label">附加合计</span>
            <span class="surtax-value">¥{{ totalSurtax }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 页脚 -->
    <div class="app-footer">
      <span class="text-muted">
        <el-icon>
          <Opportunity color="orange" />
        </el-icon>
        支持增值税税率 13% / 9% / 6% / 5% / 3% / 1% / 0% · 附加税自动计算
      </span>
      <span class="text-muted status-line">
        <span class="status-dot" :class="statusClass"></span>
        <span>{{ statusText }}</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  CreditCard,
  PriceTag,
  Coin,
  Edit,
  Connection,
  InfoFilled,
  Warning,
  Opportunity,
} from '@element-plus/icons-vue'

// =============================================================
//  1. 增值税计算
// =============================================================

const presetRates = [13, 9, 6, 5, 3, 1, 0]
const selectedRate = ref(6)
const isCustom = ref(false)
const customRateValue = ref('')
const priceWithTax = ref('')

// 选择预设税率
function selectPresetRate(rate) {
  isCustom.value = false
  selectedRate.value = rate
  customRateValue.value = ''
  updateStatus()
}

// 切换自定义
function toggleCustom() {
  isCustom.value = !isCustom.value
  if (isCustom.value) {
    customRateValue.value = ''
    selectedRate.value = null
  } else {
    selectedRate.value = 13
  }
  updateStatus()
}

// 自定义税率变化
function onCustomRateChange() {
  const val = parseFloat(customRateValue.value)
  if (!isNaN(val) && val >= 0 && val <= 100) {
    selectedRate.value = val
  }
  updateStatus()
}

// 当前显示税率
const displayRate = computed(() => {
  if (isCustom.value) {
    const val = parseFloat(customRateValue.value)
    return !isNaN(val) && val >= 0 && val <= 100 ? val : '自定义'
  }
  return selectedRate.value
})

// 实际税率（用于计算）
const effectiveRate = computed(() => {
  if (isCustom.value) {
    const val = parseFloat(customRateValue.value)
    return !isNaN(val) && val >= 0 && val <= 100 ? val : 0
  }
  return selectedRate.value
})

// 含税价输入
function onPriceInput() {
  updateStatus()
}

// 计算结果
const priceWithoutTax = computed(() => {
  const price = parseFloat(priceWithTax.value)
  const rate = effectiveRate.value
  if (isNaN(price) || price < 0 || isNaN(rate) || rate < 0) return null
  const result = price / (1 + rate / 100)
  return roundToTwo(result)
})

const taxAmount = computed(() => {
  const price = parseFloat(priceWithTax.value)
  const withoutTax = priceWithoutTax.value
  if (isNaN(price) || withoutTax === null) return null
  return roundToTwo(price - withoutTax)
})

const hasValidInput = computed(() => {
  return priceWithoutTax.value !== null && !isNaN(priceWithoutTax.value)
})

// 工具：保留两位小数
function roundToTwo(num) {
  if (typeof num !== 'number' || isNaN(num)) return null
  return Math.round(num * 100) / 100
}

// 设置示例
function setExample(val) {
  priceWithTax.value = val
  updateStatus()
}

// 状态更新
function updateStatus() {
  if (priceWithTax.value && !isNaN(parseFloat(priceWithTax.value))) {
    statusText.value = '就绪'
    statusClass.value = 'idle'
    if (priceWithoutTax.value !== null) {
      statusText.value = '计算完成'
      statusClass.value = 'success'
    }
  } else {
    statusText.value = '就绪'
    statusClass.value = 'idle'
  }
}

// =============================================================
//  2. 附加税计算
// =============================================================

const locations = [
  { value: 'urban', label: '市区', rate: 7 },
  { value: 'county', label: '县城 / 镇', rate: 5 },
  { value: 'rural', label: '其他', rate: 1 },
]
const selectedLocation = ref('urban')
const actualVAT = ref('')
const actualConsumptionTax = ref('')
const halfExemption = ref(false)
const monthlyExemption = ref(false)

const locationRate = computed(() => {
  const loc = locations.find(l => l.value === selectedLocation.value)
  return loc ? loc.rate : 7
})

const locationDesc = computed(() => {
  const loc = locations.find(l => l.value === selectedLocation.value)
  if (!loc) return ''
  const descs = {
    urban: '直辖市市区、地级市市区（含市辖区）的纳税人',
    county: '县城、镇区范围内的纳税人',
    rural: '县城、镇区以外的纳税人',
  }
  return descs[selectedLocation.value] || ''
})

// 计税基数 = 实缴增值税 + 实缴消费税
const surtaxBase = computed(() => {
  const vat = parseFloat(actualVAT.value) || 0
  const ctax = parseFloat(actualConsumptionTax.value) || 0
  return roundToTwo(vat + ctax) || 0
})

// 计算附加税
function calcSurtax() {
  // 只是触发响应式更新
}

// 城建税 = 基数 × 地点税率
const cityTax = computed(() => {
  const base = surtaxBase.value
  if (base === 0) return '0.00'
  let tax = base * (locationRate.value / 100)
  if (halfExemption.value) tax = tax / 2
  return roundToTwo(tax).toFixed(2)
})

// 教育费附加 = 基数 × 3%
const educationTax = computed(() => {
  const base = surtaxBase.value
  if (base === 0) return '0.00'
  if (monthlyExemption.value) return '0.00'
  let tax = base * 0.03
  if (halfExemption.value) tax = tax / 2
  return roundToTwo(tax).toFixed(2)
})

// 地方教育附加 = 基数 × 2%
const localEducationTax = computed(() => {
  const base = surtaxBase.value
  if (base === 0) return '0.00'
  if (monthlyExemption.value) return '0.00'
  let tax = base * 0.02
  if (halfExemption.value) tax = tax / 2
  return roundToTwo(tax).toFixed(2)
})

// 附加合计
const totalSurtax = computed(() => {
  const c = parseFloat(cityTax.value) || 0
  const e = parseFloat(educationTax.value) || 0
  const l = parseFloat(localEducationTax.value) || 0
  return (c + e + l).toFixed(2)
})

// 监听输入变化重新计算（只是触发computed更新）
watch([actualVAT, actualConsumptionTax, halfExemption, monthlyExemption, selectedLocation], () => {
  // 触发计算
})

// =============================================================
//  3. 状态管理
// =============================================================

const statusText = ref('就绪')
const statusClass = ref('idle')

// 初始化状态
updateStatus()
</script>

<style scoped lang="scss">
.app-container {
  font-family: 'Segoe UI', 'PingFang SC', Roboto, 'Helvetica Neue', sans-serif;
  color: #2c3e50;
  max-width: 2000px;
  margin: 0 auto;
}

/* ========== 头部 ========== */
.app-header {
  background: linear-gradient(135deg, #1a3a5c, #2a5f8f);
  color: #fff;
  padding: 24px 28px;
  border-radius: 16px;
  margin-top: 5px;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(26, 58, 92, 0.25);
}

.app-header-inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.header-sub {
  font-size: 15px;
  font-weight: 400;
  opacity: 0.85;
  background: rgba(255, 255, 255, 0.12);
  padding: 4px 16px;
  border-radius: 20px;
}

/* ========== 双栏布局 ========== */
.converter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 6px;
}

@media (max-width: 900px) {
  .converter-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

/* ========== 卡片 ========== */
.card {
  border: 1px solid #e9eef3;
  transition: border-color 0.2s, box-shadow 0.2s;

  :deep(.el-card__header) {
    padding: 18px 24px 0 24px;
    border-bottom: none;
  }

  :deep(.el-card__body) {
    padding: 16px 24px 24px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;

    .card-icon {
      font-size: 22px;
      color: #2a5c8a;
    }

    h3 {
      font-size: 17px;
      font-weight: 600;
      color: #0a1a2b;
      margin: 0;
    }

    .card-badge {
      font-size: 11px;
      font-weight: 600;
      color: #2a5c8a;
      background: #e8f0fe;
      padding: 2px 10px;
      border-radius: 12px;
      margin-left: auto;
      letter-spacing: 0.5px;
    }
  }
}

/* ========== 表单通用 ========== */
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #3d4f66;
  margin-bottom: 6px;
}

/* ========== 税率选择 ========== */
.rate-group {
  margin-bottom: 18px;

  .rate-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 6px;
  }

  .rate-btn {
    padding: 6px 18px;
    font-size: 14px;
    font-weight: 500;
    border: 1.5px solid #dce3ec;
    border-radius: 20px;
    background: #fff;
    color: #3d4f66;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      border-color: #8ab3d6;
      background: #f5f9ff;
    }

    &.active {
      border-color: #1a3f62;
      background: #1a3f62;
      color: #fff;
      box-shadow: 0 2px 8px rgba(26, 63, 98, 0.2);
    }

    &-custom {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border-style: dashed;

      &.active {
        border-style: solid;
      }
    }
  }

  .custom-rate-input {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
    padding: 8px 12px;
    background: #f6f9fc;
    border-radius: 10px;

    .rate-hint {
      font-size: 12px;
      color: #8a9bb0;
    }
  }

  .rate-desc {
    font-size: 13px;
    color: #6b7a8f;
    margin-top: 8px;
    padding: 6px 12px;
    background: #f6f9fc;
    border-radius: 8px;
    min-height: 32px;
    display: flex;
    align-items: center;
  }
}

/* ========== 输入框 ========== */
.input-group {
  margin-bottom: 14px;

  .price-input-wrapper {
    :deep(.el-input-group__prepend) {
      background: #f0f4f9;
      border-color: #dce3ec;
      font-weight: 500;
      color: #2c4a6a;
    }

    :deep(.el-input-group__append) {
      background: #f0f4f9;
      border-color: #dce3ec;
      color: #6b7a8f;
    }

    :deep(.el-input__inner) {
      font-size: 16px;
      padding: 8px;
      height: 46px;
    }
  }
}

/* ========== 结果区 ========== */
.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0 18px;
}

.result-item {
  background: #f8fbfe;
  border-radius: 12px;
  padding: 14px 18px;
  border: 1px solid #e9eef3;
  transition: border-color 0.2s;

  .result-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7a8f;
    margin-bottom: 4px;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;

      &.dot-blue {
        background: #2a5f8f;
      }

      &.dot-orange {
        background: #e68a2e;
      }
    }
  }

  .result-value {
    font-size: 24px;
    font-weight: 600;
    color: #0a1a2b;

    .placeholder {
      color: #b0c4d8;
      font-weight: 400;
      font-size: 18px;
    }
  }

  .result-unit {
    font-size: 12px;
    color: #8a9bb0;
    margin-top: 2px;
  }
}

/* ========== 公式区 ========== */
.formula-box {
  background: #f4f8fc;
  border-radius: 12px;
  padding: 14px 18px;
  border: 1px solid #e2eaf2;
  margin-bottom: 14px;

  .formula-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #3d4f66;
    margin-bottom: 8px;

    .el-icon {
      color: #2a5f8f;
    }
  }

  .formula-content {
    font-size: 14px;
    color: #1e3a5a;
    line-height: 1.8;

    .formula-line {
      padding: 2px 0;
      word-break: break-all;

      strong {
        color: #1a3f62;
        font-weight: 600;
      }

      &.formula-result {
        color: #1a6b4a;
        border-top: 1px dashed #d0dfeb;
        padding-top: 6px;
        margin-top: 4px;
      }
    }

    .formula-placeholder {
      color: #9aaeC4;
      font-size: 13px;
    }
  }
}

/* ========== 示例按钮 ========== */
.example-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px dashed #e2e9f0;

  .label {
    font-size: 13px;
    color: #6b7a8f;
    font-weight: 500;
    margin-right: 4px;
  }

  .example-btn {
    padding: 4px 14px;
    font-size: 13px;
    border-radius: 30px;
    border: 1px solid #dce3ec;
    background: #ffffff;
    color: #2c4a6a;
    cursor: pointer;
    transition: all 0.12s;
    font-weight: 450;

    &:hover {
      background: #eaf0f6;
      border-color: #b8cfe0;
    }
  }
}

/* =============================================================
   右栏：附加税样式
   ============================================================= */

/* 地点选择 */
.location-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.location-btn {
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 500;
  border: 1.5px solid #dce3ec;
  border-radius: 20px;
  background: #fff;
  color: #3d4f66;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    border-color: #8ab3d6;
    background: #f5f9ff;
  }

  &.active {
    border-color: #1a3f62;
    background: #1a3f62;
    color: #fff;
    box-shadow: 0 2px 8px rgba(26, 63, 98, 0.2);
  }

  .loc-rate {
    font-size: 12px;
    opacity: 0.7;
    font-weight: 400;
  }
}

.location-hint {
  font-size: 13px;
  color: #6b7a8f;
  margin-top: 8px;
  padding: 6px 12px;
  background: #f6f9fc;
  border-radius: 8px;
  min-height: 32px;
  display: flex;
  align-items: center;
  gap: 6px;

  .el-icon {
    color: #2a5f8f;
    font-size: 14px;
  }
}

/* 输入行 */
.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;

  .half {
    margin-bottom: 0;
  }

  .optional {
    font-size: 11px;
    color: #9aaeC4;
    font-weight: 400;
  }
}

/* 减免选项 */
.exemption-group {
  background: #f8fafc;
  border-radius: 12px;
  padding: 14px 16px;
  border: 1px solid #e9eef3;
  margin-bottom: 16px;

  .exemption-item {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 4px 0;

    :deep(.el-checkbox) {
      font-size: 13px;
      font-weight: 500;
      color: #1e3a5a;
    }

    .exemption-tag {
      font-size: 11px;
      color: #6b7a8f;
      background: #eef3f9;
      padding: 1px 10px;
      border-radius: 10px;
    }
  }

  .exemption-note {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #b07a3a;
    padding: 3px 6px;
    background: #fdf8ee;
    border-radius: 8px;

    .el-icon {
      font-size: 14px;
    }
  }
}

/* 附加税结果 */
.surtax-result {
  background: #f8fbfe;
  border-radius: 12px;
  padding: 14px 18px;
  border: 1px solid #e9eef3;

  .surtax-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    font-size: 14px;

    &.total {
      border-top: 1px dashed #e2e9f0;
      border-bottom: none;
      margin-top: 4px;
      padding-top: 10px;
      font-weight: 600;
      font-size: 16px;
      color: #1a3f62;
    }

    .surtax-label {
      color: #3d4f66;
    }

    .surtax-tag {
      font-size: 11px;
      padding: 1px 10px;
      border-radius: 10px;
      color: #b07a3a;
      background: #fdf8ee;
    }

    .surtax-value {
      font-weight: 500;
      color: #0a1a2b;
    }
  }
}

/* ========== 页脚 ========== */
.app-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-top: 1px solid #eef3f8;
  padding-top: 12px;

  .text-muted {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    color: #7a8ca0;
  }

  .status-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;

    &.idle {
      background: #c5d2e0;
    }

    &.success {
      background: #1e7b4c;
    }

    &.error {
      background: #c73b3b;
    }
  }
}

/* ========== 响应式微调 ========== */
@media (max-width: 600px) {
  .app-header h1 {
    font-size: 20px;
  }

  .header-sub {
    font-size: 12px;
    padding: 2px 12px;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }

  .input-row {
    grid-template-columns: 1fr;
  }

  .card :deep(.el-card__body) {
    padding: 12px 16px 16px;
  }

  .rate-btn {
    font-size: 12px;
    padding: 4px 12px;
  }

  .result-item .result-value {
    font-size: 20px;
  }
}
</style>