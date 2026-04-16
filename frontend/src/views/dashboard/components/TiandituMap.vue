<template>
  <div class="sichuan-map-wrapper">
    <!-- 地图区域 -->
    <div class="map-container">
      <div 
        ref="mapRef" 
        class="tianditu-map"
        :style="{ height: mapHeight }"
      ></div>
      <!-- 加载状态 -->
      <div v-if="isLoading" class="map-loading">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>地图加载中...</span>
      </div>
      <!-- 错误提示 -->
      <div v-if="hasError" class="map-error">
        <el-icon><Warning /></el-icon>
        <span>{{ errorMsg }}</span>
      </div>
    </div>
    
    <!-- 右侧城市列表面板 -->
    <div class="city-panel">
      <div class="panel-header">
        <div class="header-title">
          <el-icon><MapLocation /></el-icon>
          <span>项目列表</span>
        </div>
        <el-tag type="primary" size="small" effect="dark">
          共计 {{ totalProjects }} 个项目，{{ totalAmount }} 万元
        </el-tag>
      </div>
      
      <div class="city-list" ref="cityListRef">
        <div 
          v-for="city in sortedCityList" 
          :key="city.city"
          :data-city="city.city"
          class="city-item"
          :class="{ 
            'has-projects': city.project_count > 0,
            'active': hoveredCity === city.city 
          }"
          @mouseenter="handleCityHover(city)"
          @mouseleave="handleCityLeave"
          @click="handleCityClick(city)"
        >
          <div class="city-main">
            <div class="city-header">
              <span class="city-name">{{ city.city }}</span>
              <el-tag 
                :type="getProjectCountTagType(city.project_count)" 
                size="small"
                class="count-tag"
                effect="plain"
              >
                {{ city.project_count }} 个项目
              </el-tag>
            </div>
            <div class="city-info" v-if="city.project_count > 0">
              <div class="info-row">
                <span class="info-label">合同金额:</span>
                <span class="info-value amount"><b>{{ formatAmount(city.total_amount) }} 万</b></span>
              </div>
              <div class="info-row stages" v-if="city.stageDistribution && Object.keys(city.stageDistribution).length > 0">
                <span class="info-label">项目阶段:</span>
                <div class="stage-tags">
                  <el-tag 
                    v-for="(count, stage) in city.stageDistribution" 
                    :key="stage"
                    :type="getStageTagType(stage)"
                    size="small"
                    effect="light"
                  >
                    {{ stage }}: {{ count }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
          <el-icon v-if="city.project_count > 0" class="arrow-icon"><ArrowRight /></el-icon>
        </div>
      </div>
      
      <!-- 图例 -->
      <div class="panel-legend">
        <div class="legend-title">项目数量图例</div>
        <div class="legend-items">
          <div class="legend-item">
            <span class="color-box high"></span>
            <span>10个以上</span>
          </div>
          <div class="legend-item">
            <span class="color-box medium"></span>
            <span>5-9个</span>
          </div>
          <div class="legend-item">
            <span class="color-box low"></span>
            <span>1-4个</span>
          </div>
          <div class="legend-item">
            <span class="color-box none"></span>
            <span>暂无项目</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loading, Warning, MapLocation, ArrowRight } from '@element-plus/icons-vue';
import { getCityDistribution } from '@/api/projects';
import { formatAmount } from '@/utils/format';

// ===================== Props =====================
const props = defineProps({
  type: {
    type: String,
    default: ''
  }
});

// ===================== 常量配置 =====================
const TDT_KEY = import.meta.env.VITE_TDT_KEY || 'your_tianditu_api_token';

const MAP_CONFIG = {
  center: [30.6, 104.0], // 四川中心点 [纬度, 经度]
  zoom: 6,
  minZoom: 6,
  maxZoom: 8,
  height: '520px',
  // 颜色配置 - 根据项目数量
  colors: {
    high: '#F56C6C',    // 10个以上
    medium: '#E6A23C',  // 5-9个
    low: '#67C23A',     // 1-4个
    none: '#DCDFE6'     // 无项目
  }
};

// 项目阶段颜色映射
const STAGE_COLORS = {
    '意向': '#F57FAC',
    '签约': '#EBAA3C',
    '建设': '#409EFF',
    '运营': '#03A9F4',
    '交付': '#009688',
    '验收': '#8FC25C',
    '完结': '#909399'
};

// GeoJSON文件路径
const GEOJSON_PATH = '/sichuan.geojson';

// ===================== 响应式数据 =====================
const router = useRouter();
const mapRef = ref(null);
const cityListRef = ref(null);
const map = ref(null);
const geoJsonLayer = ref(null);
const cityDistribution = ref([]);
const isLoading = ref(true);
const hasError = ref(false);
const errorMsg = ref('');
const hoveredCity = ref('');
const mapHeight = computed(() => MAP_CONFIG.height);

// ===================== 计算属性 =====================
// 按项目金额排序的城市列表
const sortedCityList = computed(() => {
  return [...cityDistribution.value].sort((a, b) => b.total_amount - a.total_amount);
});

// 总项目数
const totalProjects = computed(() => {
  return cityDistribution.value.reduce((sum, item) => sum + item.project_count, 0);
});

// 总合同金额
const totalAmount = computed(() => {
  return cityDistribution.value.reduce((sum, item) => Number(sum) + (Number(item.total_amount) || 0), 0);
});

// ===================== 生命周期 =====================
onMounted(async () => {
  try {
    // 并行加载数据和初始化地图
    await Promise.all([
      fetchCityDistribution(),
      initMap()
    ]);
    // 加载GeoJSON并渲染
    await loadGeoJSON();
  } catch (error) {
    handleError('地图初始化失败', error);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

// ===================== 核心方法 =====================

/**
 * 初始化Leaflet地图
 */
async function initMap() {
  return new Promise((resolve, reject) => {
    try {
      // 创建地图实例
      map.value = L.map(mapRef.value, {
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        zoomControl: true,
        attributionControl: false
      });

      // 添加天地图矢量底图
      const vecLayer = L.tileLayer(
        `https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TDT_KEY}`,
        {
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          maxZoom: 18,
          attribution: '天地图'
        }
      );

      // 添加天地图注记
      const cvaLayer = L.tileLayer(
        `https://t{s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TDT_KEY}`,
        {
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          maxZoom: 18
        }
      );

      vecLayer.addTo(map.value);
      cvaLayer.addTo(map.value);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 获取城市分布数据
 */
async function fetchCityDistribution() {
  try {
    const params = {};
    if (props.type) {
      params.type = props.type;
    }
    const res = await getCityDistribution(params);
    // 处理数据，添加阶段分布
    const cities = res.data || [];
    cityDistribution.value = cities.map(city => ({
      ...city,
      stageDistribution: city.stageDistribution || {}
    }));
    
    // 如果地图已初始化，重新渲染图层
    if (geoJsonLayer.value) {
      geoJsonLayer.value.eachLayer((layer) => {
        const cityName = layer.feature.properties.name;
        const cityData = getCityData(cityName);
        layer.setStyle(getCityStyle(cityData));
      });
    }
  } catch (error) {
    console.error('获取城市分布数据失败:', error);
    // 使用空数据，不影响地图显示
    cityDistribution.value = [];
  }
}

/**
 * 加载并渲染GeoJSON
 */
async function loadGeoJSON() {
  try {
    const response = await fetch(GEOJSON_PATH);
    if (!response.ok) {
      throw new Error(`GeoJSON加载失败：${response.status} ${response.statusText}`);
    }
    const geoJsonData = await response.json();
    renderGeoJSON(geoJsonData);
  } catch (error) {
    handleError('地图区域数据加载失败', error);
  }
}

/**
 * 渲染GeoJSON图层
 */
function renderGeoJSON(geoJsonData) {
  if (!map.value || !geoJsonData) return;

  // 创建GeoJSON图层
  geoJsonLayer.value = L.geoJSON(geoJsonData, {
    style: (feature) => {
      const cityName = feature.properties.name;
      const cityData = getCityData(cityName);
      return getCityStyle(cityData);
    },
    onEachFeature: (feature, layer) => {
      const cityName = feature.properties.name;
      const cityData = getCityData(cityName);
      
      // 绑定tooltip
      const tooltipContent = createTooltipContent(cityName, cityData);
      layer.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'top',
        className: 'city-tooltip'
      });

      // 绑定点击事件
      layer.on('click', (e) => {
        if (cityData && cityData.project_count > 0) {
          navigateToProjects(cityName);
        }
      });

      // 绑定悬停事件
      layer.on('mouseover', () => {
        hoveredCity.value = cityName;
        layer.setStyle({
          fillOpacity: 0.8,
          weight: 2
        });
        // 滚动右侧列表到对应位置
        scrollToCity(cityName);
      });

      layer.on('mouseout', () => {
        hoveredCity.value = '';
        layer.setStyle({
          fillOpacity: getCityStyle(cityData).fillOpacity,
          weight: 1
        });
      });
    }
  }).addTo(map.value);

  // 调整地图视野以适应所有区域
  map.value.fitBounds(geoJsonLayer.value.getBounds(), {
    padding: [20, 20]
  });
}

/**
 * 获取城市数据
 */
function getCityData(cityName) {
  return cityDistribution.value.find(c => c.city === cityName) || {
    city: cityName,
    project_count: 0,
    total_amount: 0,
    stageDistribution: {}
  };
}

/**
 * 获取城市样式
 */
function getCityStyle(cityData) {
  const count = cityData?.project_count || 0;
  let color = MAP_CONFIG.colors.none;
  let fillOpacity = 0.3;

  if (count >= 10) {
    color = MAP_CONFIG.colors.high;
    fillOpacity = 0.6;
  } else if (count >= 5) {
    color = MAP_CONFIG.colors.medium;
    fillOpacity = 0.5;
  } else if (count >= 1) {
    color = MAP_CONFIG.colors.low;
    fillOpacity = 0.4;
  }

  return {
    fillColor: color,
    fillOpacity: fillOpacity,
    color: '#606266',
    weight: 1,
    dashArray: count > 0 ? null : '3, 3'
  };
}

/**
 * 创建tooltip内容
 */
function createTooltipContent(cityName, cityData) {
  const count = cityData?.project_count || 0;
  const amount = cityData?.total_amount || 0;
  
  if (count === 0) {
    return `<div class="tooltip-content">
      <div class="tooltip-title">${cityName}</div>
      <div class="tooltip-empty">暂无项目</div>
    </div>`;
  }

  let stagesHtml = '';
  if (cityData.stageDistribution && Object.keys(cityData.stageDistribution).length > 0) {
    stagesHtml = '<div class="tooltip-stages">';
    for (const [stage, count] of Object.entries(cityData.stageDistribution)) {
      stagesHtml += `<span class="stage-tag" style="background:${STAGE_COLORS[stage] || '#909399'}">${stage}: ${count}</span>`;
    }
    stagesHtml += '</div>';
  }

  return `<div class="tooltip-content">
    <div class="tooltip-title">${cityName}</div>
    <div class="tooltip-row"><span>项目数:</span> <b>${count} 个</b></div>
    <div class="tooltip-row"><span>合同金额:</span> <b>${formatAmount(amount)} 万</b></div>
    ${stagesHtml}
    <div class="tooltip-hint">点击查看详情</div>
  </div>`;
}

/**
 * 跳转到项目列表
 */
function navigateToProjects(cityName) {
  router.push({
    path: '/projects',
    query: { city: cityName }
  });
}

// ===================== 事件处理 =====================

/**
 * 城市列表悬停
 */
function handleCityHover(city) {
  hoveredCity.value = city.city;
  
  // 高亮地图上的对应区域
  if (geoJsonLayer.value) {
    geoJsonLayer.value.eachLayer((layer) => {
      if (layer.feature.properties.name === city.city) {
        layer.setStyle({
          fillOpacity: 0.8,
          weight: 2
        });
        layer.openTooltip();
      }
    });
  }
}

/**
 * 滚动城市列表到指定城市
 */
function scrollToCity(cityName) {
  const listEl = cityListRef.value;
  const cityElement = listEl.querySelector(`[data-city="${cityName}"]`);

  if (cityElement) {
    // 计算列表需要滚动的位置（只滚动内部，不影响外层）
    const top = cityElement.offsetTop - listEl.offsetHeight / 2 + cityElement.offsetHeight / 2;
    
    // 平滑滚动
    listEl.scrollTo({
      top: top,
      behavior: 'smooth'
    });
  }
}

/**
 * 城市列表移出
 */
function handleCityLeave() {
  hoveredCity.value = '';
  
  // 恢复地图样式
  if (geoJsonLayer.value) {
    geoJsonLayer.value.eachLayer((layer) => {
      const cityName = layer.feature.properties.name;
      const cityData = getCityData(cityName);
      layer.setStyle(getCityStyle(cityData));
      layer.closeTooltip();
    });
  }
}

/**
 * 城市列表点击
 */
function handleCityClick(city) {
  if (city.project_count > 0) {
    navigateToProjects(city.city);
  }
}

// ===================== 辅助方法 =====================

/**
 * 获取项目数量标签类型
 */
function getProjectCountTagType(count) {
  if (count >= 10) return 'danger';
  if (count >= 5) return 'warning';
  if (count >= 1) return 'success';
  return 'info';
}

/**
 * 获取阶段标签类型
 */
function getStageTagType(stage) {
  const typeMap = {
    '意向': 'danger',
    '签约': 'warning',
    '建设': 'primary',
    '运营': 'primary',
    '交付': 'primary',
    '验收': 'success',
    '完结': 'info'
  };
  return typeMap[stage] || 'info';
}

/**
 * 错误处理
 */
function handleError(msg, error) {
  console.error(msg, error);
  hasError.value = true;
  errorMsg.value = msg;
}

// 监听 type 变化，重新获取数据
watch(() => props.type, () => {
  fetchCityDistribution();
});
</script>

<style scoped>
.sichuan-map-wrapper {
  display: flex;
  height: 520px;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 地图区域 */
.map-container {
  flex: 1;
  position: relative;
  background: #f5f7fa;
}

.tianditu-map {
  width: 100%;
  height: 100%;
}

.map-loading,
.map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 4px;
  font-size: 14px;
}

.map-loading {
  background: rgba(255, 255, 255, 0.95);
  color: #409EFF;
}

.map-loading .loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.map-error {
  background: rgba(245, 108, 108, 0.95);
  color: white;
}

/* 右侧城市面板 */
.city-panel {
  width: 360px;
  background: #fff;
  border-left: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
  font-size: 15px;
}

.panel-stats {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 13px;
  color: #606266;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #409EFF;
}

/* 城市列表 */
.city-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.city-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #f5f7fa;
  border: 1px solid transparent;
}

.city-item:hover {
  background: #ecf5ff;
  border-color: #409EFF;
}

.city-item.active {
  background: #409EFF;
  border-color: #409EFF;
}

.city-item.active .city-name,
.city-item.active .info-label,
.city-item.active .info-value {
  color: white;
}

.city-item:not(.has-projects) {
  opacity: 0.6;
  cursor: not-allowed;
}

.city-item:not(.has-projects):hover {
  background: #f5f7fa;
  border-color: transparent;
}

.city-item:not(.has-projects) .arrow-icon {
  display: none;
}

.city-main {
  flex: 1;
  min-width: 0;
}

.city-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.city-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.city-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.info-row.stages {
  flex-wrap: wrap;
}

.info-label {
  color: #909399;
  flex-shrink: 0;
}

.info-value {
  color: #606266;
}

.info-value.amount {
  color: #409EFF;
  font-weight: 500;
}

.stage-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.arrow-icon {
  color: #c0c4cc;
  font-size: 14px;
  margin-top: 4px;
  flex-shrink: 0;
}

.city-item.has-projects:hover .arrow-icon {
  color: #409EFF;
}

/* 图例 */
.panel-legend {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background: #f5f7fa;
}

.legend-title {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.color-box.high { background: #F56C6C; }
.color-box.medium { background: #E6A23C; }
.color-box.low { background: #67C23A; }
.color-box.none { background: #DCDFE6; }

/* 滚动条样式 */
.city-list::-webkit-scrollbar {
  width: 6px;
}

.city-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.city-list::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.city-list::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
</style>

<style>
/* 全局tooltip样式 */
.city-tooltip {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid #ebeef5 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
  padding: 12px !important;
  min-width: 180px;
}

.city-tooltip .tooltip-content {
  font-size: 13px;
}

.city-tooltip .tooltip-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.city-tooltip .tooltip-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #606266;
}

.city-tooltip .tooltip-row b {
  color: #409EFF;
}

.city-tooltip .tooltip-empty {
  color: #909399;
  text-align: center;
  padding: 8px 0;
}

.city-tooltip .tooltip-stages {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.city-tooltip .stage-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
  font-size: 11px;
}

.city-tooltip .tooltip-hint {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
  color: #909399;
  font-size: 12px;
  text-align: center;
}

/* Leaflet样式覆盖 */
.leaflet-container {
  font-family: inherit;
}

.leaflet-control-zoom {
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

.leaflet-control-zoom a {
  border-radius: 4px !important;
  background: white !important;
  color: #606266 !important;
  border: 1px solid #ebeef5 !important;
}

.leaflet-control-zoom a:hover {
  background: #f5f7fa !important;
  color: #409EFF !important;
}

/* 消除点击时的黑色焦点框 */
.leaflet-container:focus,
.leaflet-container *:focus {
  outline: none !important;
}

.leaflet-interactive:focus {
  outline: none !important;
}

/* 彻底消除所有可能的焦点样式 */
* {
  -webkit-tap-highlight-color: transparent;
}

.tianditu-map *:focus {
  outline: none !important;
  box-shadow: none !important;
}
</style>
