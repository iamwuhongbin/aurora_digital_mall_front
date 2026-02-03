<template>
  <div class="dashboard">
    <h2>数据看板</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20">
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
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 订单趋势图 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单趋势（最近7天）</span>
            </div>
          </template>
          <div ref="orderTrendChart" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>

      <!-- 销售额趋势图 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>销售额趋势（最近7天）</span>
            </div>
          </template>
          <div ref="salesTrendChart" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 订单状态分布 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单状态分布</span>
            </div>
          </template>
          <div ref="orderStatusChart" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>

      <!-- 商品销量排行 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>商品销量排行（TOP 10）</span>
            </div>
          </template>
          <div ref="topProductsChart" style="width: 100%; height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Shop, User, Goods, ShoppingCart, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const stats = ref([
  { title: '商家总数', value: '0', icon: Shop, color: '#409eff', key: 'totalMerchants' },
  { title: '待审核商家', value: '0', icon: Warning, color: '#e6a23c', key: 'pendingMerchants' },
  { title: '用户总数', value: '0', icon: User, color: '#67c23a', key: 'totalCustomers' },
  { title: '商品总数', value: '0', icon: Goods, color: '#409eff', key: 'totalProducts' },
  { title: '待审核商品', value: '0', icon: Warning, color: '#e6a23c', key: 'pendingProducts' },
  { title: '订单总数', value: '0', icon: ShoppingCart, color: '#f56c6c', key: 'totalOrders' }
])

const orderTrendChart = ref()
const salesTrendChart = ref()
const orderStatusChart = ref()
const topProductsChart = ref()

const loadStatistics = async () => {
  try {
    const res = await request.get('/admin/statistics')
    stats.value.forEach(item => {
      if (res.data[item.key] !== undefined) {
        item.value = res.data[item.key].toString()
      }
    })
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

const loadTrendData = async () => {
  try {
    const res = await request.get('/admin/statistics/trend', { params: { days: 7 } })
    await nextTick()
    
    // 订单趋势图
    if (orderTrendChart.value && res.data.orderTrend) {
      const chart = echarts.init(orderTrendChart.value)
      const dates = res.data.orderTrend.map((item: any) => item.date)
      const counts = res.data.orderTrend.map((item: any) => item.count)
      
      chart.setOption({
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: counts,
          type: 'line',
          smooth: true,
          areaStyle: {
            color: 'rgba(64, 158, 255, 0.2)'
          },
          itemStyle: {
            color: '#409eff'
          }
        }]
      })
    }
    
    // 销售额趋势图
    if (salesTrendChart.value && res.data.salesTrend) {
      const chart = echarts.init(salesTrendChart.value)
      const dates = res.data.salesTrend.map((item: any) => item.date)
      const amounts = res.data.salesTrend.map((item: any) => item.amount)
      
      chart.setOption({
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>销售额: ¥{c}'
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        series: [{
          data: amounts,
          type: 'bar',
          itemStyle: {
            color: '#67c23a'
          }
        }]
      })
    }
  } catch (error) {
    console.error('加载趋势数据失败', error)
  }
}

const loadOrderStatusDistribution = async () => {
  try {
    const res = await request.get('/admin/statistics/order-status')
    await nextTick()
    
    if (orderStatusChart.value && res.data.distribution) {
      const chart = echarts.init(orderStatusChart.value)
      const data = res.data.distribution.map((item: any) => ({
        name: item.statusText,
        value: item.count
      }))
      
      chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [{
          type: 'pie',
          radius: '60%',
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      })
    }
  } catch (error) {
    console.error('加载订单状态分布失败', error)
  }
}

const loadTopProducts = async () => {
  try {
    const res = await request.get('/admin/statistics/top-products', { params: { limit: 10 } })
    await nextTick()
    
    if (topProductsChart.value && res.data.products) {
      const chart = echarts.init(topProductsChart.value)
      const names = res.data.products.map((item: any) => item.productName)
      const sales = res.data.products.map((item: any) => item.salesVolume)
      
      chart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'category',
          data: names,
          axisLabel: {
            interval: 0,
            formatter: function(value: string) {
              return value.length > 10 ? value.substring(0, 10) + '...' : value
            }
          }
        },
        series: [{
          type: 'bar',
          data: sales,
          itemStyle: {
            color: '#f56c6c'
          }
        }]
      })
    }
  } catch (error) {
    console.error('加载商品排行失败', error)
  }
}

onMounted(() => {
  loadStatistics()
  loadTrendData()
  loadOrderStatusDistribution()
  loadTopProducts()
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

.stat-card {
  margin-bottom: 20px;
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
}

.card-header {
  font-weight: bold;
  color: #303133;
}
</style>
