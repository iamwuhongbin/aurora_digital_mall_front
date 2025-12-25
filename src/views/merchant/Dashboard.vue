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
import { ref } from 'vue'
import { Goods, ShoppingCart, Money, Star } from '@element-plus/icons-vue'

const stats = ref([
  { title: '商品总数', value: '0', icon: Goods, color: '#409eff' },
  { title: '待处理订单', value: '0', icon: ShoppingCart, color: '#67c23a' },
  { title: '今日销售额', value: '¥0', icon: Money, color: '#e6a23c' },
  { title: '待回复评价', value: '0', icon: Star, color: '#f56c6c' }
])
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
