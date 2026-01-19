<template>
  <div class="refund-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的退款</span>
        </div>
      </template>

      <!-- 状态筛选 -->
      <el-tabs v-model="activeStatus" @tab-change="handleStatusChange">
        <el-tab-pane label="全部" :name="0" />
        <el-tab-pane label="待审核" :name="1" />
        <el-tab-pane label="已同意" :name="2" />
        <el-tab-pane label="已拒绝" :name="3" />
        <el-tab-pane label="退货中" :name="4" />
        <el-tab-pane label="退款中" :name="5" />
        <el-tab-pane label="退款成功" :name="6" />
        <el-tab-pane label="退款失败" :name="7" />
      </el-tabs>

      <!-- 退款列表 -->
      <div class="refund-list" v-loading="loading">
        <div v-if="refundList.length === 0" class="empty-data">
          <el-empty description="暂无退款记录" />
        </div>

        <div v-else>
          <div v-for="refund in refundList" :key="refund.id" class="refund-item">
            <div class="refund-header">
              <div class="refund-info">
                <span class="refund-no">退款单号：{{ refund.refundNo }}</span>
                <el-tag :type="getStatusType(refund.status)" size="small">
                  {{ refund.statusText }}
                </el-tag>
              </div>
              <div class="order-no">订单号：{{ refund.orderNo }}</div>
            </div>

            <div class="refund-content">
              <div class="refund-detail">
                <div class="detail-item">
                  <span class="label">退款类型：</span>
                  <span>{{ refund.refundTypeText }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">退款原因：</span>
                  <span>{{ refund.refundReason }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">退款金额：</span>
                  <span class="amount">¥{{ refund.refundAmount }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">申请时间：</span>
                  <span>{{ formatTime(refund.applyTime) }}</span>
                </div>
              </div>

              <div class="refund-actions">
                <el-button size="small" @click="viewDetail(refund.id)">查看详情</el-button>
                
                <!-- 已同意且是退货退款，显示填写物流按钮 -->
                <el-button 
                  v-if="refund.status === 2 && refund.refundType === 2"
                  type="primary" 
                  size="small" 
                  @click="showReturnDialog(refund)"
                >
                  填写退货物流
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-if="total > 0"
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadRefundList"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>

    <!-- 填写退货物流对话框 -->
    <el-dialog v-model="showReturn" title="填写退货物流" width="500px">
      <el-form :model="returnForm" :rules="returnRules" ref="returnFormRef" label-width="100px">
        <el-form-item label="物流公司" prop="logisticsCompany">
          <el-input v-model="returnForm.logisticsCompany" placeholder="请输入物流公司" />
        </el-form-item>
        <el-form-item label="物流单号" prop="logisticsNo">
          <el-input v-model="returnForm.logisticsNo" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReturn = false">取消</el-button>
        <el-button type="primary" @click="submitReturn" :loading="returnLoading">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const activeStatus = ref(0)
const refundList = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)

const showReturn = ref(false)
const returnLoading = ref(false)
const returnFormRef = ref()
const currentRefund = ref<any>(null)
const returnForm = ref({
  logisticsCompany: '',
  logisticsNo: ''
})

const returnRules = {
  logisticsCompany: [{ required: true, message: '请输入物流公司', trigger: 'blur' }],
  logisticsNo: [{ required: true, message: '请输入物流单号', trigger: 'blur' }]
}

// 获取状态类型
const getStatusType = (status: number) => {
  const typeMap: Record<number, string> = {
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

// 加载退款列表
const loadRefundList = async () => {
  try {
    loading.value = true
    const params: any = {
      page: page.value,
      size: size.value
    }
    if (activeStatus.value > 0) {
      params.status = activeStatus.value
    }
    const res = await request.get('/refund/list', { params })
    refundList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('加载退款列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 状态切换
const handleStatusChange = () => {
  page.value = 1
  loadRefundList()
}

// 查看详情
const viewDetail = (id: number) => {
  router.push(`/customer/refund/${id}`)
}

// 显示退货对话框
const showReturnDialog = (refund: any) => {
  currentRefund.value = refund
  returnForm.value = {
    logisticsCompany: '',
    logisticsNo: ''
  }
  showReturn.value = true
}

// 提交退货物流
const submitReturn = async () => {
  try {
    await returnFormRef.value.validate()
    returnLoading.value = true
    
    await request.post(`/refund/${currentRefund.value.id}/return`, returnForm.value)
    
    ElMessage.success('退货物流已提交')
    showReturn.value = false
    loadRefundList()
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
    console.error(error)
  } finally {
    returnLoading.value = false
  }
}

onMounted(() => {
  loadRefundList()
})
</script>

<style scoped lang="scss">
.refund-list-container {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.refund-list {
  min-height: 400px;
}

.empty-data {
  padding: 60px 0;
}

.refund-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 15px;
  overflow: hidden;

  &:hover {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
}

.refund-header {
  background-color: #f5f7fa;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;

  .refund-info {
    display: flex;
    align-items: center;
    gap: 15px;

    .refund-no {
      font-size: 14px;
      color: #606266;
    }
  }

  .order-no {
    font-size: 12px;
    color: #909399;
  }
}

.refund-content {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.refund-detail {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  .detail-item {
    font-size: 14px;

    .label {
      color: #909399;
    }

    .amount {
      color: #f56c6c;
      font-weight: bold;
      font-size: 16px;
    }
  }
}

.refund-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
