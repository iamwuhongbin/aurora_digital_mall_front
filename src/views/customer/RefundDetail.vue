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
          <el-descriptions-item label="商家">{{ refund.merchantName }}</el-descriptions-item>
          <el-descriptions-item label="退款说明" :span="2">
            {{ refund.refundDescription || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 退款凭证图片 -->
        <div v-if="refund.refundImages" class="refund-images">
          <h4>退款凭证</h4>
          <div class="image-list">
            <el-image
              v-for="(img, index) in refund.refundImages.split(',')"
              :key="index"
              :src="img"
              :preview-src-list="refund.refundImages.split(',')"
              fit="cover"
              class="refund-image"
            />
          </div>
        </div>
      </el-card>

      <!-- 退货物流信息 -->
      <el-card class="section-card" v-if="refund.status === 2 && refund.refundType === 2">
        <template #header>
          <span class="card-title">退货物流信息</span>
        </template>
        <div v-if="!refund.returnLogisticsNo">
          <el-alert
            title="请填写退货物流信息"
            type="warning"
            description="商家已同意退款，请尽快将商品寄回并填写物流信息"
            :closable="false"
          />
          <el-form :model="logisticsForm" label-width="100px" style="margin-top: 20px; max-width: 500px;">
            <el-form-item label="物流公司">
              <el-input v-model="logisticsForm.logisticsCompany" placeholder="请输入物流公司" />
            </el-form-item>
            <el-form-item label="物流单号">
              <el-input v-model="logisticsForm.logisticsNo" placeholder="请输入物流单号" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitLogistics" :loading="logisticsLoading">
                提交物流信息
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        <el-descriptions v-else :column="2" border>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const refund = ref<any>({
  logs: []
})

const logisticsForm = ref({
  logisticsCompany: '',
  logisticsNo: ''
})
const logisticsLoading = ref(false)

// 加载退款详情
const loadRefundDetail = async () => {
  try {
    loading.value = true
    const res = await request.get(`/refund/${route.params.id}`)
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

// 提交物流信息
const submitLogistics = async () => {
  try {
    if (!logisticsForm.value.logisticsCompany || !logisticsForm.value.logisticsNo) {
      ElMessage.warning('请填写完整的物流信息')
      return
    }

    logisticsLoading.value = true
    
    await request.post(`/refund/${refund.value.id}/return`, logisticsForm.value)
    
    ElMessage.success('物流信息提交成功')
    loadRefundDetail()
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
    console.error(error)
  } finally {
    logisticsLoading.value = false
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
</style>
