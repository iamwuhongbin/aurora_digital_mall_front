<template>
  <div class="merchant-refund-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>退款管理</span>
        </div>
      </template>

      <!-- 状态筛选 -->
      <el-tabs v-model="activeStatus" @tab-change="handleStatusChange">
        <el-tab-pane label="全部" :name="0" />
        <el-tab-pane label="待审核" :name="1">
          <template #label>
            <el-badge :value="pendingCount" :hidden="pendingCount === 0">
              待审核
            </el-badge>
          </template>
        </el-tab-pane>
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
              <div class="customer-info">
                <span>买家：{{ refund.customerName }}</span>
                <span class="order-no">订单号：{{ refund.orderNo }}</span>
              </div>
            </div>

            <div class="refund-content">
              <div class="refund-detail">
                <div class="detail-row">
                  <div class="detail-item">
                    <span class="label">退款类型：</span>
                    <span>{{ refund.refundTypeText }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">退款原因：</span>
                    <span>{{ refund.refundReason }}</span>
                  </div>
                </div>
                <div class="detail-row">
                  <div class="detail-item">
                    <span class="label">退款金额：</span>
                    <span class="amount">¥{{ refund.refundAmount }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">申请时间：</span>
                    <span>{{ formatTime(refund.applyTime) }}</span>
                  </div>
                </div>
                <div v-if="refund.refundDescription" class="detail-row">
                  <div class="detail-item full-width">
                    <span class="label">退款说明：</span>
                    <span>{{ refund.refundDescription }}</span>
                  </div>
                </div>
                <div v-if="refund.returnLogisticsNo" class="detail-row">
                  <div class="detail-item">
                    <span class="label">退货物流：</span>
                    <span>{{ refund.returnLogisticsCompany }} {{ refund.returnLogisticsNo }}</span>
                  </div>
                </div>
              </div>

              <div class="refund-actions">
                <el-button size="small" @click="viewDetail(refund.id)">查看详情</el-button>
                
                <!-- 待审核状态，显示审核按钮 -->
                <el-button 
                  v-if="refund.status === 1"
                  type="primary" 
                  size="small" 
                  @click="showApproveDialog(refund, true)"
                >
                  同意退款
                </el-button>
                <el-button 
                  v-if="refund.status === 1"
                  type="danger" 
                  size="small" 
                  @click="showApproveDialog(refund, false)"
                >
                  拒绝退款
                </el-button>

                <!-- 退货中状态，显示确认收货按钮 -->
                <el-button 
                  v-if="refund.status === 4"
                  type="success" 
                  size="small" 
                  @click="confirmReceive(refund)"
                >
                  确认收货
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

    <!-- 审核对话框 -->
    <el-dialog v-model="showApprove" :title="approveType ? '同意退款' : '拒绝退款'" width="500px">
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="退款单号">
          <span>{{ currentRefund?.refundNo }}</span>
        </el-form-item>
        <el-form-item label="退款金额">
          <span class="amount">¥{{ currentRefund?.refundAmount }}</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="3"
            :placeholder="approveType ? '请输入审核备注（选填）' : '请输入拒绝原因'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApprove = false">取消</el-button>
        <el-button 
          :type="approveType ? 'primary' : 'danger'" 
          @click="submitApprove" 
          :loading="approveLoading"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const activeStatus = ref(0)
const refundList = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const pendingCount = ref(0)

const showApprove = ref(false)
const approveLoading = ref(false)
const approveType = ref(true) // true=同意，false=拒绝
const currentRefund = ref<any>(null)
const approveForm = ref({
  approve: true,
  remark: ''
})

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
    const res = await request.get('/merchant/refund/list', { params })
    refundList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('加载退款列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 加载待审核数量
const loadPendingCount = async () => {
  try {
    const res = await request.get('/merchant/refund/list', { 
      params: { status: 1, page: 1, size: 1 } 
    })
    pendingCount.value = res.data.total
  } catch (error) {
    console.error(error)
  }
}

// 状态切换
const handleStatusChange = () => {
  page.value = 1
  loadRefundList()
}

// 查看详情
const viewDetail = (id: number) => {
  router.push(`/merchant/refund/${id}`)
}

// 显示审核对话框
const showApproveDialog = (refund: any, approve: boolean) => {
  currentRefund.value = refund
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
    
    await request.post(`/merchant/refund/${currentRefund.value.id}/approve`, approveForm.value)
    
    ElMessage.success(approveType.value ? '已同意退款' : '已拒绝退款')
    showApprove.value = false
    loadRefundList()
    loadPendingCount()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
    console.error(error)
  } finally {
    approveLoading.value = false
  }
}

// 确认收货
const confirmReceive = async (refund: any) => {
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

    await request.post(`/merchant/refund/${refund.id}/confirm-receive`)
    
    ElMessage.success('已确认收货，退款处理中')
    loadRefundList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
      console.error(error)
    }
  }
}

onMounted(() => {
  loadRefundList()
  loadPendingCount()
})
</script>

<style scoped lang="scss">
.merchant-refund-container {
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

  .customer-info {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 12px;
    color: #909399;

    .order-no {
      color: #606266;
    }
  }
}

.refund-content {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.refund-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .detail-row {
    display: flex;
    gap: 30px;
  }

  .detail-item {
    font-size: 14px;
    flex: 1;

    &.full-width {
      flex: 100%;
    }

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
  min-width: 100px;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}
</style>
