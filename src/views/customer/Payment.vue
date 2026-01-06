<template>
  <div class="payment-page">
    <el-card class="payment-card">
      <template #header>
        <div class="card-header">
          <span>订单支付</span>
        </div>
      </template>

      <div v-if="loading" class="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <p>正在创建支付...</p>
      </div>

      <div v-else-if="paymentForm" class="payment-content">
        <div class="order-info">
          <h3>订单信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单编号">{{ orderInfo.orderSn }}</el-descriptions-item>
            <el-descriptions-item label="订单金额">
              <span class="amount">¥{{ orderInfo.payAmount }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="payment-method">
          <h3>支付方式</h3>
          <div class="method-item selected">
            <el-icon><CreditCard /></el-icon>
            <span>支付宝支付</span>
          </div>
        </div>

        <div class="payment-tips">
          <el-alert
            title="支付提示"
            type="info"
            :closable="false"
          >
            <p>1. 点击"立即支付"按钮后，将跳转到支付宝收银台</p>
            <p>2. 请在30分钟内完成支付，超时订单将自动取消</p>
            <p>3. 支付完成后请返回查看订单状态</p>
          </el-alert>
        </div>

        <div class="payment-actions">
          <el-button @click="goBack">返回订单</el-button>
          <el-button type="primary" size="large" @click="submitPayment">
            立即支付 ¥{{ orderInfo.payAmount }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, CreditCard } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const orderInfo = ref<any>({})
const paymentForm = ref('')

const orderId = route.query.orderId

onMounted(async () => {
  if (!orderId) {
    ElMessage.error('订单ID不存在')
    router.push('/customer/orders')
    return
  }
  
  await loadOrderInfo()
})

const loadOrderInfo = async () => {
  try {
    loading.value = true
    const res = await request.get(`/order/${orderId}`)
    orderInfo.value = res.data
    
    if (orderInfo.value.orderStatus !== 1) {
      ElMessage.warning('订单状态不正确，无法支付')
      router.push(`/customer/order/${orderId}`)
      return
    }
    
    paymentForm.value = 'ready'
  } catch (error: any) {
    ElMessage.error(error.message || '加载订单信息失败')
    router.push('/customer/orders')
  } finally {
    loading.value = false
  }
}

const submitPayment = async () => {
  try {
    loading.value = true
    const res = await request.post('/payment/alipay/create', null, {
      params: { orderId: orderId }
    })
    
    if (res.code === 200) {
      // 创建一个div来承载支付宝返回的form表单
      const div = document.createElement('div')
      div.innerHTML = res.data
      document.body.appendChild(div)
      
      // 自动提交表单跳转到支付宝
      const form = div.querySelector('form')
      if (form) {
        form.submit()
      }
    } else {
      ElMessage.error(res.message || '创建支付失败')
      loading.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.message || '创建支付失败')
    loading.value = false
  }
}

const goBack = () => {
  router.push(`/customer/order/${orderId}`)
}
</script>

<style scoped>
.payment-page {
  min-height: calc(100vh - 60px);
  background-color: #f5f5f5;
  padding: 30px;
}

.payment-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: 500;
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

.payment-content {
  padding: 20px 0;
}

.order-info,
.payment-method,
.payment-tips {
  margin-bottom: 30px;
}

.order-info h3,
.payment-method h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #303133;
}

.amount {
  font-size: 20px;
  font-weight: bold;
  color: #ff6700;
}

.method-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.method-item.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.method-item .el-icon {
  font-size: 24px;
  color: #409eff;
}

.method-item span {
  font-size: 15px;
  font-weight: 500;
}

.payment-tips :deep(.el-alert__content) p {
  margin: 4px 0;
  font-size: 13px;
}

.payment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
