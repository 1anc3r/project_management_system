<template>
  <div class="cost-estimator-container">
    <!-- 头部 -->
    <header class="app-header" ref="headerRef">
      <div class="app-header-inner">
        <h1>
          <el-icon>
            <Histogram />
          </el-icon>
          成都市信息化项目运维费用测算
          <small>DB5101/T 6—2018</small>
        </h1>
      </div>
    </header>

    <!-- 主内容：左右布局 -->
    <div class="main-grid">
      <!-- 左栏：输入表单 -->
      <div class="left-panel">
        <!-- 项目基本信息 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon><Management /></el-icon>项目基本信息</div>
          </template>
          <el-form label-position="top" size="default">
            <el-form-item label="项目名称">
              <el-input v-model="projectName" />
            </el-form-item>
            <el-form-item label="规模变更因子 (CF)">
              <el-input-number v-model="cf" :min="1" :max="2" :step="0.01" controls-position="right" style="width:100%;" />
              <div class="def-text">已交付项目通常取 1，未确定项目可调整（1~2）</div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 功能点计数 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon><List /></el-icon>功能点计数</div>
          </template>
          <div class="def-text">
            按预估功能点方法，仅需统计 ILF（内部逻辑文件）与 EIF（外部接口文件）总数。<br>
            公式：UFP = 35 × ILF + 15 × EIF
          </div>
          <el-row :gutter="12">
            <el-col :xs="12" :sm="12">
              <el-form-item label="ILF 数量">
                <el-input-number v-model="ilf" :min="0" :step="1" controls-position="right" style="width:100%;" />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :sm="12">
              <el-form-item label="EIF 数量">
                <el-input-number v-model="eif" :min="0" :step="1" controls-position="right" style="width:100%;" />
              </el-form-item>
            </el-col>
          </el-row>
          <div class="formula-text">
            <span><strong>UFP</strong> = 35 × {{ ilf }} + 15 × {{ eif }} = <span class="high-light-text">{{ ufp }}</span> FP</span>
            <span><strong>S</strong> = UFP × CF = {{ ufp }} × {{ cf }} = <span class="high-light-text">{{ s }}</span> FP</span>
          </div>
        </el-card>

        <!-- 运维调整因子 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon><HelpFilled /></el-icon>运维调整因子</div>
          </template>

          <!-- MLF -->
          <div class="sub-title"><el-icon><Odometer /></el-icon>运维水平要求 (MLF)</div>
          <el-form label-position="top" size="default">
            <el-form-item label="系统更新频率">
              <el-select v-model="updateFreq" placeholder="选择更新频率">
                <el-option label="平均每季度1次或以下" :value="0.95" />
                <el-option label="平均每月1次或以下" :value="1.00" />
                <el-option label="超过每月1次" :value="1.12" />
              </el-select>
            </el-form-item>
            <el-form-item label="支持方式">
              <el-select v-model="supportMode" placeholder="选择支持方式">
                <el-option label="非现场支持为主" :value="0.89" />
                <el-option label="现场支持为主" :value="1.00" />
                <el-option label="纯现场支持" :value="1.08" />
              </el-select>
            </el-form-item>
            <div class="formula-text">
              <span><strong>MLF</strong> = {{ updateFreq }} × {{ supportMode }} = <span class="high-light-text">{{ mlf }}</span></span>
            </div>
          </el-form>

          <!-- MCF -->
          <div class="sub-title"><el-icon><Avatar /></el-icon>运维能力 (MCF)</div>
          <el-form label-position="top" size="default">
            <el-form-item label="运维团队经验">
              <el-select v-model="teamExp" placeholder="选择团队经验">
                <el-option label="本行业做过类似项目" :value="0.80" />
                <el-option label="其他行业类似 / 本行业相关" :value="1.00" />
                <el-option label="没有同类项目背景" :value="1.20" />
              </el-select>
            </el-form-item>
            <div class="formula-text">
              <span><strong>MCF</strong> = <span class="high-light-text">{{ mcf }}</span></span>
            </div>
          </el-form>

          <!-- MSF -->
          <div class="sub-title"><el-icon><Connection /></el-icon>运维系统特征 (MSF)</div>
          <el-form label-position="top" size="default">
            <el-row :gutter="12">
              <el-col :xs="12" :sm="12">
                <el-form-item label="部署方式">
                  <el-select v-model="deploy" placeholder="选择">
                    <el-option label="集中式" :value="1.00" />
                    <el-option label="分布式" :value="1.06" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="12">
                <el-form-item label="业务新颖性">
                  <el-select v-model="novelty" placeholder="选择">
                    <el-option label="否" :value="0.96" />
                    <el-option label="新产品或新业务" :value="1.00" />
                    <el-option label="新产品与新业务" :value="1.09" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="12">
                <el-form-item label="用户规模">
                  <el-select v-model="userScale" placeholder="选择">
                    <el-option label="≤ 1000" :value="0.90" />
                    <el-option label="≤ 10000" :value="1.00" />
                    <el-option label="＞ 10000" :value="1.10" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="12">
                <el-form-item label="系统关联性">
                  <el-select v-model="sysRelation" placeholder="选择">
                    <el-option label="无" :value="0.97" />
                    <el-option label="1~5 个系统" :value="1.00" />
                    <el-option label="6 个及以上" :value="1.14" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="12">
                <el-form-item label="业务单元数">
                  <el-select v-model="bizUnits" placeholder="选择">
                    <el-option label="1~5 个" :value="0.96" />
                    <el-option label="5~10 个" :value="1.00" />
                    <el-option label="11 个以上" :value="1.05" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="formula-text">
              <span><strong>MSF</strong> = {{ deploy }} × {{ novelty }} × {{ userScale }} × {{ sysRelation }} × {{ bizUnits }} = <span class="high-light-text">{{ msf }}</span></span>
            </div>
          </el-form>
        </el-card>

        <!-- 直接非人力成本 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon><Briefcase /></el-icon>直接非人力成本 (DNC)</div>
          </template>
          <el-form label-position="top" size="default">
            <el-row :gutter="12">
              <el-col :xs="12" :sm="12"><el-form-item label="办公费"><el-input-number v-model="dncOffice" :min="0" :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
              <el-col :xs="12" :sm="12"><el-form-item label="差旅费"><el-input-number v-model="dncTravel" :min="0" :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
              <el-col :xs="12" :sm="12"><el-form-item label="培训费"><el-input-number v-model="dncTrain" :min="0" :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
              <el-col :xs="12" :sm="12"><el-form-item label="业务费"><el-input-number v-model="dncBiz" :min="0" :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
              <el-col :xs="12" :sm="12"><el-form-item label="采购费"><el-input-number v-model="dncProcure" :min="0" :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
              <el-col :xs="12" :sm="12"><el-form-item label="其他"><el-input-number v-model="dncOther" :min="0" :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
            </el-row>
            <div class="formula-text">
              <span><strong>DNC</strong> = <span class="high-light-text">{{ dncTotal }} 元</span></span>
            </div>
          </el-form>
        </el-card>

        <!-- 人力参数 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon><Avatar /></el-icon>人力成本参数</div>
          </template>
          <el-form label-position="top" size="default">
            <el-row :gutter="12">
              <el-col :xs="12" :sm="12">
                <el-form-item label="平均人力成本费率 F (元/人月)">
                  <el-input-number v-model="rateF" :min="0" :step="100" controls-position="right" style="width:100%;" />
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="12">
                <el-form-item label="人月折算系数 HM (人时/人月)">
                  <el-input-number v-model="hm" :min="1" :step="1" controls-position="right" style="width:100%;" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="def-text">默认 F=16900 元/人月，HM=176 人时/人月</div>
          </el-form>
        </el-card>

        <div class="header-actions">
          <el-button class="opt_btn" size="large" type="primary" @click="loadExample">
            <el-icon><Warning /></el-icon><span>示例</span>
          </el-button>
          <el-button class="opt_btn" size="large" @click="resetAll">
            <el-icon><Refresh /></el-icon><span>清空</span>
          </el-button>
        </div>
      </div>

      <!-- 右栏：结果汇总与过程 -->
      <div class="right-panel" ref="exportRef">
        <!-- 结果 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon><Flag /></el-icon>测算结果</div>
          </template>
          <div style="margin-bottom:12px;font-size:14px;color:#4a5b6e;">
            <strong>项目：</strong> {{ projectName || '(未命名)' }} &nbsp;|&nbsp;
            <strong>调整后规模 S：</strong> {{ s.toFixed(2) }} FP
          </div>

          <div class="sub-title"><el-icon><Timer /></el-icon><span>工作量 (人时)</span></div>
          <div class="result-grid">
            <div class="result-item">
              <div class="label">下限 (P25)</div>
              <div class="value">{{ aeLower.toFixed(2) }}</div>
            </div>
            <div class="result-item highlight">
              <div class="label">最有可能 (P50)</div>
              <div class="value">{{ aeMost.toFixed(2) }}</div>
            </div>
            <div class="result-item">
              <div class="label">上限 (P75)</div>
              <div class="value">{{ aeUpper.toFixed(2) }}</div>
            </div>
          </div>

          <div class="sub-title"><el-icon><Money /></el-icon><span>运维费用 (元)</span></div>
          <div class="result-grid">
            <div class="result-item">
              <div class="label">下限</div>
              <div class="value">{{ pLower.toFixed(0) }} <span class="sub">元</span></div>
            </div>
            <div class="result-item highlight">
              <div class="label">最有可能</div>
              <div class="value" style="color:#c0392b;">{{ pMost.toFixed(0) }} <span class="sub">元</span></div>
            </div>
            <div class="result-item">
              <div class="label">上限</div>
              <div class="value">{{ pUpper.toFixed(0) }} <span class="sub">元</span></div>
            </div>
          </div>
          <div style="margin-top:8px;text-align:right;font-size:13px;color:#8a9aa8;">
            运维功能点单价 ≈ {{ (pMost / s).toFixed(0) }} 元/FP &nbsp;|&nbsp; DNC = {{ dncTotal.toFixed(0) }} 元
          </div>
        </el-card>

        <!-- 测算过程 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon><TrendCharts /></el-icon>测算过程</div>
          </template>
          <div class="process-step">
            <div class="step"><span class="label">① 未调整功能点 UFP</span><br>
              <span class="formula">UFP = 35 × ILF + 15 × EIF</span><br>
              <span class="calc">= 35 × {{ ilf }} + 15 × {{ eif }} = {{ ufp }}</span>
            </div>
            <div class="step"><span class="label">② 调整后规模 S</span><br>
              <span class="formula">S = UFP × CF</span><br>
              <span class="calc">= {{ ufp }} × {{ cf }} = {{ s.toFixed(2) }} FP</span>
            </div>
            <div class="step"><span class="label">③ 运维水平要求 MLF</span><br>
              <span class="formula">MLF = 更新频率因子 × 支持方式因子</span><br>
              <span class="calc">= {{ updateFreq }} × {{ supportMode }} = {{ mlf.toFixed(4) }}</span>
            </div>
            <div class="step"><span class="label">④ 运维能力 MCF</span><br>
              <span class="formula">MCF = 团队经验因子</span><br>
              <span class="calc">= {{ mcf.toFixed(2) }}</span>
            </div>
            <div class="step"><span class="label">⑤ 系统特征 MSF</span><br>
              <span class="formula">MSF = 部署方式 × 新颖性 × 用户规模 × 关联性 × 业务单元数</span><br>
              <span class="calc">= {{ deploy }} × {{ novelty }} × {{ userScale }} × {{ sysRelation }} × {{ bizUnits }} = {{ msf.toFixed(4) }}</span>
            </div>
            <div class="step"><span class="label">⑥ 工作量 AE (人时)</span><br>
              <span class="formula">AE = (S × PDR) × MLF × MCF × MSF</span><br>
              <span class="calc">P25: ({{ s.toFixed(2) }} × 3.02) × {{ mlf.toFixed(4) }} × {{ mcf.toFixed(2) }} × {{ msf.toFixed(4) }} = {{ aeLower.toFixed(2) }}</span>
              <span class="calc">P50: ({{ s.toFixed(2) }} × 6.56) × {{ mlf.toFixed(4) }} × {{ mcf.toFixed(2) }} × {{ msf.toFixed(4) }} = {{ aeMost.toFixed(2) }}</span>
              <span class="calc">P75: ({{ s.toFixed(2) }} × 11.42) × {{ mlf.toFixed(4) }} × {{ mcf.toFixed(2) }} × {{ msf.toFixed(4) }} = {{ aeUpper.toFixed(2) }}</span>
            </div>
            <div class="step"><span class="label">⑦ 运维费用 P (元)</span><br>
              <span class="formula">P = AE / HM × F + DNC</span><br>
              <span class="calc">下限: {{ aeLower.toFixed(2) }} / {{ hm }} × {{ rateF }} + {{ dncTotal }} = <strong>{{ pLower.toFixed(0) }}</strong></span>
              <span class="calc">最有可能: {{ aeMost.toFixed(2) }} / {{ hm }} × {{ rateF }} + {{ dncTotal }} = <strong>{{ pMost.toFixed(0) }}</strong></span>
              <span class="calc">上限: {{ aeUpper.toFixed(2) }} / {{ hm }} × {{ rateF }} + {{ dncTotal }} = <strong>{{ pUpper.toFixed(0) }}</strong></span>
            </div>
          </div>
        </el-card>

        <!-- 公式 & 指标定义 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon><QuestionFilled /></el-icon>测算公式 &amp; 指标定义</div>
          </template>
          <el-collapse accordion>
            <el-collapse-item title="规模测算 (功能点)" name="1">
              <div class="formula-block">
                <div><span class="math">UFP = 35 × ILF + 15 × EIF</span></div>
                <div class="def">ILF：内部逻辑文件数量；EIF：外部接口文件数量。</div>
                <div style="margin-top:6px;"><span class="math">S = UFP × CF</span></div>
                <div class="def">CF：规模变更因子，已交付项目取1，未确定项目可调整。</div>
              </div>
            </el-collapse-item>
            <el-collapse-item title="工作量测算" name="2">
              <div class="formula-block">
                <div><span class="math">AE = (S × PDR) × MLF × MCF × MSF</span></div>
                <div class="def">
                  <strong>PDR</strong>：功能点耗时率，取基准 P25=3.02，P50=6.56，P75=11.42 人时/FP<br>
                  <strong>MLF</strong>：运维水平要求调整因子 = 更新频率因子 × 支持方式因子<br>
                  <strong>MCF</strong>：运维能力调整因子（团队经验）<br>
                  <strong>MSF</strong>：运维系统特征调整因子（部署方式、新颖性、用户规模、关联性、业务单元数乘积）
                </div>
              </div>
            </el-collapse-item>
            <el-collapse-item title="费用测算" name="3">
              <div class="formula-block">
                <div><span class="math">P = AE / HM × F + DNC</span></div>
                <div class="def">
                  <strong>P</strong>：运维费用（元）<br>
                  <strong>HM</strong>：人月折算系数，取176人时/人月<br>
                  <strong>F</strong>：平均人力成本费率（元/人月）<br>
                  <strong>DNC</strong>：直接非人力成本（元）
                </div>
              </div>
            </el-collapse-item>
            <el-collapse-item title="调整因子详解" name="4">
              <div class="formula-block" style="font-size:13px;">
                <div><strong>MLF</strong>：系统更新频率（0.95/1.00/1.12）× 支持方式（0.89/1.00/1.08）</div>
                <div><strong>MCF</strong>：团队经验（0.80/1.00/1.20）</div>
                <div><strong>MSF</strong>：部署方式（1.00/1.06）× 业务新颖性（0.96/1.00/1.09）× 用户规模（0.90/1.00/1.10）× 系统关联性（0.97/1.00/1.14）× 业务单元数（0.96/1.00/1.05）</div>
                <div class="def-text">基准数据基于 CSBMK-201610，可随行业数据更新。</div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <div class="header-actions">
          <el-button class="opt_btn" size="large" type="success" plain @click="exportCSV">
            <el-icon><Download /></el-icon><span>导出表格(csv)</span>
          </el-button>
          <el-button class="opt_btn" size="large" type="primary" plain @click="exportPDF">
            <el-icon><Printer /></el-icon><span>导出报告(pdf)</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export default {
  name: 'ChengduMaintenanceCostEstimator',
  setup() {
    const headerRef = ref(null)
    const exportRef = ref(null)

    // --- 输入数据 ---
    const projectName = ref('示例项目')
    const cf = ref(1.0) // 规模变更因子

    // 功能点
    const ilf = ref(30)
    const eif = ref(30)

    // MLF
    const updateFreq = ref(0.95)
    const supportMode = ref(1.00)

    // MCF
    const teamExp = ref(1.00)

    // MSF
    const deploy = ref(1.00)
    const novelty = ref(1.00)
    const userScale = ref(1.00)
    const sysRelation = ref(1.14)
    const bizUnits = ref(1.00)

    // DNC
    const dncOffice = ref(0)
    const dncTravel = ref(0)
    const dncTrain = ref(20000)
    const dncBiz = ref(20000)
    const dncProcure = ref(30000)
    const dncOther = ref(0)

    // 人力参数
    const rateF = ref(16900)
    const hm = ref(176)

    // --- 计算属性 ---
    const ufp = computed(() => 35 * ilf.value + 15 * eif.value)
    const s = computed(() => ufp.value * cf.value)

    const mlf = computed(() => updateFreq.value * supportMode.value)
    const mcf = computed(() => teamExp.value)
    const msf = computed(() => deploy.value * novelty.value * userScale.value * sysRelation.value * bizUnits.value)

    const PDR_P25 = 3.02
    const PDR_P50 = 6.56
    const PDR_P75 = 11.42

    const aeLower = computed(() => s.value * PDR_P25 * mlf.value * mcf.value * msf.value)
    const aeMost = computed(() => s.value * PDR_P50 * mlf.value * mcf.value * msf.value)
    const aeUpper = computed(() => s.value * PDR_P75 * mlf.value * mcf.value * msf.value)

    const dncTotal = computed(() => dncOffice.value + dncTravel.value + dncTrain.value +
      dncBiz.value + dncProcure.value + dncOther.value)

    const pLower = computed(() => (aeLower.value / hm.value) * rateF.value + dncTotal.value)
    const pMost = computed(() => (aeMost.value / hm.value) * rateF.value + dncTotal.value)
    const pUpper = computed(() => (aeUpper.value / hm.value) * rateF.value + dncTotal.value)

    // --- 方法 ---
    function loadExample() {
      projectName.value = '示例项目'
      cf.value = 1.0
      ilf.value = 30
      eif.value = 30
      updateFreq.value = 0.95
      supportMode.value = 1.00
      teamExp.value = 1.00
      deploy.value = 1.00
      novelty.value = 1.00
      userScale.value = 1.00
      sysRelation.value = 1.14
      bizUnits.value = 1.00
      dncOffice.value = 0
      dncTravel.value = 0
      dncTrain.value = 20000
      dncBiz.value = 20000
      dncProcure.value = 30000
      dncOther.value = 0
      rateF.value = 16900
      hm.value = 176
      ElMessage.success('示例数据已加载（参照 T6 附录C）')
    }

    function resetAll() {
      projectName.value = ''
      cf.value = 1.0
      ilf.value = 0
      eif.value = 0
      updateFreq.value = 1.00
      supportMode.value = 1.00
      teamExp.value = 1.00
      deploy.value = 1.00
      novelty.value = 1.00
      userScale.value = 1.00
      sysRelation.value = 1.00
      bizUnits.value = 1.00
      dncOffice.value = 0
      dncTravel.value = 0
      dncTrain.value = 0
      dncBiz.value = 0
      dncProcure.value = 0
      dncOther.value = 0
      rateF.value = 16900
      hm.value = 176
      ElMessage.success('已清空所有数据')
    }

    function exportCSV() {
      const rows = [
        ['项目名称', projectName.value],
        ['规模变更因子 CF', cf.value],
        [''], ['===== 功能点计数 ====='],
        ['ILF', ilf.value], ['EIF', eif.value],
        ['UFP', ufp.value], ['S (调整后规模)', s.value],
        [''], ['===== 调整因子 ====='],
        ['更新频率', updateFreq.value], ['支持方式', supportMode.value],
        ['MLF', mlf.value],
        ['团队经验', teamExp.value], ['MCF', mcf.value],
        ['部署方式', deploy.value], ['业务新颖性', novelty.value],
        ['用户规模', userScale.value], ['系统关联性', sysRelation.value],
        ['业务单元数', bizUnits.value], ['MSF', msf.value],
        [''], ['===== 工作量 & 费用 ====='],
        ['PDR P25', 3.02], ['PDR P50', 6.56], ['PDR P75', 11.42],
        ['AE 下限 (人时)', aeLower.value],
        ['AE 最有可能 (人时)', aeMost.value],
        ['AE 上限 (人时)', aeUpper.value],
        ['P 下限 (元)', pLower.value],
        ['P 最有可能 (元)', pMost.value],
        ['P 上限 (元)', pUpper.value],
        ['DNC 合计 (元)', dncTotal.value],
        ['平均人力成本费率 F (元/人月)', rateF.value],
        ['人月折算系数 HM', hm.value],
        ['功能点单价 (元/FP)', (pMost.value / s.value).toFixed(2)],
      ]
      let csv = '\uFEFF'
      rows.forEach(row => { csv += row.join(',') + '\n' })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `运维费用测算表_${projectName.value || '项目'}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    }

    async function exportPDF() {
      try {
        const headerEl = headerRef.value
        const exportEl = exportRef.value
        if (!headerEl || !exportEl) {
          ElMessage.error('未找到需要导出的组件，请确保页面已完整渲染。')
          return
        }
        const capture = (el) => html2canvas(el, {
          useCORS: true,
          scale: 2,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
        })
        const [headerCanvas, exportCanvas] = await Promise.all([capture(headerEl), capture(exportEl)])
        const targetWidthPx = 1600
        const resizeCanvas = (canvas, targetWidth) => {
          const scale = targetWidth / canvas.width
          const newCanvas = document.createElement('canvas')
          newCanvas.width = targetWidth
          newCanvas.height = canvas.height * scale
          const ctx = newCanvas.getContext('2d')
          ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height)
          return newCanvas
        }
        const resizedHeader = resizeCanvas(headerCanvas, targetWidthPx)
        const resizedExport = resizeCanvas(exportCanvas, targetWidthPx)
        const totalHeight = resizedHeader.height + resizedExport.height
        const mergedCanvas = document.createElement('canvas')
        mergedCanvas.width = targetWidthPx
        mergedCanvas.height = totalHeight
        const ctx = mergedCanvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, targetWidthPx, totalHeight)
        ctx.drawImage(resizedHeader, 0, 0)
        ctx.drawImage(resizedExport, 0, resizedHeader.height)

        const pdf = new jsPDF('p', 'mm', 'a4')
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const scale = pageWidth / mergedCanvas.width
        const displayWidth = pageWidth
        const displayHeight = mergedCanvas.height * scale

        if (displayHeight <= pageHeight) {
          const imgData = mergedCanvas.toDataURL('image/png')
          const y = (pageHeight - displayHeight) / 2
          pdf.addImage(imgData, 'PNG', 0, y, displayWidth, displayHeight)
        } else {
          const pixelsPerPage = pageHeight / scale
          let startY = 0, pageNum = 0
          while (startY < mergedCanvas.height) {
            const endY = Math.min(startY + pixelsPerPage, mergedCanvas.height)
            const pageCanvas = document.createElement('canvas')
            pageCanvas.width = mergedCanvas.width
            pageCanvas.height = endY - startY
            const pageCtx = pageCanvas.getContext('2d')
            pageCtx.drawImage(mergedCanvas, 0, startY, mergedCanvas.width, endY - startY, 0, 0, mergedCanvas.width, endY - startY)
            const imgData = pageCanvas.toDataURL('image/png')
            const pageDisplayHeight = (endY - startY) * scale
            const y = (pageHeight - pageDisplayHeight) / 2
            if (pageNum > 0) pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, y, displayWidth, pageDisplayHeight)
            startY = endY
            pageNum++
          }
        }
        pdf.save(`运维费用测算报告_${projectName.value || '项目'}.pdf`)
        ElMessage.success('PDF导出成功')
      } catch (error) {
        ElMessage.error('PDF导出失败，请查看控制台错误信息。')
      }
    }

    return {
      headerRef,
      exportRef,
      projectName,
      cf,
      ilf,
      eif,
      updateFreq,
      supportMode,
      teamExp,
      deploy,
      novelty,
      userScale,
      sysRelation,
      bizUnits,
      dncOffice,
      dncTravel,
      dncTrain,
      dncBiz,
      dncProcure,
      dncOther,
      rateF,
      hm,
      ufp,
      s,
      mlf,
      mcf,
      msf,
      aeLower,
      aeMost,
      aeUpper,
      dncTotal,
      pLower,
      pMost,
      pUpper,
      loadExample,
      resetAll,
      exportCSV,
      exportPDF,
    }
  }
}
</script>

<style scoped lang="scss">
/* ---------- 与 T5 完全一致的样式 ---------- */
.cost-estimator-container {
  font-family: 'Segoe UI', 'PingFang SC', Roboto, 'Helvetica Neue', sans-serif;
  color: #2c3e50;
  max-width: 2000px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .cost-estimator-container { padding: 0 6px; }
  .app-header { padding: 16px 20px; }
  .app-header-inner { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; }
  .app-header h1 { font-size: 22px; flex-wrap: wrap; }
  .app-header h1 small { font-size: 14px; margin-left: 0; display: block; }
  .header-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  .opt_btn { flex: 1; min-width: 120px; gap: 8px; }
  .main-grid { grid-template-columns: 1fr; gap: 12px; }
  .result-grid { grid-template-columns: 1fr 1fr; }
  .el-card { margin-bottom: 12px; }
  .main-title { gap: 8px; display: flex; align-items: center; font-size: 16px; color: #1a3a5c; }
  .sub-title { gap: 8px; display: flex; align-items: center; font-size: 14px; font-weight: 600; color: #1a3a5c; margin: 8px 0 8px 0; }
  .def-text { font-size: 12px; color: #6a7a8a; }
  .formula-text { background: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-top: 4px; display: flex; justify-content: space-between; flex-wrap: wrap; font-size: 14px; gap: 8px; }
  .high-light-text { color: #c0392b; font-weight: 700; }
  .el-input-number { width: 100% !important; }
  .el-col { padding: 0 4px; }
}

.app-header {
  background: linear-gradient(135deg, #1a3a5c, #2a5f8f);
  color: #fff;
  padding: 24px 28px;
  border-radius: 16px;
  margin-bottom: 24px;
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
}
.app-header h1 small {
  font-size: 16px;
  font-weight: 400;
  opacity: 0.8;
  margin-left: 12px;
}
.app-header .sub {
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.85;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.app-header .sub .badge {
  background: rgba(255,255,255,0.18);
  padding: 2px 14px;
  border-radius: 20px;
  font-size: 12px;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.opt_btn {
  flex: 1;
  min-width: 120px;
  gap: 8px;
}
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 1024px) {
  .main-grid { grid-template-columns: 1fr; }
}
.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card {
  margin-bottom: 0;
}
.card :deep(.el-card__header) {
  padding: 14px 18px;
  border-bottom: 2px solid #eef2f7;
}
.main-title {
  gap: 8px;
  display: inline-flex;
  align-items: center;
  font-size: 17px;
  font-weight: 600;
  color: #1a3a5c;
}
.sub-title {
  gap: 8px;
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  color: #1a3a5c;
  margin: 8px 0 8px 0;
}
.result-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 6px;
}
@media (max-width: 600px) {
  .result-grid { grid-template-columns: 1fr 1fr; }
}
.result-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px 14px;
  border-left: 4px solid #2a5f8f;
}
.result-item .label {
  font-size: 12px;
  color: #7a8a9a;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.result-item .value {
  font-size: 20px;
  font-weight: 700;
  color: #1a3a5c;
  margin-top: 2px;
}
.result-item .value .sub {
  font-size: 12px;
  font-weight: 400;
  color: #6a7a8a;
  margin-left: 4px;
}
.result-item.highlight {
  border-left-color: #e67e22;
}
.result-item.highlight .value {
  color: #c0392b;
}
.process-step {
  font-size: 14px;
  line-height: 2;
}
.step {
  padding: 6px 0;
  border-bottom: 1px dashed #eaeef3;
}
.step .label {
  font-weight: 600;
  color: #1a3a5c;
}
.step .formula {
  color: #4a5b6e;
  font-family: 'Courier New', monospace;
  background: #f0f4fa;
  padding: 0 6px;
  border-radius: 4px;
  display: inline-block;
}
.step .calc {
  color: #2c3e50;
  padding-left: 12px;
  display: block;
  font-size: 12px;
  word-break: break-all;
}
.formula-block {
  background: #f0f4fa;
  border-radius: 10px;
  padding: 14px 18px;
  margin: 8px 0;
  font-size: 14px;
  line-height: 2;
  border-left: 4px solid #2a5f8f;
}
.formula-block .math {
  font-family: 'Courier New', monospace;
  background: #e8edf4;
  padding: 2px 10px;
  border-radius: 4px;
  display: inline-block;
  font-weight: 600;
  color: #1a3a5c;
}
.formula-block .def {
  color: #4a5b6e;
}
.def-text {
  font-size: 12px;
  color: #6a7a8a;
  margin-bottom: 8px;
  line-height: 1.6;
}
.formula-text {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  font-size: 14px;
  gap: 8px;
}
.high-light-text {
  color: #c0392b;
  font-weight: 700;
}
.el-form-item {
  margin-bottom: 8px;
}

/* 打印样式 */
@media print {
  .cost-estimator-container { height: auto !important; overflow: visible !important; }
  .main-grid { display: block !important; }
  .app-header { background: #1a3a5c !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .el-button, .el-card__header .el-button { display: none !important; }
  .card { break-inside: avoid; box-shadow: none !important; }
  .main-grid > div { width: 100%; }
  .result-item { border-left-color: #2a5f8f !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .process-step .step .formula, .formula-block { background: #f0f4fa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cost-estimator-container, .main-grid, .el-card, .process-step, .formula-block { overflow: visible !important; height: auto !important; max-height: none !important; }
}
</style>