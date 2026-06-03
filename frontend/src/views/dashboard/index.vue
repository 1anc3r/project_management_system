<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon project">
              <el-icon>
                <Folder />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ projStats.project_count || 0 }}</div>
              <div class="stat-label">项目数量</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon amount">
              <el-icon>
                <Money />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(projStats.total_amount) }}</div>
              <div class="stat-label">合同总金额（万元）</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon receipt">
              <el-icon>
                <DocumentChecked />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(projStats.receipt_amount) }}</div>
              <div class="stat-label">已开票金额（万元）</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon>
                <Document />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(projStats.pending_amount) }}</div>
              <div class="stat-label">待开票金额（万元）</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 地图区域 -->
    <el-row :gutter="20" class="map-row">
      <el-col :span="24">
        <el-card class="map-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>项目地图分布</span>
              <el-tag type="info" size="small">点击地点查看项目列表</el-tag>
            </div>
          </template>
          <TiandituMap />
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="proj-stats-row">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>项目阶段分布</span>
              <el-tag type="info" size="small">点击饼图查看详情</el-tag>
            </div>
          </template>
          <v-chart class="chart" :option="projStageChartOption" autoresize @click="handleStageClick" />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>项目类型分布</span>
              <el-tag type="info" size="small">点击饼图查看详情</el-tag>
            </div>
          </template>
          <v-chart class="chart" :option="projTypeChartOption" autoresize @click="handleTypeClick" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计图表区域 -->
    <el-row :gutter="20" class="info-stats-row">
      <!-- 资讯类型分布 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>资讯类型分布</span>
              <el-tag type="info" size="small">{{ infoTypeDistribution.length }} 种类型</el-tag>
            </div>
          </template>
          <v-chart class="chart" :option="infoTypeChartOption" autoresize />
        </el-card>
      </el-col>

      <!-- 资讯时间线热力图 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>资讯时间线热力图</span>
              <el-tag type="info" size="small">近一年</el-tag>
            </div>
          </template>
          <v-chart class="chart heatmap-chart" :option="infoHeatmapChartOption" autoresize />
        </el-card>
      </el-col>

      <!-- 活跃度排名 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>资讯活跃度排名</span>
              <el-radio-group v-model="infoRankingType" size="small">
                <el-radio-button label="partner">合作方</el-radio-button>
                <el-radio-button label="project">项目</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="chart" :option="infoRankingChartOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 资讯列表（可折叠/展开） -->
    <el-row :gutter="20" class="info-row">
      <el-col :span="24">
        <el-card class="info-card" shadow="hover">
          <el-collapse v-model="activeCollapse">
            <el-collapse-item name="information">
              <template #title>
                <div class="collapse-header">
                  <span class="collapse-title">最新资讯</span>
                  <el-tag type="info" size="small" class="count-tag">{{ informationList.length }} 条</el-tag>
                </div>
              </template>
              <el-timeline v-if="informationList.length">
                <el-timeline-item v-for="item in informationList" :key="item.id"
                  :type="getInfoTypeTag(item.information_type)" :timestamp="formatDate(item.information_date)"
                  placement="top">
                  <el-card shadow="never" class="info-item-card">
                    <template #header>
                      <div class="info-item-header">
                        <span class="info-item-title">{{ item.information_title }}</span>
                        <el-tag :type="getInfoTypeTag(item.information_type)" size="small">{{ item.information_type
                        }}</el-tag>
                      </div>
                    </template>
                    <p class="info-item-content">{{ item.information_content || '暂无内容' }}</p>
                    <div class="info-item-meta">
                      <span v-if="item.partner_name" class="meta-item">
                        <el-icon>
                          <User />
                        </el-icon>
                        {{ item.partner_name }}
                      </span>
                      <span v-if="item.project_name" class="meta-item">
                        <el-icon>
                          <Folder />
                        </el-icon>
                        {{ item.project_name }}
                      </span>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无资讯" />
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart, BarChart, HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,  
  CalendarComponent,
  VisualMapComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Folder, Money, DocumentChecked, Document, User } from '@element-plus/icons-vue'
import { getProjectStats } from '@/api/projects'
import { getAllInformation, getInformationStats } from '@/api/information'
import { formatAmount, formatDate, getInfoTypeTag, getProjectStageColor, getProjectTypeColor } from '@/utils/format'
import TiandituMap from './components/TiandituMap.vue'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,  
  CalendarComponent,
  VisualMapComponent
])

const router = useRouter()

// 统计数据
const projStats = ref({})
const projStageDistribution = ref([])
const projReceiptTrend = ref([])
const projTypeDistribution = ref([])

const infoStats = ref({})
const infoTypeDistribution = ref([])
const infoHeatmap = ref([])
const partnerRanking = ref([])
const projectRanking = ref([])
const infoRankingType = ref('partner')

// 折叠面板激活项
const activeCollapse = ref(['information'])

// 资讯列表
const informationList = ref([])

// 阶段颜色映射
const PROJ_STAGE_COLORS = {
  '意向': '#F57FAC',
  '签约': '#EBAA3C',
  '建设': '#409EFF',
  '运营': '#03A9F4',
  '交付': '#009688',
  '验收': '#8FC25C',
  '完结': '#909399'
}

// 项目类型颜色映射
const PROJ_TYPE_COLORS = {
  '收入合同': '#67C23A',
  '支出合同': '#F56C6C'
}

// 资讯类型颜色映射
const INFO_TYPE_COLORS = {
  '项目实施': '#409EFF',
  '拜访客户': '#E6A23C',
  '会议活动': '#F56C6C',
  '其他': '#909399'
}

// 项目阶段分布图表配置
const projStageChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      return `${params.name}<br/>项目数: ${params.value} 个<br/>金额: ${formatAmount(params.data.amount)} 万元`
    }
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '项目阶段',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: (params) => {
          return `${params.name}\n${params.value}个\n${formatAmount(params.data.amount)}万`
        }
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: projStageDistribution.value.map(item => ({
        name: item.stage,
        value: item.count,
        amount: item.amount,
        itemStyle: { color: PROJ_STAGE_COLORS[item.stage] }
      }))
    }
  ]
}))

// 合同金额趋势图表配置
const projTrendChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    },
    formatter: (params) => {
      const data = params[0]
      return `${data.name}<br/>合同金额: ${formatAmount(data.value)} 万元`
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: projReceiptTrend.value.map(item => item.month),
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: {
    type: 'value',
    name: '金额（万元）',
    axisLabel: {
      formatter: (value) => value
    }
  },
  series: [
    {
      name: '合同金额',
      type: 'line',
      smooth: true,
      data: projReceiptTrend.value.map(item => item.amount),
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ]
        }
      },
      lineStyle: {
        color: '#409EFF',
        width: 3
      },
      itemStyle: {
        color: '#409EFF'
      }
    }
  ]
}))

// 项目类型分布图表配置
const projTypeChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      return `${params.name}<br/>项目数: ${params.value} 个<br/>金额: ${formatAmount(params.data.amount)} 万元`
    }
  },
  legend: {
    orient: 'horizontal',
    bottom: 'bottom'
  },
  series: [
    {
      name: '项目类型',
      type: 'pie',
      radius: '60%',
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: (params) => {
          return `${params.name}\n${params.value}个\n${formatAmount(params.data.amount)}万`
        }
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: projTypeDistribution.value.map(item => ({
        name: item.type,
        value: item.count,
        amount: item.amount,
        itemStyle: { color: PROJ_TYPE_COLORS[item.type] }
      }))
    }
  ]
}))

// 资讯类型分布图表配置
const infoTypeChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      return `${params.name}<br/>数量: ${params.value} 条<br/>占比: ${params.percent}%`
    }
  },
  legend: {
    orient: 'horizontal',
    bottom: 'bottom',
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { fontSize: 11 }
  },
  series: [
    {
      name: '资讯类型',
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{c}条',
        fontSize: 11
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: infoTypeDistribution.value.map(item => ({
        name: item.type,
        value: item.count,
        itemStyle: { color: INFO_TYPE_COLORS[item.type] || '#909399' }
      }))
    }
  ]
}))

// 资讯时间线热力图配置
const infoHeatmapChartOption = computed(() => {
  // 计算日期范围
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 365)

  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  return {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        return `${params.data[0]}<br/>资讯数量: ${params.data[1]} 条`
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...infoHeatmap.value.map(d => d.count), 5),
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 'bottom',
      itemWidth: 10,
      itemHeight: 80,
      inRange: {
        color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
      },
      textStyle: { fontSize: 10 }
    },
    calendar: {
      top: 30,
      left: 30,
      right: 10,
      bottom: 50,
      cellSize: ['auto', 14],
      range: [startStr, endStr],
      itemStyle: {
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 3
      },
      splitLine: { show: false },
      yearLabel: { show: false },
      monthLabel: {
        nameMap: 'cn',
        fontSize: 10,
        color: '#606266'
      },
      dayLabel: {
        firstDay: 1,
        nameMap: 'cn',
        fontSize: 9,
        color: '#909399'
      }
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: infoHeatmap.value.map(item => [item.date, item.count])
      }
    ]
  }
})

// 活跃度排名图表配置
const infoRankingChartOption = computed(() => {
  const data = infoRankingType.value === 'partner' ? partnerRanking.value : projectRanking.value
  const labelName = infoRankingType.value === 'partner' ? '合作方' : '项目'

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        return `${p.name}<br/>资讯数量: ${p.value} 条`
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 }
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.name).reverse(),
      axisLabel: {
        fontSize: 10,
        width: 90,
        overflow: 'truncate'
      }
    },
    series: [
      {
        name: labelName,
        type: 'bar',
        data: data.map(item => item.count).reverse(),
        itemStyle: {
          color: infoRankingType.value === 'partner' ? '#409EFF' : '#67C23A',
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          fontSize: 10,
          formatter: '{c}'
        }
      }
    ]
  }
})

// 获取数据
const fetchProjStats = async () => {
  try {
    const params = {}
    const res = await getProjectStats(params)
    projStats.value = res.data.stats || {}
    projStageDistribution.value = res.data.stageDistribution || []
    projReceiptTrend.value = res.data.receiptTrend || []
    projTypeDistribution.value = res.data.typeDistribution || []
  } catch (error) {
    console.error('获取数据概览失败:', error)
  }
}

// 获取统计数据
const fetchInfoStats = async () => {
  try {
    const res = await getInformationStats()
    infoStats.value = res.data || {}
    infoTypeDistribution.value = res.data?.typeDistribution || []
    infoHeatmap.value = res.data?.dateHeatmap || []
    partnerRanking.value = res.data?.partnerRanking || []
    projectRanking.value = res.data?.projectRanking || []
  } catch (error) {
    console.error('获取资讯统计失败:', error)
  }
}

// 获取资讯列表
const fetchInformationList = async () => {
  try {
    const res = await getAllInformation({ limit: 20 })
    informationList.value = res.data || []
  } catch (error) {
    console.error('获取资讯列表失败:', error)
    informationList.value = []
  }
}

// 点击饼图
const handleStageClick = (params) => {
  router.push({
    path: '/projects',
    query: { stage: params.name }
  })
}

// 点击项目类型图表
const handleTypeClick = (params) => {
  router.push({
    path: '/projects',
    query: { type: params.name }
  })
}

onMounted(() => {
  fetchProjStats()
  fetchInfoStats()
  fetchInformationList()
})
</script>

<style scoped lang="scss">
.dashboard-container {
  .type-switch-card {
    margin-bottom: 20px;

    .type-switch-bar {
      display: flex;
      align-items: center;
      gap: 15px;

      .switch-label {
        font-size: 14px;
        font-weight: 500;
        color: #606266;
      }
    }
  }

  .stat-row {
    margin-bottom: 20px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #fff;
          margin-right: 15px;

          &.project {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.amount {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.receipt {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.pending {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-top: 5px;
          }
        }
      }
    }
  }

  .map-row {
    margin-bottom: 20px;

    .map-card {
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
      }
    }
  }

  .proj-stats-row {
    margin-bottom: 20px;

    .chart-card {
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
      }

      .chart {
        height: 350px;
      }
    }
  }

  .info-stats-row {
    margin-bottom: 15px;

    .stats-summary-card {
      margin-bottom: 15px;

      .stats-summary {
        display: flex;
        align-items: center;
        gap: 40px;
        padding: 5px 10px;
        position: relative;

        .summary-item {
          text-align: center;

          .summary-value {
            font-size: 22px;
            font-weight: 600;
            color: #303133;
          }

          .summary-label {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
          }
        }

        .stats-close {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
        }
      }
    }

    .chart-card {
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
        font-size: 14px;
      }

      .chart {
        height: 280px;

        &.heatmap-chart {
          height: 280px;
        }
      }
    }
  }

  .info-row {
    .info-card {
      .collapse-header {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;

        .collapse-title {
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

      .info-item-card {
        margin-bottom: 5px;

        .info-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .info-item-title {
            font-weight: 600;
            font-size: 14px;
          }
        }

        .info-item-content {
          font-size: 13px;
          color: #606266;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .info-item-meta {
          margin-top: 8px;
          display: flex;
          gap: 15px;

          .meta-item {
            font-size: 12px;
            color: #909399;
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }
  }
}
</style>
