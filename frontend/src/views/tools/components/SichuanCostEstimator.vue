<template>
  <div class="cost-estimator-container">
    <!-- 头部 -->
    <header class="app-header">
      <div class="header-inner">
        <h1>
          <el-icon><Histogram /></el-icon>
          四川省信息化项目费用测算
          <small>TSCSIA 0015-2023</small>
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
            <div class="card-title"><el-icon><Management /></el-icon> 项目基本信息</div>
          </template>
          <el-form label-position="top" size="default">
            <el-form-item label="项目名称">
              <el-input v-model="project.name" placeholder="请输入项目名称" />
            </el-form-item>
            <el-form-item label="测算阶段">
              <el-select v-model="project.phase" placeholder="选择阶段">
                <el-option label="可研/估算" value="feasibility" />
                <el-option label="初设/概算" value="preliminary" />
                <el-option label="预算/招投标" value="budget" />
                <el-option label="结算/审计" value="settlement" />
              </el-select>
              <div class="def-text">不同阶段影响规模变更因子 CF 和各项费率。可研/预算阶段 CF=1.39 ；初设/概算/预算/招投标阶段 CF=1.25 ；结算/审计阶段 CF=1.00</div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 建设费用 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon><Wallet /></el-icon> 建设费用</div>
          </template>

          <!-- 成品软件购置 -->
          <div class="sub-section">
            <div class="sub-title">成品软件购置费</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="软件套数">
                    <el-input-number v-model="cost.software.purchase.count" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="单价 (万元/套)">
                    <el-input-number v-model="cost.software.purchase.unitPrice" :min="0" :step="0.5" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="calc-result">小计：{{ softwarePurchaseTotal.toFixed(2) }} 万元</div>
            </el-form>
          </div>

          <!-- 定制软件开发（功能点法） -->
          <div class="sub-section">
            <div class="sub-title">定制软件开发费（功能点法）</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="ILF 数量">
                    <el-input-number v-model="cost.dev.ilf" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="EIF 数量">
                    <el-input-number v-model="cost.dev.eif" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="重用程度">
                    <el-select v-model="cost.dev.reuse" placeholder="选择">
                      <el-option label="低 (1.0)" :value="1.0" />
                      <el-option label="中 (0.67)" :value="0.67" />
                      <el-option label="高 (0.33)" :value="0.33" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="应用类型调整 ST">
                    <el-select v-model="cost.dev.st" placeholder="选择">
                      <el-option label="业务处理 1.0" :value="1.0" />
                      <el-option label="科技/集成 1.2" :value="1.2" />
                      <el-option label="多媒体 1.3" :value="1.3" />
                      <el-option label="智能信息 1.5" :value="1.5" />
                      <el-option label="系统 1.7" :value="1.7" />
                      <el-option label="通信控制 1.9" :value="1.9" />
                      <el-option label="流程控制 2.0" :value="2.0" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="非功能因子 NF">
                    <el-input-number v-model="cost.dev.nf" :min="0.9" :max="1.1" :step="0.025" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="开发平台 SL">
                    <el-select v-model="cost.dev.sl" placeholder="选择">
                      <el-option label="C/C++ 1.5" :value="1.5" />
                      <el-option label="Python/Go 1.2" :value="1.2" />
                      <el-option label="Java/C# 1.0" :value="1.0" />
                      <el-option label="PHP/JS 0.8" :value="0.8" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="团队背景 DT">
                    <el-select v-model="cost.dev.dt" placeholder="选择">
                      <el-option label="同类经验 0.8" :value="0.8" />
                      <el-option label="相关经验 1.0" :value="1.0" />
                      <el-option label="无经验 1.2" :value="1.2" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="人月单价 (万元/人月)">
                    <el-input-number v-model="cost.dev.rate" :min="0" :step="0.1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="人月折算 (人时/人月)">
                    <el-input-number v-model="cost.dev.hm" :min="1" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="calc-result">
                预估 UFP = {{ devUFP.toFixed(0) }} FP &nbsp;|&nbsp;
                调整后规模 = {{ devS.toFixed(0) }} FP &nbsp;|&nbsp;
                软件开发费 = {{ devCost.toFixed(2) }} 万元
              </div>
            </el-form>
          </div>

          <!-- 数据建设费 (简略) -->
          <div class="sub-section">
            <div class="sub-title">数据建设费</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="数据资源购置 (万元)">
                    <el-input-number v-model="cost.data.purchase" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="数据服务购置 (万元)">
                    <el-input-number v-model="cost.data.service" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="数据资源建库 (万元)">
                    <el-input-number v-model="cost.data.build" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="数据加工 (万元)">
                    <el-input-number v-model="cost.data.process" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="calc-result">数据建设费合计：{{ dataTotal.toFixed(2) }} 万元</div>
            </el-form>
          </div>

          <!-- 系统集成费 -->
          <div class="sub-section">
            <div class="sub-title">系统集成费</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="集成对象总费用 (万元)">
                    <el-input-number v-model="cost.integration.base" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="集成费率 (%)">
                    <el-input-number v-model="cost.integration.rate" :min="0" :max="10" :step="0.5" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="调整系数">
                    <el-input-number v-model="cost.integration.adjust" :min="0.6" :max="1.2" :step="0.1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="calc-result">系统集成费：{{ integrationCost.toFixed(2) }} 万元</div>
            </el-form>
          </div>

          <!-- 标准规范编制费 -->
          <div class="sub-section">
            <div class="sub-title">标准规范编制费</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="编制工作量 (人月)">
                    <el-input-number v-model="cost.standard.workload" :min="0" :step="0.5" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="人月单价 (万元/人月)">
                    <el-input-number v-model="cost.standard.rate" :min="0" :step="0.1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="calc-result">标准规范编制费：{{ standardCost.toFixed(2) }} 万元</div>
            </el-form>
          </div>

          <!-- 系统迁移费 -->
          <div class="sub-section">
            <div class="sub-title">系统迁移费</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="迁移工作量 (人月)">
                    <el-input-number v-model="cost.migration.workload" :min="0" :step="0.5" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="人月单价 (万元/人月)">
                    <el-input-number v-model="cost.migration.rate" :min="0" :step="0.1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="calc-result">系统迁移费：{{ migrationCost.toFixed(2) }} 万元</div>
            </el-form>
          </div>

          <!-- 建设费用汇总 -->
          <div class="total-section">
            <div class="total-label">建设费用合计</div>
            <div class="total-value">{{ constructionTotal.toFixed(2) }} 万元</div>
          </div>
        </el-card>

        <!-- 购买服务费用 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon><ShoppingCart /></el-icon> 购买服务费用</div>
          </template>
          <div class="sub-section">
            <div class="sub-title">购买信息化产品服务</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="产品单价 (万元)">
                    <el-input-number v-model="cost.service.product.unitPrice" :min="0" :step="0.5" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="数量">
                    <el-input-number v-model="cost.service.product.count" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="折旧年限">
                    <el-input-number v-model="cost.service.product.depreciation" :min="1" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="服务期 (年)">
                    <el-input-number v-model="cost.service.product.serviceYears" :min="1" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="calc-result">购买产品服务费：{{ productServiceCost.toFixed(2) }} 万元</div>
            </el-form>
          </div>

          <div class="sub-section">
            <div class="sub-title">购买信息系统服务</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="建设投资 (万元)">
                    <el-input-number v-model="cost.service.system.investment" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="总运维费 (万元)">
                    <el-input-number v-model="cost.service.system.maintenance" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="经济性系数">
                    <el-input-number v-model="cost.service.system.economy" :min="0" :max="0.5" :step="0.05" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="投资回报率 i (%)">
                    <el-input-number v-model="cost.service.system.roi" :min="0" :max="10" :step="0.5" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="折现率 c (%)">
                    <el-input-number v-model="cost.service.system.discount" :min="0" :max="5" :step="0.1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="使用期限 N (年)">
                    <el-input-number v-model="cost.service.system.term" :min="1" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="calc-result">信息系统服务年均费 ≈ {{ systemServiceCost.toFixed(2) }} 万元</div>
            </el-form>
          </div>

          <!-- 购买服务费汇总 -->
          <div class="total-section">
            <div class="total-label">购买服务费合计</div>
            <div class="total-value">{{ purchaseServiceTotal.toFixed(2) }} 万元</div>
          </div>
        </el-card>

        <!-- 运维费用 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon><Tools /></el-icon> 运维费用</div>
          </template>
          <div class="sub-section">
            <div class="sub-title">IT 资产系数法</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="机房建设费用 (万元)">
                    <el-input-number v-model="cost.ops.infrastructure.room" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="硬件设备购置费 (万元)">
                    <el-input-number v-model="cost.ops.hardware.purchase" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="软件产品购置费 (万元)">
                    <el-input-number v-model="cost.ops.software.purchase" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="定制软件开发费 (万元)">
                    <el-input-number v-model="cost.ops.software.dev" :min="0" :step="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="运维费率 (综合 %)">
                    <el-input-number v-model="cost.ops.rate" :min="0" :max="10" :step="0.5" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="规模调整系数">
                    <el-input-number v-model="cost.ops.scaleFactor" :min="0.5" :max="1" :step="0.1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <!-- 运维年费汇总 -->
          <div class="total-section">
            <div class="total-label">运维年费合计</div>
            <div class="total-value">{{ opsCost.toFixed(2) }} 万元</div>
          </div>
        </el-card>

        <!-- 其他费用与预备费 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon><More /></el-icon> 其他费用 & 预备费</div>
          </template>
          <div class="sub-section">
          <el-form label-position="top" size="default">
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="项目建设其他费用 (万元)">
                  <el-input-number v-model="cost.other.managementFee" :min="0" :step="1" style="width:100%;" />
                  <div class="def-text">包括管理费、咨询、监理、测评等</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="预备费费率 (%)">
                  <el-input-number v-model="cost.other.contRate" :min="0" :max="5" :step="0.5" style="width:100%;" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          </div>

          <!-- 预备费汇总 -->
          <div class="total-section">
            <div class="total-label">预备费合计</div>
            <div class="total-value">{{ contingencyCost.toFixed(2) }} 万元</div>
          </div>
        </el-card>

        <div class="header-actions">
          <el-button class="opt_btn" size="large" type="primary" @click="loadExample">
            <el-icon>
              <Warning />
            </el-icon><span>示例</span>
          </el-button>
          <el-button class="opt_btn" size="large" @click="resetAll">
            <el-icon>
              <Refresh />
            </el-icon><span>清空</span>
          </el-button>
        </div>
      </div>

      <!-- 右栏：结果汇总与过程 -->
      <div class="right-panel">
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon><Flag /></el-icon> 测算汇总</div>
          </template>
          <div class="result-block">
            <div class="result-row">
              <span class="label">项目名称</span>
              <span class="value">{{ project.name || '(未命名)' }}</span>
            </div>
            <div class="result-row">
              <span class="label">测算阶段</span>
              <span class="value">{{ project.phaseLabel }}</span>
            </div>
            <div class="result-row">
              <span class="label">建设费用</span>
              <span class="value">{{ constructionTotal.toFixed(2) }} 万元</span>
            </div>
            <div class="result-row">
              <span class="label">购买服务费</span>
              <span class="value">{{ purchaseServiceTotal.toFixed(2) }} 万元</span>
            </div>
            <div class="result-row">
              <span class="label">运维年费</span>
              <span class="value">{{ opsCost.toFixed(2) }} 万元</span>
            </div>
            <div class="result-row">
              <span class="label">其他费用</span>
              <span class="value">{{ cost.other.managementFee.toFixed(2) }} 万元</span>
            </div>
            <div class="result-row highlight">
              <span class="label">预备费</span>
              <span class="value">{{ contingencyCost.toFixed(2) }} 万元</span>
            </div>
            <div class="result-row total">
              <span class="label">项目总投资</span>
              <span class="value">{{ totalInvestment.toFixed(2) }} 万元</span>
            </div>
          </div>
        </el-card>

        <!-- 详细计算过程（简略展示关键公式） -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon><TrendCharts /></el-icon> 计算过程</div>
          </template>
          <div class="process-step">
            <div class="step">
              <span class="label">① 定制开发软件费（功能点法）</span><br>
              <span class="formula">UFP = 35×ILF + 15×EIF = {{ devUFP.toFixed(0) }}</span><br>
              <span class="formula">CF = {{ devCF }}</span><br>
              <span class="formula">S = UFP × CF × 重用 = {{ devS.toFixed(0) }}</span><br>
              <span class="formula">SWF = ST × NF × SL × DT = {{ devSWF.toFixed(3) }}</span><br>
              <span class="formula">工作量 = S × PDR(中间值) × SWF / HM = {{ devWorkload.toFixed(0) }} 人月</span><br>
              <span class="formula">开发费 = 工作量 × 人月单价 = {{ devCost.toFixed(2) }} 万元</span>
            </div>
            <div class="step">
              <span class="label">② 系统集成费</span><br>
              <span class="formula">集成费 = 集成对象总费用 × 集成费率 × 调整系数</span><br>
              <span class="calc">= {{ cost.integration.base }} × {{ cost.integration.rate }}% × {{ cost.integration.adjust }} = {{ integrationCost.toFixed(2) }} 万元</span>
            </div>
            <div class="step">
              <span class="label">③ 预备费</span><br>
              <span class="formula">预备费 = (建设费用 + 其他费用) × 预备费费率</span><br>
              <span class="calc">= ({{ constructionTotal.toFixed(2) }} + {{ cost.other.managementFee }}) × {{ cost.other.contRate }}% = {{ contingencyCost.toFixed(2) }} 万元</span>
            </div>
          </div>
        </el-card>

        <div class="header-actions">
          <el-button class="opt_btn" size="large" type="success" plain @click="exportCSV">
            <el-icon>
              <Download />
            </el-icon><span>导出表格(csv)</span>
          </el-button>
          <el-button class="opt_btn" size="large" type="primary" plain @click="exportPDF">
            <el-icon>
              <Printer />
            </el-icon><span>导出报告(pdf)</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Histogram, Download, Management, Wallet, ShoppingCart, Tools, More,
  Flag, TrendCharts, Warning, Refresh
} from '@element-plus/icons-vue'

export default {
  name: 'CostEstimator',
  components: {
    Histogram, Download, Management, Wallet, ShoppingCart, Tools, More,
    Flag, TrendCharts, Warning, Refresh
  },
  setup() {
    // ---------- 响应式数据 ----------
    const project = ref({
      name: '示例项目',
      phase: 'preliminary'
    })

    // 成本明细
    const cost = ref({
      software: {
        purchase: { count: 2, unitPrice: 15 } // 套, 万元/套
      },
      dev: {
        ilf: 20,
        eif: 8,
        reuse: 0.67,
        st: 1.0,
        nf: 1.0,
        sl: 1.0,
        dt: 0.8,
        rate: 2.0,      // 万元/人月
        hm: 174         // 人时/人月
      },
      data: {
        purchase: 5,    // 数据资源购置
        service: 3,     // 数据服务
        build: 4,       // 建库
        process: 2      // 加工
      },
      integration: {
        base: 120,      // 集成对象总费用
        rate: 5,        // %
        adjust: 1.0
      },
      standard: {
        workload: 3,
        rate: 2.0
      },
      migration: {
        workload: 4,
        rate: 2.0
      },
      service: {
        product: {
          unitPrice: 8,
          count: 3,
          depreciation: 5,
          serviceYears: 2
        },
        system: {
          investment: 800,
          maintenance: 200,
          economy: 0.5,
          roi: 8,
          discount: 3.65,
          term: 5
        }
      },
      ops: {
        infrastructure: { room: 100 },
        hardware: { purchase: 150 },
        software: { purchase: 50, dev: 300 },
        rate: 6,            // 综合费率 %
        scaleFactor: 0.9
      },
      other: {
        managementFee: 45,  // 其他费用
        contRate: 3         // 预备费费率 %
      }
    })

    // ---------- 计算属性 ----------
    // 阶段对应的 CF
    const cfMap = {
      feasibility: 1.39,
      preliminary: 1.25,
      budget: 1.25,
      settlement: 1.0
    }
    const devCF = computed(() => cfMap[project.value.phase] || 1.25)

    // 成品软件购置
    const softwarePurchaseTotal = computed(() => {
      return cost.value.software.purchase.count * cost.value.software.purchase.unitPrice
    })

    // 定制开发
    const devUFP = computed(() => {
      return 35 * cost.value.dev.ilf + 15 * cost.value.dev.eif
    })
    const devS = computed(() => {
      return devUFP.value * devCF.value * cost.value.dev.reuse
    })
    const devSWF = computed(() => {
      return cost.value.dev.st * cost.value.dev.nf * cost.value.dev.sl * cost.value.dev.dt
    })
    // 采用中间值 PDR = 7.16 人时/FP，来自 CSBMK（这里简化）
    const PDR_MID = 7.16
    const devWorkload = computed(() => {
      return (devS.value * PDR_MID * devSWF.value) / cost.value.dev.hm
    })
    const devCost = computed(() => {
      return devWorkload.value * cost.value.dev.rate
    })

    // 数据建设
    const dataTotal = computed(() => {
      const d = cost.value.data
      return d.purchase + d.service + d.build + d.process
    })

    // 系统集成
    const integrationCost = computed(() => {
      return cost.value.integration.base * (cost.value.integration.rate / 100) * cost.value.integration.adjust
    })

    // 标准规范
    const standardCost = computed(() => {
      return cost.value.standard.workload * cost.value.standard.rate
    })

    // 系统迁移
    const migrationCost = computed(() => {
      return cost.value.migration.workload * cost.value.migration.rate
    })

    // 建设费用合计（包含：成品软件、开发、数据、集成、标准、迁移）
    const constructionTotal = computed(() => {
      return softwarePurchaseTotal.value + devCost.value + dataTotal.value +
             integrationCost.value + standardCost.value + migrationCost.value
    })

    // 购买产品服务
    const productServiceCost = computed(() => {
      const p = cost.value.service.product
      return (p.unitPrice * p.count / p.depreciation) * p.serviceYears
    })

    // 购买信息系统服务（年均）
    const systemServiceCost = computed(() => {
      const s = cost.value.service.system
      if (s.term <= 0) return 0
      const base = (s.investment + s.maintenance) * s.economy * (1 + s.roi / 100)
      // 简化为年均，折现忽略（实际应逐期折现，此处取简单平均）
      return base / s.term
    })

    const purchaseServiceTotal = computed(() => {
      return productServiceCost.value + systemServiceCost.value
    })

    // 运维费用
    const opsCost = computed(() => {
      const ops = cost.value.ops
      const base = ops.infrastructure.room * 0.04 +
                   ops.hardware.purchase * 0.05 +
                   ops.software.purchase * 0.05 +
                   ops.software.dev * 0.08
      return base * (ops.rate / 6) * ops.scaleFactor  // 按综合费率调整
    })

    // 预备费
    const contingencyCost = computed(() => {
      return (constructionTotal.value + cost.value.other.managementFee) * (cost.value.other.contRate / 100)
    })

    // 总投资
    const totalInvestment = computed(() => {
      return constructionTotal.value + cost.value.other.managementFee + contingencyCost.value
    })

    // ---------- 辅助 ----------
    const phaseLabelMap = {
      feasibility: '可研/估算',
      preliminary: '初设/概算',
      budget: '预算/招投标',
      settlement: '结算/审计'
    }
    project.value.phaseLabel = phaseLabelMap[project.value.phase] || ''

    // ---------- 方法 ----------
    function loadExample() {
      // 加载一组示例数据
      project.value.name = '示例项目'
      project.value.phase = 'preliminary'
      cost.value.software.purchase.count = 3
      cost.value.software.purchase.unitPrice = 12
      cost.value.dev.ilf = 30
      cost.value.dev.eif = 12
      cost.value.dev.reuse = 0.67
      cost.value.dev.st = 1.0
      cost.value.dev.nf = 1.0
      cost.value.dev.sl = 1.0
      cost.value.dev.dt = 0.8
      cost.value.dev.rate = 2.0
      cost.value.dev.hm = 174
      cost.value.data.purchase = 8
      cost.value.data.service = 5
      cost.value.data.build = 6
      cost.value.data.process = 3
      cost.value.integration.base = 200
      cost.value.integration.rate = 5
      cost.value.integration.adjust = 1.0
      cost.value.standard.workload = 4
      cost.value.standard.rate = 2.0
      cost.value.migration.workload = 5
      cost.value.migration.rate = 2.0
      cost.value.service.product.unitPrice = 10
      cost.value.service.product.count = 4
      cost.value.service.product.depreciation = 5
      cost.value.service.product.serviceYears = 3
      cost.value.service.system.investment = 1200
      cost.value.service.system.maintenance = 300
      cost.value.service.system.economy = 0.5
      cost.value.service.system.roi = 8
      cost.value.service.system.discount = 3.65
      cost.value.service.system.term = 5
      cost.value.ops.infrastructure.room = 150
      cost.value.ops.hardware.purchase = 200
      cost.value.ops.software.purchase = 80
      cost.value.ops.software.dev = 400
      cost.value.ops.rate = 6
      cost.value.ops.scaleFactor = 0.9
      cost.value.other.managementFee = 60
      cost.value.other.contRate = 3
      ElMessage.success('示例数据已加载')
    }

    function resetAll() {
      project.value.name = ''
      project.value.phase = 'preliminary'
      cost.value.software.purchase.count = 0
      cost.value.software.purchase.unitPrice = 0
      cost.value.dev.ilf = 0
      cost.value.dev.eif = 0
      cost.value.dev.reuse = 0.67
      cost.value.dev.st = 1.0
      cost.value.dev.nf = 1.0
      cost.value.dev.sl = 1.0
      cost.value.dev.dt = 0.8
      cost.value.dev.rate = 2.0
      cost.value.dev.hm = 174
      cost.value.data.purchase = 0
      cost.value.data.service = 0
      cost.value.data.build = 0
      cost.value.data.process = 0
      cost.value.integration.base = 0
      cost.value.integration.rate = 5
      cost.value.integration.adjust = 1.0
      cost.value.standard.workload = 0
      cost.value.standard.rate = 2.0
      cost.value.migration.workload = 0
      cost.value.migration.rate = 2.0
      cost.value.service.product.unitPrice = 0
      cost.value.service.product.count = 0
      cost.value.service.product.depreciation = 5
      cost.value.service.product.serviceYears = 1
      cost.value.service.system.investment = 0
      cost.value.service.system.maintenance = 0
      cost.value.service.system.economy = 0.5
      cost.value.service.system.roi = 8
      cost.value.service.system.discount = 3.65
      cost.value.service.system.term = 1
      cost.value.ops.infrastructure.room = 0
      cost.value.ops.hardware.purchase = 0
      cost.value.ops.software.purchase = 0
      cost.value.ops.software.dev = 0
      cost.value.ops.rate = 6
      cost.value.ops.scaleFactor = 1.0
      cost.value.other.managementFee = 0
      cost.value.other.contRate = 3
      ElMessage.success('已清空所有数据')
    }

    // 导出PDF（占位功能，可对接打印或html2canvas）
    function exportPDF() {
      ElMessage.info('PDF 导出功能待集成（可接入 html2canvas + jsPDF）')
    }

    return {
      project,
      cost,
      softwarePurchaseTotal,
      devUFP,
      devCF,
      devS,
      devSWF,
      devWorkload,
      devCost,
      dataTotal,
      integrationCost,
      standardCost,
      migrationCost,
      constructionTotal,
      productServiceCost,
      systemServiceCost,
      purchaseServiceTotal,
      opsCost,
      contingencyCost,
      totalInvestment,
      loadExample,
      resetAll,
      exportPDF
    }
  }
}
</script>

<style scoped>
.cost-estimator-container {
  font-family: 'Segoe UI', 'PingFang SC', Roboto, 'Helvetica Neue', sans-serif;
  color: #2c3e50;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 12px;
}

/* 移动端适配等 (原样保留) */
@media (max-width: 768px) {
  .cost-estimator-container {
    padding: 0 6px;
  }

  .app-header {
    padding: 16px 20px;
  }

  .app-header h1 {
    font-size: 22px;
    flex-wrap: wrap;
  }

  .app-header h1 small {
    font-size: 14px;
    margin-left: 0;
    display: block;
  }

  .header-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  .opt_btn {
    flex: 1;
    min-width: 120px;
    gap: 8px;
  }

  .main-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .result-grid {
    grid-template-columns: 1fr 1fr;
  }

  .el-card {
    margin-bottom: 12px;
  }

  .card-title {
    gap: 8px;
    display: flex;
    align-items: center;
    font-size: 16px;
    color: #1a3a5c;
  }

  .card-sub-title {
    gap: 8px;
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: #1a3a5c;
    margin: 8px 0 8px 0;
  }

  .def-text {
    font-size: 12px;
    color: #6a7a8a;
  }

  .el-input-number {
    width: 100% !important;
  }

  .el-col {
    padding: 0 4px;
  }
}

.app-header {
  background: linear-gradient(135deg, #1a3a5c, #2a5f8f);
  color: #fff;
  padding: 24px 28px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(26, 58, 92, 0.25);
}

.header-inner {
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
  .main-grid {
    grid-template-columns: 1fr;
  }
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

.card-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 600;
  color: #1a3a5c;
}

.sub-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #eaeef3;
}

.sub-section:last-child {
  border-bottom: none;
}

.sub-title {
  font-weight: 600;
  font-size: 15px;
  color: #2a5f8f;
  margin-bottom: 12px;
}

.def-text {
  font-size: 12px;
  color: #6a7a8a;
  margin-bottom: 8px;
}

.calc-result {
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  color: #1a3a5c;
  margin-top: 8px;
  font-weight: 500;
}

.total-section {
  background: #f0f4fa;
  border-radius: 8px;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.total-label {
  font-weight: 600;
  font-size: 16px;
  color: #1a3a5c;
}

.total-value {
  font-size: 20px;
  font-weight: 700;
  color: #c0392b;
}

.action-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.action-bar .el-button {
  flex: 1;
  min-width: 120px;
}

.result-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #f0f2f5;
}

.result-row .label {
  color: #6a7a8a;
  font-weight: 500;
}

.result-row .value {
  font-weight: 600;
  color: #2c3e50;
}

.result-row.highlight .value {
  color: #e67e22;
}

.result-row.total .value {
  font-size: 20px;
  color: #c0392b;
}

.process-step {
  font-size: 14px;
  line-height: 1.7;
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
</style>