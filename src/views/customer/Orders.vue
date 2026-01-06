<template>
  <div class="orders-container">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <h2>我的订单</h2>
      </template>
    </el-page-header>

    <div class="orders-content">
      <!-- 订单状态筛选 -->
      <el-card class="filter-card">
        <el-radio-group v-model="statusFilter" @change="loadOrders">
          <el-radio-button :label="0">全部</el-radio-button>
          <el-radio-button :label="1">待付款</el-radio-button>
          <el-radio-button :label="2">待发货</el-radio-button>
          <el-radio-button :label="3">待收货</el-radio-button>
          <el-radio-button :label="4">待评价</el-radio-button>
          <el-radio-button :label="5">已完成</el-radio-button>
          <el-radio-button :label="6">已取消</el-radio-button>
        </el-radio-group>
      </el-card>

      <!-- 订单列表 -->
      <div v-loading="loading">
        <el-empty v-if="orders.length === 0" description="暂无订单">
          <el-button type="primary" @click="$router.push('/customer/products')">去逛逛</el-button>
        </el-empty>

        <el-card v-for="order in orders" :key="order.id" class="order-card">
          <template #header>
            <div class="order-header">
              <div class="order-info">
                <span class="order-sn">订单号：{{ order.orderSn }}</span>
                <span class="shop-name">{{ order.shopName }}</span>
              </div>
              <el-tag :type="getStatusType(order.orderStatus)" size="large">
                {{ order.orderStatusText }}
              </el-tag>
            </div>
          </template>

          <div class="order-body">
            <div class="order-product">
              <el-image :src="order.productImage" class="product-image" fit="cover" />
              <div class="product-info">
                <div class="item-count">共 {{ order.itemCount }} 件商品</div>
              </div>
            </div>

            <div class="order-amount">
              <div class="amount-label">订单金额</div>
              <div class="amount-value">¥{{ order.payAmount }}</div>
            </div>

            <div class="order-actions">
              <el-button size="small" @click="viewDetail(order.id)">查看详情</el-button>
              <el-button v-if="order.orderStatus === 1" type="danger" size="small" @click="cancelOrder(order.id)">取消订单</el-button>
              <el-button v-if="order.orderStatus === 1" type="primary" size="small" @click="payOrder(order.id)">去支付</el-button>
              <el-button v-if="order.orderStatus === 3" type="primary" size="small" @click="confirmReceive(order.id)">确认收货</el-button>
            </div>
          </div>

          <div class="order-footer">
            <span class="order-time">下单时间：{{ formatTime(order.createdAt) }}</span>
          </div>
        </el-card>

        <!-- 分页 -->
        <el-pagination
          v-if="total > 0"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadOrders"
          @size-change="loadOrders"
          class="pagination"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const orders = ref<any[]>([])
const statusFilter = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadOrders = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value
    }
    
    if (statusFilter.value > 0) {
      params.status = statusFilter.value
    }
    
    const res = await request.get('/order/list', { params })
    orders.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('加载订单列表失败', error)
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: number) => {
  const types: any = { 
    1: 'warning', 
    2: 'primary', 
    3: 'primary', 
    4: 'success', 
    5: 'success',
    6: 'info'
  }
  return types[status] || 'info'
}

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const viewDetail = (id: number) => {
  router.push(`/customer/order/${id}`)
}

const cancelOrder = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要取消订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request.put(`/order/${id}/cancel`)
    ElMessage.success('订单已取消')
    loadOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('取消订单失败')
    }
  }
}

const payOrder = (id: number) => {
  router.push(`/customer/payment?orderId=${id}`)
}

const confirmReceive = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    await request.put(`/order/${id}/receive`)
    ElMessage.success('确认收货成功')
    loadOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('确认收货失败')
    }
  }
}

onMounted(() => {
  loadOrders()
})

// 页面激活时重新加载订单列表（从支付页面返回时会触发）
onActivated(() => {
  loadOrders()
})

// 监听路由查询参数变化，支付完成返回时刷新订单列表
watch(() => route.query.refresh, (newVal) => {
  if (newVal) {
    loadOrders()
  }
})
</script>

<style scoped>
.orders-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.orders-content {
  margin-top: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.order-card {
  margin-bottom: 20px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.order-sn {
  font-size: 14px;
  color: #606266;
}

.shop-name {
  font-size: 14px;
  color: #909399;
}

.order-body {
  display: flex;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.order-product {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
}

.item-count {
  font-size: 14px;
  color: #606266;
}

.order-amount {
  width: 150px;
  text-align: center;
  padding: 0 20px;
}

.amount-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.amount-value {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.order-actions {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.order-actions .el-button {
  width: 100px;
}

.order-footer {
  padding-top: 15px;
}

.order-time {
  font-size: 12px;
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
