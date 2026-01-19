<template>
  <div class="dashboard">
    <h2>数据看板</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="item in stats" :key="item.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: item.color }">
              <el-icon :size="32"><component :is="item.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-title">{{ item.title }}</p>
              <p class="stat-value">{{ item.value }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <!-- 销售趋势折线图 -->
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>近7日销售趋势</span>
            </div>
          </template>
          <div ref="salesChartRef" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>

      <!-- 订单状态饼图 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单状态分布</span>
            </div>
          </template>
          <div ref="orderChartRef" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 商品销售排行 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>商品销售排行 TOP 10</span>
            </div>
          </template>
          <div ref="productChartRef" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Goods, ShoppingCart, Money, Star } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import axios from 'axios'

const stats = ref([
  { title: '商品总数', value: '0', icon: Goods, color: '#409eff' },
  { title: '待处理订单', value: '0', icon: ShoppingCart, color: '#67c23a' },
  { title: '今日销售额', value: '¥0', icon: Money, color: '#e6a23c' },
  { title: '待回复评价', value: '0', icon: Star, color: '#f56c6c' }
])

const salesChartRef = ref<HTMLElement>()
const orderChartRef = ref<HTMLElement>()
const productChartRef = ref<HTMLElement>()

let salesChart: echarts.ECharts | null = null
let orderChart: echarts.ECharts | null = null
let productChart: echarts.ECharts | null = null

// 加载统计数据
const loadStatistics = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:8080/api/merchant/statistics', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (response.data.code === 200) {
      const data = response.data.data
      stats.value[0].value = data.productCount || '0'
      stats.value[1].value = data.pendingOrderCount || '0'
      stats.value[2].value = `¥${data.todaySales || '0'}`
      stats.value[3].value = data.pendingReviewCount || '0'
      
      // 更新图表数据
      updateSalesChart(data.salesTrend || [])
      updateOrderChart(data.orderStatus || {})
      updateProductChart(data.topProducts || [])
    }
  } catch (error) {
    console.error('加载统计数据失败', error)
    // 使用模拟数据
    loadMockData()
  }
}

// 加载模拟数据
const loadMockData = () => {
  stats.value[0].value = '128'
  stats.value[1].value = '23'
  stats.value[2].value = '¥12,580'
  stats.value[3].value = '5'
  
  // 模拟销售趋势数据
  const mockSalesTrend = [
    { date: '01-01', sales: 3200 },
    { date: '01-02', sales: 4100 },
    { date: '01-03', sales: 3800 },
    { date: '01-04', sales: 5200 },
    { date: '01-05', sales: 4800 },
    { date: '01-06', sales: 6100 },
    { date: '01-07', sales: 5500 }
  ]
  updateSalesChart(mockSalesTrend)
  
  // 模拟订单状态数据
  const mockOrderStatus = {
    pending: 23,
    processing: 15,
    shipped: 42,
    completed: 156,
    cancelled: 8
  }
  updateOrderChart(mockOrderStatus)
  
  // 模拟商品销售排行
  const mockTopProducts = [
    { name: 'iPhone 15 Pro', sales: 45 },
    { name: 'MacBook Pro', sales: 38 },
    { name: 'AirPods Pro', sales: 67 },
    { name: 'iPad Air', sales: 32 },
    { name: 'Apple Watch', sales: 28 },
    { name: 'Magic Keyboard', sales: 25 },
    { name: 'Magic Mouse', sales: 22 },
    { name: 'HomePod', sales: 18 },
    { name: 'AirTag', sales: 15 },
    { name: 'MagSafe充电器', sales: 12 }
  ]
  updateProductChart(mockTopProducts)
}

// 更新销售趋势图表
const updateSalesChart = (data: any[]) => {
  if (!salesChart || !data.length) return
  
  const dates = data.map(item => item.date)
  const sales = data.map(item => item.sales)
  
  salesChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
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
      data: dates
    },
    yAxis: {
      type: 'value',
      name: '销售额(元)'
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        itemStyle: { color: '#409eff' },
        data: sales
      }
    ]
  })
}

// 更新订单状态图表
const updateOrderChart = (data: any) => {
  if (!orderChart) return
  
  const chartData = [
    { value: data.pending || 0, name: '待处理' },
    { value: data.processing || 0, name: '处理中' },
    { value: data.shipped || 0, name: '已发货' },
    { value: data.completed || 0, name: '已完成' },
    { value: data.cancelled || 0, name: '已取消' }
  ]
  
  orderChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '订单状态',
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
          formatter: '{b}: {c}'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: chartData
      }
    ]
  })
}

// 更新商品销售排行图表
const updateProductChart = (data: any[]) => {
  if (!productChart || !data.length) return
  
  const products = data.map(item => item.name)
  const sales = data.map(item => item.sales)
  
  productChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '销量'
    },
    yAxis: {
      type: 'category',
      data: products
    },
    series: [
      {
        name: '销量',
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: '#188df0' }
          ])
        },
        data: sales
      }
    ]
  })
}

// 初始化图表
const initCharts = () => {
  if (salesChartRef.value) {
    salesChart = echarts.init(salesChartRef.value)
  }
  if (orderChartRef.value) {
    orderChart = echarts.init(orderChartRef.value)
  }
  if (productChartRef.value) {
    productChart = echarts.init(productChartRef.value)
  }
  
  // 窗口大小改变时重新调整图表
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  salesChart?.resize()
  orderChart?.resize()
  productChart?.resize()
}

onMounted(() => {
  initCharts()
  loadStatistics()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  salesChart?.dispose()
  orderChart?.dispose()
  productChart?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.dashboard h2 {
  margin-bottom: 20px;
  color: #303133;
}

.stats-row {
  margin-bottom: 20px;
}

.charts-row {
  margin-bottom: 20px;
}

.stat-card {
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-title {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  color: #303133;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.card-header {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}
</style>
