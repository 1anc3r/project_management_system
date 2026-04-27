<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon project">
              <el-icon><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.project_count || 0 }}</div>
              <div class="stat-label">项目数量</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon amount">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(stats.total_amount) }}</div>
              <div class="stat-label">合同总金额（万元）</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon receipt">
              <el-icon><DocumentChecked /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(stats.receipt_amount) }}</div>
              <div class="stat-label">已开票金额（万元）</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(stats.pending_amount) }}</div>
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
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>项目阶段分布</span>
              <el-tag type="info" size="small">点击饼图查看详情</el-tag>
            </div>
          </template>
          <v-chart class="chart" :option="stageChartOption" autoresize @click="handleStageClick" />
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
          <v-chart class="chart" :option="typeChartOption" autoresize @click="handleTypeClick" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>合同金额趋势</span>
            </div>
          </template>
          <v-chart class="chart" :option="trendChartOption" autoresize />
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
                <el-timeline-item
                  v-for="item in informationList"
                  :key="item.id"
                  :type="getTimelineType(item.information_type)"
                  :timestamp="formatDate(item.information_date)"
                  placement="top"
                >
                  <el-card shadow="never" class="info-item-card">
                    <template #header>
                      <div class="info-item-header">
                        <span class="info-item-title">{{ item.information_title }}</span>
                        <el-tag :type="getInfoTypeTag(item.information_type)" size="small">{{ item.information_type }}</el-tag>
                      </div>
                    </template>
                    <p class="info-item-content">{{ item.information_content || '暂无内容' }}</p>
                    <div class="info-item-meta">
                      <span v-if="item.partner_name" class="meta-item">
                        <el-icon><User /></el-icon>
                        {{ item.partner_name }}
                      </span>
                      <span v-if="item.project_name" class="meta-item">
                        <el-icon><Folder /></el-icon>
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
import { PieChart, LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Folder, Money, DocumentChecked, Document, User } from '@element-plus/icons-vue'
import { getDashboard } from '@/api/projects'
import { getAllInformation } from '@/api/information'
import { formatAmount, formatDate } from '@/utils/format'
import TiandituMap from './components/TiandituMap.vue'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent
])

const router = useRouter()

// 统计数据
const stats = ref({})
const stageDistribution = ref([])
const receiptTrend = ref([])
const typeDistribution = ref([])

// 折叠面板激活项
const activeCollapse = ref(['information'])
// 资讯列表
const informationList = ref([])

// 阶段颜色映射
const stageColors = {
    '意向': '#F57FAC',
    '签约': '#EBAA3C',
    '建设': '#409EFF',
    '运营': '#03A9F4',
    '交付': '#009688',
    '验收': '#8FC25C',
    '完结': '#909399'
}

// 项目类型颜色映射
const typeColors = {
  '收入合同': '#67C23A',
  '支出合同': '#F56C6C'
}

// 项目阶段分布图表配置
const stageChartOption = computed(() => ({
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
      data: stageDistribution.value.map(item => ({
        name: item.stage,
        value: item.count,
        amount: item.amount,
        itemStyle: { color: stageColors[item.stage] || '#909399' }
      }))
    }
  ]
}))

// 合同金额趋势图表配置
const trendChartOption = computed(() => ({
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
    data: receiptTrend.value.map(item => item.month),
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
      data: receiptTrend.value.map(item => item.amount),
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
const typeChartOption = computed(() => ({
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
      data: typeDistribution.value.map(item => ({
        name: item.type,
        value: item.count,
        amount: item.amount,
        itemStyle: { color: typeColors[item.type] || '#909399' }
      }))
    }
  ]
}))

// 获取数据
const fetchData = async () => {
  try {
    const params = {}
    const res = await getDashboard(params)
    stats.value = res.data.stats || {}
    stageDistribution.value = res.data.stageDistribution || []
    receiptTrend.value = res.data.receiptTrend || []
    typeDistribution.value = res.data.typeDistribution || []
  } catch (error) {
    console.error('获取数据概览失败:', error)
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

// 资讯类型标签样式
const getInfoTypeTag = (type) => {
  const typeMap = {
    '项目推进': 'primary',
    '会议活动': 'success'
  }
  return typeMap[type] || 'info'
}

// 时间线类型
const getTimelineType = (type) => {
  const typeMap = {
    '项目推进': 'primary',
    '会议活动': 'success'
  }
  return typeMap[type] || 'info'
}

onMounted(() => {
  fetchData()
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

  .chart-row {
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
