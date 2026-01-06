<template>
  <div class="payment-return">
    <el-card class="result-card">
      <div v-if="loading" class="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>正在确认支付结果...</p>
      </div>

      <div v-else class="result-content">
        <div v-if="paymentSuccess" class="success">
          <el-icon class="success-icon"><CircleCheck /></el-icon>
          <h2>支付成功！</h2>
          <p>您的订单已支付成功，我们将尽快为您发货</p>
          <div class="order-info">
            <p>订单编号：{{ orderSn }}</p>
          </div>
          <div class="actions">
            <el-button type="primary" @click="goToOrderDetail">查看订单详情</el-button>
            <el-button @click="goToOrders">我的订单</el-button>
          </div>
        </div>

        <div v-else class="failed">
          <el-icon class="failed-icon"><CircleClose /></el-icon>
          <h2>支付失败</h2>
          <p>{{ errorMessage || '支付未完成或已取消' }}</p>
          <div class="actions">
            <el-button type="primary" @click="retryPayment">重新支付</el-button>
            <el-button @click="goToOrders">返回订单列表</el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const paymentSuccess = ref(false)
const errorMessage = ref('')
const orderSn = ref('')
const orderId = ref('')

onMounted(async () => {
  // 从URL参数获取支付宝返回的信息
  const params = route.query
  orderSn.value = params.out_trade_no as string || ''
  const tradeStatus = params.trade_status as string || ''
  
  if (!orderSn.value) {
    errorMessage.value = '订单信息不存在'
    loading.value = false
    return
  }
  
  // 查询支付状态
  await checkPaymentStatus()
})

const checkPaymentStatus = async () => {
  try {
    const res = await request.get('/payment/alipay/query', {
      params: { orderSn: orderSn.value }
    })
    
    if (res.code === 200) {
      const status = res.data
      if (status === 'TRADE_SUCCESS' || status === 'TRADE_FINISHED') {
        paymentSuccess.value = true
        // 获取订单ID
        await getOrderId()
      } else {
        paymentSuccess.value = false
        errorMessage.value = '支付未完成'
      }
    } else {
      paymentSuccess.value = false
      errorMessage.value = res.message || '查询支付状态失败'
    }
  } catch (error: any) {
    paymentSuccess.value = false
    errorMessage.value = error.message || '查询支付状态失败'
  } finally {
    loading.value = false
  }
}

const getOrderId = async () => {
  try {
    const res = await request.get('/order/list', {
      params: { page: 1, size: 1 }
    })
    if (res.code === 200 && res.data?.list?.length > 0) {
      const order = res.data.list.find((o: any) => o.orderSn === orderSn.value)
      if (order) {
        orderId.value = order.id
      }
    }
  } catch (error) {
    console.error('获取订单ID失败', error)
  }
}

const goToOrderDetail = () => {
  // 清除当前历史记录，避免返回时重新触发支付返回页面
  if (orderId.value) {
    window.history.replaceState(null, '', `/customer/order/${orderId.value}`)
    router.push(`/customer/order/${orderId.value}`)
  } else {
    window.history.replaceState(null, '', '/customer/orders')
    router.push('/customer/orders')
  }
}

const goToOrders = () => {
  // 清除当前历史记录，避免返回时重新触发支付返回页面
  window.history.replaceState(null, '', '/customer/orders')
  router.push('/customer/orders')
}

const retryPayment = () => {
  if (orderId.value) {
    router.push(`/customer/payment?orderId=${orderId.value}`)
  } else {
    router.push('/customer/orders')
  }
}
</script>

<style scoped>
.payment-return {
  min-height: calc(100vh - 60px);
  background-color: #f5f5f5;
  padding: 60px 30px;
}

.result-card {
  max-width: 600px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.loading .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.result-content {
  text-align: center;
  padding: 40px 20px;
}

.success .success-icon {
  font-size: 80px;
  color: #67c23a;
  margin-bottom: 20px;
}

.failed .failed-icon {
  font-size: 80px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.result-content h2 {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #303133;
}

.result-content p {
  font-size: 14px;
  color: #606266;
  margin-bottom: 20px;
}

.order-info {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  margin: 20px 0;
}

.order-info p {
  margin: 0;
  color: #303133;
  font-size: 14px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
}
</style>
