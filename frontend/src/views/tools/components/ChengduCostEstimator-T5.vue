<template>
  <div class="cost-estimator-container">
    <!-- 头部 -->
    <header class="app-header" ref="headerRef">
      <div class="app-header-inner">
        <h1>
          <el-icon>
            <Histogram />
          </el-icon>
          成都市信息化项目开发费用测算
          <small>DB5101/T 5—2018</small>
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
            <div class="main-title"><el-icon>
                <Management />
              </el-icon>项目基本信息</div>
          </template>
          <el-form label-position="top" size="default">
            <el-form-item label="项目名称">
              <el-input v-model="projectName" />
            </el-form-item>
            <el-form-item label="测算阶段">
              <el-select v-model="phase" placeholder="选择测算阶段">
                <el-option label="预算" value="budget" />
                <el-option label="招投标" value="bidding" />
              </el-select>
              <div class="def-text">
                预算阶段 CF=1.5 ；招投标阶段 CF=1.26
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 功能点计数 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <List />
              </el-icon>功能点计数</div>
          </template>
          <div class="def-text">
            按复用程度分别统计 ILF（内部逻辑文件）与 EIF（外部接口文件）数量。<br>
            复用度：低(×1) 、中(×2/3) 、高(×1/3)
          </div>
          <el-row :gutter="12">
            <el-col :xs="24" :sm="12">
              <div class="sub-title"><el-icon>
                  <FolderOpened />
                </el-icon><span>ILF</span></div>
              <el-form-item label="复用度低 (×1)">
                <el-input-number v-model="ilfLow" :min="0" :step="1" controls-position="right" style="width:100%;" />
              </el-form-item>
              <el-form-item label="复用度中 (×2/3)">
                <el-input-number v-model="ilfMid" :min="0" :step="1" controls-position="right" style="width:100%;" />
              </el-form-item>
              <el-form-item label="复用度高 (×1/3)">
                <el-input-number v-model="ilfHigh" :min="0" :step="1" controls-position="right" style="width:100%;" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <div class="sub-title"><el-icon>
                  <Connection />
                </el-icon><span>EIF</span></div>
              <el-form-item label="复用度低 (×1)">
                <el-input-number v-model="eifLow" :min="0" :step="1" controls-position="right" style="width:100%;" />
              </el-form-item>
              <el-form-item label="复用度中 (×2/3)">
                <el-input-number v-model="eifMid" :min="0" :step="1" controls-position="right" style="width:100%;" />
              </el-form-item>
              <el-form-item label="复用度高 (×1/3)">
                <el-input-number v-model="eifHigh" :min="0" :step="1" controls-position="right" style="width:100%;" />
              </el-form-item>
            </el-col>
          </el-row>
          <div class="formula-text">
            <span><strong>UFP</strong> (未调整) = 35×ILF + 15×EIF = <span class="high-light-text">{{ ufp
                }}</span>
              &nbsp;|&nbsp; <strong>US</strong> (复用调整后) = <span class="high-light-text">{{ us }}</span>
              &nbsp;|&nbsp; <span><strong>CF</strong> = {{ cf }}</span>
              &nbsp;|&nbsp; <strong>S</strong> (调整后规模) = <span class="high-light-text">{{ s }}</span>
              FP
            </span>
          </div>
        </el-card>

        <!-- 软件因素调整 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <HelpFilled />
              </el-icon>软件因素调整 (SWF)</div>
          </template>
          <el-form label-position="top" size="default">
            <el-form-item label="系统类型">
              <el-select v-model="sysType" placeholder="选择系统类型">
                <el-option v-for="item in sysTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <div class="def-text">调整因子 AT = {{ sysTypeAT }}</div>
            </el-form-item>

            <div class="sub-title"><el-icon>
                <Odometer />
              </el-icon><span>质量特征 (QR)</span></div>
            <div class="def-text">
              QR = (分布式 + 性能 + 可靠性 + 多重点) × 0.025 + 1
            </div>
            <el-row :gutter="12">
              <el-col :xs="12" :sm="12">
                <el-form-item label="分布式处理">
                  <el-select v-model="distributed" placeholder="选择">
                    <el-option label="无特别需求 (-1)" :value="-1" />
                    <el-option label="客户端/服务器 (0)" :value="0" />
                    <el-option label="多处理器并行 (1)" :value="1" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="12">
                <el-form-item label="性能">
                  <el-select v-model="performance" placeholder="选择">
                    <el-option label="无特别需求 (-1)" :value="-1" />
                    <el-option label="高峰时间有限制 (0)" :value="0" />
                    <el-option label="需性能分析工具 (1)" :value="1" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="12">
                <el-form-item label="可靠性">
                  <el-select v-model="reliability" placeholder="选择">
                    <el-option label="无特别需求 (-1)" :value="-1" />
                    <el-option label="可轻易修复 (0)" :value="0" />
                    <el-option label="很难修复，重大损失 (1)" :value="1" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="12" :sm="12">
                <el-form-item label="多重点">
                  <el-select v-model="multiSite" placeholder="选择">
                    <el-option label="相同环境 (-1)" :value="-1" />
                    <el-option label="相似环境 (0)" :value="0" />
                    <el-option label="不同环境 (1)" :value="1" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="formula-text">
              <span><strong>QR</strong> = {{ qr }}
                &nbsp;|&nbsp; <strong>SF</strong> = {{ sf }}
                &nbsp;|&nbsp; <strong>SWF</strong> = SF × AT × QR = <span class="high-light-text">{{
                  swf
                }}</span>
              </span>
            </div>
          </el-form>
        </el-card>

        <!-- 开发因素调整 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <Opportunity />
              </el-icon>开发因素调整 (RDF)</div>
          </template>
          <el-form label-position="top" size="default">
            <el-form-item label="开发语言">
              <el-select v-model="devLang" placeholder="选择开发语言">
                <el-option label="C 及其他同级别" value="c" />
                <el-option label="JAVA / C++ / C#" value="java" />
                <el-option label="PowerBuilder / ASP 及其他" value="pb" />
              </el-select>
              <div class="def-text">调整因子 SL = {{ sl }}</div>
            </el-form-item>
            <el-form-item label="团队背景">
              <el-select v-model="teamBg" placeholder="选择团队背景">
                <el-option label="同类行业及项目经验" value="same" />
                <el-option label="其他行业类似项目 / 本行业相关项目" value="other" />
                <el-option label="无同类项目背景" value="none" />
              </el-select>
              <div class="def-text">调整因子 DT = {{ dt }}</div>
            </el-form-item>
            <div class="formula-text">
              <span><strong>RDF</strong> = SL × DT = <span class="high-light-text">{{ rdf
              }}</span></span>
            </div>
          </el-form>
        </el-card>

        <!-- 直接非人力成本 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <Briefcase />
              </el-icon>直接非人力成本 (DNC)</div>
          </template>
          <el-form label-position="top" size="default">
            <el-row :gutter="12">
              <el-col :xs="12" :sm="12"><el-form-item label="办公费"><el-input-number v-model="dncOffice" :min="0"
                    :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
              <el-col :xs="12" :sm="12"><el-form-item label="差旅费"><el-input-number v-model="dncTravel" :min="0"
                    :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
              <el-col :xs="12" :sm="12"><el-form-item label="培训费"><el-input-number v-model="dncTrain" :min="0"
                    :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
              <el-col :xs="12" :sm="12"><el-form-item label="业务费"><el-input-number v-model="dncBiz" :min="0"
                    :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
              <el-col :xs="12" :sm="12"><el-form-item label="采购费"><el-input-number v-model="dncProcure" :min="0"
                    :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
              <el-col :xs="12" :sm="12"><el-form-item label="其他"><el-input-number v-model="dncOther" :min="0"
                    :step="1000" controls-position="right" style="width:100%;" /></el-form-item></el-col>
            </el-row>
            <div class="formula-text">
              <span><strong>DNC</strong> = <span class="high-light-text">{{ dncTotal }} 元</span></span>
            </div>
          </el-form>
        </el-card>

        <!-- 人力参数 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <Avatar />
              </el-icon>人力成本参数</div>
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
      <div class="right-panel" ref="exportRef">
        <!-- 结果 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <Flag />
              </el-icon>测算结果</div>
          </template>
          <div style="margin-bottom:12px;font-size:14px;color:#4a5b6e;">
            <strong>项目：</strong> {{ projectName || '(未命名)' }} &nbsp;|&nbsp;
            <strong>阶段：</strong> {{ phase === 'budget' ? '预算' : '招投标' }} &nbsp;|&nbsp;
            <strong>调整后规模 S：</strong> {{ s.toFixed(2) }} FP
          </div>

          <div class="sub-title"><el-icon>
              <Timer />
            </el-icon><span>工作量 (人时)</span></div>
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

          <div class="sub-title"><el-icon>
              <Calendar />
            </el-icon><span>工期 (月)</span></div>
          <div class="result-grid">
            <div class="result-item">
              <div class="label">下限</div>
              <div class="value">{{ dLower.toFixed(2) }}</div>
            </div>
            <div class="result-item highlight">
              <div class="label">最有可能</div>
              <div class="value">{{ dMost.toFixed(2) }}</div>
            </div>
            <div class="result-item">
              <div class="label">上限</div>
              <div class="value">{{ dUpper.toFixed(2) }}</div>
            </div>
          </div>

          <div class="sub-title"><el-icon>
              <Money />
            </el-icon><span>软件开发费用 (元)</span></div>
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
            功能点单价 ≈ {{ (pMost / s).toFixed(0) }} 元/FP &nbsp;|&nbsp; DNC = {{ dncTotal.toFixed(0) }} 元
          </div>
        </el-card>

        <!-- 测算过程 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <TrendCharts />
              </el-icon>测算过程</div>
          </template>
          <div class="process-step">
            <div class="step"><span class="label">① 未调整功能点 UFP</span><br>
              <span class="formula">UFP = 35×ILF + 15×EIF</span><br>
              <span class="calc">= 35×({{ ilfLow + ilfMid + ilfHigh }}) + 15×({{ eifLow + eifMid + eifHigh }}) = {{
                ufp
              }}</span>
            </div>
            <div class="step"><span class="label">② 复用调整后规模 US</span><br>
              <span class="formula">US = Σ (ILF各复用度加权 + EIF各复用度加权)</span><br>
              <span class="calc">ILF加权 = {{ ilfLow }}×1 + {{ ilfMid }}×(2/3) + {{ ilfHigh }}×(1/3) = {{ (ilfLow * 1 +
                ilfMid * (2 / 3) + ilfHigh * (1 / 3)).toFixed(2) }}</span>
              <span class="calc">EIF加权 = {{ eifLow }}×1 + {{ eifMid }}×(2/3) + {{ eifHigh }}×(1/3) = {{ (eifLow * 1 +
                eifMid * (2 / 3) + eifHigh * (1 / 3)).toFixed(2) }}</span>
              <span class="calc">US = 35×{{ (ilfLow * 1 + ilfMid * (2 / 3) + ilfHigh * (1 / 3)).toFixed(2) }} + 15×{{
                (eifLow
                  * 1 +
                  eifMid * (2 / 3) + eifHigh * (1 / 3)).toFixed(2) }} = {{ us.toFixed(2) }}</span>
            </div>
            <div class="step"><span class="label">③ 调整后规模 S</span><br>
              <span class="formula">S = US × CF</span><br>
              <span class="calc">= {{ us.toFixed(2) }} × {{ cf }} = {{ s.toFixed(2) }} FP</span>
            </div>
            <div class="step"><span class="label">④ 软件因素调整因子 SWF</span><br>
              <span class="formula">SF = (269.6446 + S×0.7094) / S</span><br>
              <span class="calc">= (269.6446 + {{ s.toFixed(2) }}×0.7094) / {{ s.toFixed(2) }} = {{ sf.toFixed(4)
              }}</span>
              <span class="formula">AT = {{ sysTypeAT }}</span><br>
              <span class="formula">QR = (分布式 + 性能 + 可靠性 + 多重点)×0.025 + 1 = ({{ distributed + performance +
                reliability
                +
                multiSite }})×0.025 + 1 = {{ qr.toFixed(4) }}</span><br>
              <span class="calc">SWF = SF × AT × QR = {{ sf.toFixed(4) }} × {{ sysTypeAT }} × {{ qr.toFixed(4) }} = {{
                swf.toFixed(4) }}</span>
            </div>
            <div class="step"><span class="label">⑤ 开发因素调整因子 RDF</span><br>
              <span class="formula">SL = {{ sl }}, DT = {{ dt }}</span><br>
              <span class="calc">RDF = SL × DT = {{ sl }} × {{ dt }} = {{ rdf.toFixed(2) }}</span>
            </div>
            <div class="step"><span class="label">⑥ 工作量 AE (人时)</span><br>
              <span class="formula">AE = (S × PDR) × SWF × RDF</span><br>
              <span class="calc">P25: ({{ s.toFixed(2) }} × 3.94) × {{ swf.toFixed(4) }} × {{ rdf.toFixed(2) }} = {{
                aeLower.toFixed(2) }}</span>
              <span class="calc">P50: ({{ s.toFixed(2) }} × 7.16) × {{ swf.toFixed(4) }} × {{ rdf.toFixed(2) }} = {{
                aeMost.toFixed(2) }}</span>
              <span class="calc">P75: ({{ s.toFixed(2) }} × 12.28) × {{ swf.toFixed(4) }} × {{ rdf.toFixed(2) }} = {{
                aeUpper.toFixed(2) }}</span>
            </div>
            <div class="step"><span class="label">⑦ 工期 D (月)</span><br>
              <span class="formula">D = 1.277 × (AE / HM)<sup>0.04</sup></span><br>
              <span class="calc">下限: 1.277 × ({{ aeLower.toFixed(2) }} / {{ hm }})<sup>0.04</sup> = <strong>{{
                dLower.toFixed(2)
              }}</strong></span>
              <span class="calc">最有可能: 1.277 × ({{ aeMost.toFixed(2) }} / {{ hm }})<sup>0.04</sup> = <strong>{{
                dMost.toFixed(2)
              }}</strong></span>
              <span class="calc">上限: 1.277 × ({{ aeUpper.toFixed(2) }} / {{ hm }})<sup>0.04</sup> = <strong>{{
                dUpper.toFixed(2)
              }}</strong></span>
            </div>
            <div class="step"><span class="label">⑧ 软件开发费用 P (元)</span><br>
              <span class="formula">P = AE / HM × F + DNC</span><br>
              <span class="calc">下限: {{ aeLower.toFixed(2) }} / {{ hm }} × {{ rateF }} + {{ dncTotal }} = <strong>{{
                pLower.toFixed(0)
              }}</strong></span>
              <span class="calc">最有可能: {{ aeMost.toFixed(2) }} / {{ hm }} × {{ rateF }} + {{ dncTotal }} = <strong>{{
                pMost.toFixed(0)
              }}</strong></span>
              <span class="calc">上限: {{ aeUpper.toFixed(2) }} / {{ hm }} × {{ rateF }} + {{ dncTotal }} = <strong>{{
                pUpper.toFixed(0)
              }}</strong></span>
            </div>
          </div>
        </el-card>

        <!-- 测算公式 & 指标定义 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <QuestionFilled />
              </el-icon>测算公式 &amp; 指标定义</div>
          </template>
          <el-collapse accordion>
            <el-collapse-item title="规模测算 (功能点)" name="1">
              <div class="formula-block">
                <div><span class="math">UFP = 35×ILF + 15×EIF</span></div>
                <div class="def">ILF：内部逻辑文件数量；EIF：外部接口文件数量。<br />按复用程度加权：低×1，中×2/3，高×1/3。</div>
                <div style="margin-top:6px;"><span class="math">US = Σ (各复用度加权后的ILF + EIF)</span></div>
                <div class="def">US：复用调整后规模。</div>
                <div style="margin-top:6px;"><span class="math">S = US × CF</span></div>
                <div class="def">CF：规模变更因子，预算阶段1.5，招投标阶段1.26。</div>
              </div>
            </el-collapse-item>
            <el-collapse-item title="工作量测算 (方程法)" name="2">
              <div class="formula-block">
                <div><span class="math">AE = (S × PDR) × SWF × RDF</span></div>
                <div class="def">
                  <strong>AE</strong>：测算工作量（人时）<br />
                  <strong>PDR</strong>：功能点耗时率（人时/FP），取行业基准 P25=3.94，P50=7.16，P75=12.28<br />
                  <strong>SWF</strong>：软件因素调整因子 = SF × AT × QR<br />
                  <strong>RDF</strong>：开发因素调整因子 = SL × DT
                </div>
              </div>
            </el-collapse-item>
            <el-collapse-item title="工期测算" name="3">
              <div class="formula-block">
                <div><span class="math">D = 1.277 × (AE / HM)<sup>0.04</sup></span></div>
                <div class="def">
                  <strong>D</strong>：工期（月）<br />
                  <strong>HM</strong>：人月折算系数，取176人时/人月
                </div>
              </div>
            </el-collapse-item>
            <el-collapse-item title="费用测算" name="4">
              <div class="formula-block">
                <div><span class="math">P = AE / HM × F + DNC</span></div>
                <div class="def">
                  <strong>P</strong>：软件开发费用（元）<br />
                  <strong>F</strong>：平均人力成本费率（元/人月）<br />
                  <strong>DNC</strong>：直接非人力成本（元）
                </div>
                <div style="margin-top:6px;font-size:13px;color:#4a5b6e;">
                  也可按规模单价测算：<span class="math">P = S × PP × SWF × RDF + DNC</span>
                </div>
              </div>
            </el-collapse-item>
            <el-collapse-item title="调整因子详解" name="5">
              <div class="formula-block" style="font-size:13px;">
                <div><strong>规模调整因子 SF</strong> = (269.6446 + S × 0.7094) / S</div>
                <div><strong>系统类型 AT</strong>：业务处理1.0 / 系统集成1.2 / 科技1.2 / 多媒体1.3 / 智能信息1.7 / 通信控制1.9 / 流程控制2.0</div>
                <div><strong>质量特征 QR</strong> = (分布式 + 性能 + 可靠性 + 多重点) × 0.025 + 1，各因子取值 -1,0,1</div>
                <div><strong>开发语言 SL</strong>：C=1.5 / JAVA/C++/C#=1.0 / PowerBuilder/ASP=0.6</div>
                <div><strong>团队背景 DT</strong>：同类经验0.8 / 其他行业1.0 / 无经验1.2</div>
                <div class="def-text">基准数据基于 CSBMK-201610，可随行业数据更新。</div>
              </div>
            </el-collapse-item>
          </el-collapse>
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
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export default {
  name: 'ChengduCostEstimator',
  setup() {
    // ---------- ref 引用 ----------
    const headerRef = ref(null)
    const exportRef = ref(null)

    // ---------- 响应式数据 ----------
    const projectName = ref('示例项目')
    const phase = ref('bidding') // 'budget' | 'bidding'

    // 功能点计数
    const ilfLow = ref(9)
    const ilfMid = ref(3)
    const ilfHigh = ref(3)
    const eifLow = ref(2)
    const eifMid = ref(0)
    const eifHigh = ref(2)

    // 软件因素
    const sysTypeOptions = [
      { label: '业务处理 (办公自动化、人事、会计等)', value: 'business' },
      { label: '系统集成 (企业服务总线等)', value: 'integration' },
      { label: '科技 (科学计算、模拟、统计等)', value: 'science' },
      { label: '多媒体 (图形、影像、GIS、教育娱乐等)', value: 'multimedia' },
      { label: '智能信息 (自然语言、AI、专家系统等)', value: 'ai' },
      { label: '通信控制 (协议、仿真、GPS等)', value: 'comm' },
      { label: '流程控制 (生产管理、实时控制、嵌入式等)', value: 'process' },
    ]
    const sysType = ref('business')

    // 质量特征
    const distributed = ref(0)
    const performance = ref(0)
    const reliability = ref(0)
    const multiSite = ref(0)

    // 开发因素
    const devLang = ref('java')
    const teamBg = ref('same')

    // 直接非人力成本
    const dncOffice = ref(0)
    const dncTravel = ref(0)
    const dncTrain = ref(20000)
    const dncBiz = ref(20000)
    const dncProcure = ref(40000)
    const dncOther = ref(0)

    // 人力参数
    const rateF = ref(16900)
    const hm = ref(176)

    // ---------- 计算属性 ----------
    const cf = computed(() => phase.value === 'budget' ? 1.5 : 1.26)

    const ufp = computed(() => {
      const ilfTotal = ilfLow.value + ilfMid.value + ilfHigh.value
      const eifTotal = eifLow.value + eifMid.value + eifHigh.value
      return 35 * ilfTotal + 15 * eifTotal
    })

    const us = computed(() => {
      const ilfW = ilfLow.value * 1 + ilfMid.value * (2 / 3) + ilfHigh.value * (1 / 3)
      const eifW = eifLow.value * 1 + eifMid.value * (2 / 3) + eifHigh.value * (1 / 3)
      return 35 * ilfW + 15 * eifW
    })

    const s = computed(() => us.value * cf.value)

    const sysTypeATMap = {
      business: 1.0,
      integration: 1.2,
      science: 1.2,
      multimedia: 1.3,
      ai: 1.7,
      comm: 1.9,
      process: 2.0,
    }
    const sysTypeAT = computed(() => sysTypeATMap[sysType.value] || 1.0)

    const qr = computed(() => {
      const sum = distributed.value + performance.value + reliability.value + multiSite.value
      return sum * 0.025 + 1
    })

    const sf = computed(() => {
      const S = s.value
      if (S <= 0) return 1
      return (269.6446 + S * 0.7094) / S
    })

    const swf = computed(() => sf.value * sysTypeAT.value * qr.value)

    const slMap = { c: 1.5, java: 1.0, pb: 0.6 }
    const sl = computed(() => slMap[devLang.value] || 1.0)

    const dtMap = { same: 0.8, other: 1.0, none: 1.2 }
    const dt = computed(() => dtMap[teamBg.value] || 1.0)

    const rdf = computed(() => sl.value * dt.value)

    const PDR_P25 = 3.94
    const PDR_P50 = 7.16
    const PDR_P75 = 12.28

    const aeLower = computed(() => s.value * PDR_P25 * swf.value * rdf.value)
    const aeMost = computed(() => s.value * PDR_P50 * swf.value * rdf.value)
    const aeUpper = computed(() => s.value * PDR_P75 * swf.value * rdf.value)

    const dLower = computed(() => {
      if (aeLower.value <= 0) return 0
      return 1.277 * Math.pow(aeLower.value / hm.value, 0.04)
    })
    const dMost = computed(() => {
      if (aeMost.value <= 0) return 0
      return 1.277 * Math.pow(aeMost.value / hm.value, 0.04)
    })
    const dUpper = computed(() => {
      if (aeUpper.value <= 0) return 0
      return 1.277 * Math.pow(aeUpper.value / hm.value, 0.04)
    })

    const dncTotal = computed(() => {
      return dncOffice.value + dncTravel.value + dncTrain.value +
        dncBiz.value + dncProcure.value + dncOther.value
    })

    const pLower = computed(() => {
      if (aeLower.value <= 0) return 0
      return (aeLower.value / hm.value) * rateF.value + dncTotal.value
    })
    const pMost = computed(() => {
      if (aeMost.value <= 0) return 0
      return (aeMost.value / hm.value) * rateF.value + dncTotal.value
    })
    const pUpper = computed(() => {
      if (aeUpper.value <= 0) return 0
      return (aeUpper.value / hm.value) * rateF.value + dncTotal.value
    })

    // ---------- 导出PDF ----------
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

        const [headerCanvas, exportCanvas] = await Promise.all([
          capture(headerEl),
          capture(exportEl)
        ])

        const targetWidth = exportCanvas.width
        const targetWidthPx = 1600

        // 缩放函数
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

        // 垂直拼接两个 canvas
        const totalHeight = resizedHeader.height + resizedExport.height
        const mergedCanvas = document.createElement('canvas')
        mergedCanvas.width = targetWidthPx
        mergedCanvas.height = totalHeight
        const ctx = mergedCanvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, targetWidthPx, totalHeight)
        ctx.drawImage(resizedHeader, 0, 0)
        ctx.drawImage(resizedExport, 0, resizedHeader.height)

        // 现在将 mergedCanvas 按 A4 页面高度切分，每一页放入 PDF
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        // 计算合并后的图片在 PDF 中每页显示的高度（保持宽度适应页面）
        const imgWidth = mergedCanvas.width
        const imgHeight = mergedCanvas.height
        // 缩放比例使宽度适应页面
        const scale = pageWidth / imgWidth
        const displayWidth = pageWidth
        const displayHeight = imgHeight * scale

        // 如果总高度不超过一页，直接添加
        if (displayHeight <= pageHeight) {
          const imgData = mergedCanvas.toDataURL('image/png')
          const x = 0
          const y = (pageHeight - displayHeight) / 2 // 居中垂直
          pdf.addImage(imgData, 'PNG', x, y, displayWidth, displayHeight)
        } else {
          // 分页：计算每页能显示的高度（像素），然后切割 canvas
          // 每页可容纳的 canvas 像素高度 = pageHeight / scale (因为缩放后高度=canvas像素高度*scale)
          const pixelsPerPage = pageHeight / scale
          let startY = 0
          let pageNum = 0
          while (startY < imgHeight) {
            const endY = Math.min(startY + pixelsPerPage, imgHeight)
            // 切割当前页的 canvas 区域
            const pageCanvas = document.createElement('canvas')
            pageCanvas.width = imgWidth
            pageCanvas.height = endY - startY
            const pageCtx = pageCanvas.getContext('2d')
            pageCtx.drawImage(mergedCanvas, 0, startY, imgWidth, endY - startY, 0, 0, imgWidth, endY - startY)

            const imgData = pageCanvas.toDataURL('image/png')
            // 计算在 PDF 中的显示尺寸
            const pageDisplayHeight = (endY - startY) * scale
            const x = 0
            const y = (pageHeight - pageDisplayHeight) / 2 // 居中
            if (pageNum > 0) pdf.addPage()
            pdf.addImage(imgData, 'PNG', x, y, displayWidth, pageDisplayHeight)

            startY = endY
            pageNum++
          }
        }

        pdf.save(`费用测算报告_${projectName.value || '项目'}.pdf`)
        ElMessage.success('PDF导出成功')
      } catch (error) {
        ElMessage.error('PDF导出失败，请查看控制台错误信息。')
      }
    }

    // ---------- 其他方法 ----------
    function loadExample() {
      projectName.value = '示例项目'
      phase.value = 'bidding'
      ilfLow.value = 9
      ilfMid.value = 3
      ilfHigh.value = 3
      eifLow.value = 2
      eifMid.value = 0
      eifHigh.value = 2
      sysType.value = 'business'
      distributed.value = 0
      performance.value = 0
      reliability.value = 0
      multiSite.value = 0
      devLang.value = 'java'
      teamBg.value = 'same'
      dncOffice.value = 0
      dncTravel.value = 0
      dncTrain.value = 20000
      dncBiz.value = 20000
      dncProcure.value = 40000
      dncOther.value = 0
      rateF.value = 16900
      hm.value = 176
      ElMessage.success('示例数据已加载')
    }

    function resetAll() {
      projectName.value = ''
      phase.value = 'bidding'
      ilfLow.value = 0
      ilfMid.value = 0
      ilfHigh.value = 0
      eifLow.value = 0
      eifMid.value = 0
      eifHigh.value = 0
      sysType.value = 'business'
      distributed.value = 0
      performance.value = 0
      reliability.value = 0
      multiSite.value = 0
      devLang.value = 'java'
      teamBg.value = 'same'
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

    // ---------- 导出 CSV ----------
    function exportCSV() {
      const rows = [
        ['项目名称', projectName.value],
        ['测算阶段', phase.value === 'budget' ? '预算' : '招投标'],
        [''],
        ['===== 功能点计数 ====='],
        ['ILF 低', ilfLow.value],
        ['ILF 中', ilfMid.value],
        ['ILF 高', ilfHigh.value],
        ['EIF 低', eifLow.value],
        ['EIF 中', eifMid.value],
        ['EIF 高', eifHigh.value],
        ['UFP (未调整)', ufp.value],
        ['US (复用调整)', us.value],
        ['CF', cf.value],
        ['S (调整后规模)', s.value],
        [''],
        ['===== 调整因子 ====='],
        ['系统类型 AT', sysTypeAT.value],
        ['分布式', distributed.value],
        ['性能', performance.value],
        ['可靠性', reliability.value],
        ['多重点', multiSite.value],
        ['QR', qr.value],
        ['SF', sf.value],
        ['SWF', swf.value],
        ['开发语言 SL', sl.value],
        ['团队背景 DT', dt.value],
        ['RDF', rdf.value],
        [''],
        ['===== 工作量 & 工期 & 费用 ====='],
        ['PDR P25', 3.94],
        ['PDR P50', 7.16],
        ['PDR P75', 12.28],
        ['AE 下限 (人时)', aeLower.value],
        ['AE 最有可能 (人时)', aeMost.value],
        ['AE 上限 (人时)', aeUpper.value],
        ['D 下限 (月)', dLower.value],
        ['D 最有可能 (月)', dMost.value],
        ['D 上限 (月)', dUpper.value],
        ['P 下限 (元)', pLower.value],
        ['P 最有可能 (元)', pMost.value],
        ['P 上限 (元)', pUpper.value],
        ['DNC 合计 (元)', dncTotal.value],
        ['平均人力成本费率 F (元/人月)', rateF.value],
        ['人月折算系数 HM', hm.value],
        ['功能点单价 (元/FP)', (pMost.value / s.value).toFixed(2)],
      ]

      let csv = '\uFEFF' // BOM for Excel
      rows.forEach(row => {
        csv += row.join(',') + '\n'
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute('download', `费用测算表_${projectName.value || '项目'}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    return {
      headerRef,
      exportRef,
      projectName,
      phase,
      ilfLow,
      ilfMid,
      ilfHigh,
      eifLow,
      eifMid,
      eifHigh,
      sysTypeOptions,
      sysType,
      distributed,
      performance,
      reliability,
      multiSite,
      devLang,
      teamBg,
      dncOffice,
      dncTravel,
      dncTrain,
      dncBiz,
      dncProcure,
      dncOther,
      rateF,
      hm,
      cf,
      ufp,
      us,
      s,
      sysTypeAT,
      qr,
      sf,
      swf,
      sl,
      dt,
      rdf,
      aeLower,
      aeMost,
      aeUpper,
      dLower,
      dMost,
      dUpper,
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
.cost-estimator-container {
  font-family: 'Segoe UI', 'PingFang SC', Roboto, 'Helvetica Neue', sans-serif;
  color: #2c3e50;
  max-width: 2000px;
  margin: 0 auto;
}

/* 移动端适配等 */
@media (max-width: 768px) {
  .cost-estimator-container {
    padding: 0 6px;
  }

  .app-header {
    padding: 16px 20px;
  }

  .app-header-inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
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

  .main-title {
    gap: 8px;
    display: flex;
    align-items: center;
    font-size: 16px;
    color: #1a3a5c;
  }

  .sub-title {
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
  background: rgba(255, 255, 255, 0.18);
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
  .main-grid {
    grid-template-columns: 1fr;
  }
}

.left-panel,
.right-panel {
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

.main-title .icon {
  font-size: 20px;
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
  .result-grid {
    grid-template-columns: 1fr 1fr;
  }
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
  .cost-estimator-container {
    height: auto !important;
    overflow: visible !important;
  }

  .main-grid {
    display: block !important;
  }

  .app-header {
    background: #1a3a5c !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .el-button,
  .el-card__header .el-button {
    display: none !important;
  }

  .card {
    break-inside: avoid;
    box-shadow: none !important;
  }

  .main-grid>div {
    width: 100%;
  }

  .result-item {
    border-left-color: #2a5f8f !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .process-step .step .formula,
  .formula-block {
    background: #f0f4fa !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cost-estimator-container,
  .main-grid,
  .el-card,
  .process-step,
  .formula-block {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }
}
</style>