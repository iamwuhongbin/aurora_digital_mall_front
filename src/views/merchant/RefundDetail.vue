<template>
  <div class="refund-detail-container">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <h2>退款详情</h2>
      </template>
    </el-page-header>

    <div class="detail-content" v-loading="loading">
      <!-- 退款状态 -->
      <el-card class="status-card">
        <div class="status-info">
          <el-tag :type="getStatusType(refund.status)" size="large">
            {{ refund.statusText }}
          </el-tag>
          <div class="status-time">
            <p>申请时间：{{ formatTime(refund.applyTime) }}</p>
            <p v-if="refund.approveTime">审核时间：{{ formatTime(refund.approveTime) }}</p>
            <p v-if="refund.refundTime">退款时间：{{ formatTime(refund.refundTime) }}</p>
          </div>
        </div>
      </el-card>

      <!-- 商品信息 -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">商品信息</span>
        </template>
        <div class="order-items">
          <div v-for="item in refund.orderItems" :key="item.productId" class="order-item">
            <el-image 
              :src="item.productImage" 
              fit="cover"
              class="product-image"
            />
            <div class="item-info">
              <div class="product-name">{{ item.productName }}</div>
              <div class="product-price">¥{{ item.productPrice }}</div>
            </div>
            <div class="item-quantity">x{{ item.quantity }}</div>
            <div class="item-total">¥{{ item.totalAmount }}</div>
          </div>
        </div>
      </el-card>

      <!-- 退款信息 -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">退款信息</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="退款单号">{{ refund.refundNo }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ refund.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="退款类型">{{ refund.refundTypeText }}</el-descriptions-item>
          <el-descriptions-item label="退款金额">
            <span class="amount">¥{{ refund.refundAmount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="退款原因">{{ refund.refundReason }}</el-descriptions-item>
          <el-descriptions-item label="买家">{{ refund.customerName }}</el-descriptions-item>
          <el-descriptions-item label="退款说明" :span="2">
            {{ refund.refundDescription || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 退款凭证图片 -->
        <div v-if="refund.refundImages && refund.refundImages.length > 0" class="refund-images">
          <h4>退款凭证</h4>
          <div class="image-list">
            <el-image
              v-for="(img, index) in refund.refundImages"
              :key="index"
              :src="img"
              :preview-src-list="refund.refundImages"
              fit="cover"
              class="refund-image"
            />
          </div>
        </div>
      </el-card>

      <!-- 退货物流信息 -->
      <el-card class="section-card" v-if="refund.returnLogisticsNo">
        <template #header>
          <span class="card-title">退货物流信息</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="物流公司">{{ refund.returnLogisticsCompany }}</el-descriptions-item>
          <el-descriptions-item label="物流单号">{{ refund.returnLogisticsNo }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ formatTime(refund.returnTime) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 审核信息 -->
      <el-card class="section-card" v-if="refund.approveTime">
        <template #header>
          <span class="card-title">审核信息</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="审核结果">
            <el-tag :type="refund.status === 3 ? 'danger' : 'success'">
              {{ refund.status === 3 ? '已拒绝' : '已同意' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ formatTime(refund.approveTime) }}</el-descriptions-item>
          <el-descriptions-item label="审核备注" :span="2">
            {{ refund.approveRemark || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 退款日志 -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">退款日志</span>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="log in refund.logs"
            :key="log.id"
            :timestamp="formatTime(log.createdAt)"
            placement="top"
          >
            <div class="log-content">
              <div class="log-status">{{ log.statusText }}</div>
              <div class="log-remark" v-if="log.remark">{{ log.remark }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons" v-if="refund.status">
        <!-- 待审核状态 (状态1) -->
        <template v-if="refund.status === 1">
          <el-button type="primary" @click="showApproveDialog(true)">同意退款</el-button>
          <el-button type="danger" @click="showApproveDialog(false)">拒绝退款</el-button>
        </template>

        <!-- 退货中状态 (状态4) -->
        <template v-if="refund.status === 4">
          <el-button 
            type="primary" 
            @click="confirmReceive"
          >
            确认收货并退款
          </el-button>
        </template>

        <!-- 如果没有可操作的按钮，显示提示 -->
        <div v-if="![1, 4].includes(refund.status)" class="no-action-tip">
          <el-text type="info">当前状态：{{ refund.statusText }}，无需操作</el-text>
        </div>
      </div>
    </div>

    <!-- 审核对话框 -->
    <el-dialog v-model="showApprove" :title="approveType ? '同意退款' : '拒绝退款'" width="500px">
      <el-form :model="approveForm" label-width="80px">
        <el-form-item :label="approveType ? '审核备注' : '拒绝原因'" :required="!approveType">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="4"
            :placeholder="approveType ? '请输入审核备注（可选）' : '请输入拒绝原因'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApprove = false">取消</el-button>
        <el-button type="primary" @click="submitApprove" :loading="approveLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const refund = ref<any>({
  logs: []
})

const showApprove = ref(false)
const approveType = ref(true)
const approveForm = ref({
  approve: true,
  remark: ''
})
const approveLoading = ref(false)

// 加载退款详情
const loadRefundDetail = async () => {
  try {
    loading.value = true
    const res = await request.get(`/merchant/refund/${route.params.id}`)
    refund.value = res.data || { logs: [] }
  } catch (error) {
    ElMessage.error('加载退款详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取状态类型
const getStatusType = (status: number) => {
  const typeMap: any = {
    1: 'warning',
    2: 'success',
    3: 'danger',
    4: 'primary',
    5: 'primary',
    6: 'success',
    7: 'danger',
    8: 'info'
  }
  return typeMap[status] || 'info'
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 显示审核对话框
const showApproveDialog = (approve: boolean) => {
  approveType.value = approve
  approveForm.value = {
    approve: approve,
    remark: ''
  }
  showApprove.value = true
}

// 提交审核
const submitApprove = async () => {
  try {
    if (!approveType.value && !approveForm.value.remark) {
      ElMessage.warning('请输入拒绝原因')
      return
    }

    approveLoading.value = true
    
    await request.post(`/merchant/refund/${refund.value.id}/approve`, approveForm.value)
    
    ElMessage.success(approveType.value ? '已同意退款' : '已拒绝退款')
    showApprove.value = false
    loadRefundDetail()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
    console.error(error)
  } finally {
    approveLoading.value = false
  }
}

// 确认收货
const confirmReceive = async () => {
  try {
    await ElMessageBox.confirm(
      '确认已收到买家退回的商品吗？确认后将自动退款给买家',
      '确认收货',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await request.post(`/merchant/refund/${refund.value.id}/confirm-receive`)
    ElMessage.success('确认收货成功，退款处理中')
    loadRefundDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
      console.error(error)
    }
  }
}

onMounted(() => {
  loadRefundDetail()
})
</script>

<style scoped>
.refund-detail-container {
  padding: 20px;
}

.detail-content {
  margin-top: 20px;
}

.status-card {
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-time {
  flex: 1;
}

.status-time p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.section-card {
  margin-bottom: 20px;
}

.card-title {
  font-weight: bold;
  font-size: 16px;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}

.refund-images {
  margin-top: 20px;
}

.refund-images h4 {
  margin-bottom: 10px;
  color: #666;
}

.image-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.refund-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  cursor: pointer;
}

.log-content {
  padding: 5px 0;
}

.log-status {
  font-weight: bold;
  margin-bottom: 5px;
}

.log-remark {
  color: #666;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

/* 商品信息 */
.order-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  gap: 15px;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  font-size: 14px;
  color: #909399;
}

.item-quantity {
  font-size: 14px;
  color: #606266;
  padding: 0 20px;
}

.item-total {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
  min-width: 80px;
  text-align: right;
}

.no-action-tip {
  text-align: center;
  padding: 10px;
  color: #909399;
}
</style>
