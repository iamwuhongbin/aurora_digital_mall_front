<template>
  <div class="dashboard">
    <h2>数据看板</h2>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Shop, User, Goods, ShoppingCart, Warning } from '@element-plus/icons-vue'
import request from '@/utils/request'

const stats = ref([
  { title: '商家总数', value: '0', icon: Shop, color: '#409eff', key: 'totalMerchants' },
  { title: '待审核商家', value: '0', icon: Warning, color: '#e6a23c', key: 'pendingMerchants' },
  { title: '用户总数', value: '0', icon: User, color: '#67c23a', key: 'totalCustomers' },
  { title: '商品总数', value: '0', icon: Goods, color: '#409eff', key: 'totalProducts' },
  { title: '待审核商品', value: '0', icon: Warning, color: '#e6a23c', key: 'pendingProducts' },
  { title: '订单总数', value: '0', icon: ShoppingCart, color: '#f56c6c', key: 'totalOrders' }
])

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

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.dashboard h2 {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
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
</style>
