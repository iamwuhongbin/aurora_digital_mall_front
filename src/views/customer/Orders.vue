<template>
  <div class="orders">
    <h2>我的订单</h2>
    <el-card>
      <el-table :data="orders" style="width: 100%">
        <el-table-column prop="orderNumber" label="订单号" width="200" />
        <el-table-column prop="totalAmount" label="订单金额" />
        <el-table-column label="订单状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.orderStatus)">
              {{ getStatusText(row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row.id)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const orders = ref<any[]>([])

const getStatusType = (status: number) => {
  const types: any = { 1: 'info', 2: 'warning', 3: 'primary', 4: 'success', 5: 'success' }
  return types[status] || 'info'
}

const getStatusText = (status: number) => {
  const texts: any = { 1: '待付款', 2: '待发货', 3: '待收货', 4: '待评价', 5: '已完成' }
  return texts[status] || '未知'
}

const viewDetail = (id: number) => {
  console.log('查看订单', id)
}
</script>

<style scoped>
.orders h2 {
  margin-bottom: 20px;
}
</style>
