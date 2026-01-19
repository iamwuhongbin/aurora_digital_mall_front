<template>
  <div class="apply-refund-container">
    <el-card class="refund-card">
      <template #header>
        <div class="card-header">
          <el-icon><RefundOutlined /></el-icon>
          <span>申请退款</span>
        </div>
      </template>

      <el-form :model="refundForm" :rules="rules" ref="refundFormRef" label-width="100px">
        <!-- 订单信息 -->
        <div class="order-info">
          <h3>订单信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ order.orderSn }}</el-descriptions-item>
            <el-descriptions-item label="订单金额">¥{{ order.totalAmount }}</el-descriptions-item>
            <el-descriptions-item label="实付金额">¥{{ order.payAmount }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">{{ getOrderStatusText(order.orderStatus) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 退款类型 -->
        <el-form-item label="退款类型">
          <el-tag :type="refundType === 1 ? 'success' : 'warning'">
            {{ refundType === 1 ? '仅退款' : '退货退款' }}
          </el-tag>
          <div class="type-tip">
            {{ refundType === 1 ? '商品未发货，申请退款' : '商品已发货/已收货，需要退货并退款' }}
          </div>
        </el-form-item>

        <!-- 退款原因 -->
        <el-form-item label="退款原因" prop="reason">
          <el-select v-model="refundForm.reason" placeholder="请选择退款原因" style="width: 100%">
            <el-option label="不想要了" value="不想要了" />
            <el-option label="商品质量问题" value="商品质量问题" />
            <el-option label="商品与描述不符" value="商品与描述不符" />
            <el-option label="发错货" value="发错货" />
            <el-option label="商品破损" value="商品破损" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>

        <!-- 退款说明 -->
        <el-form-item label="退款说明" prop="description">
          <el-input
            v-model="refundForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述退款原因，有助于商家快速处理"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 上传凭证 -->
        <el-form-item label="上传凭证">
          <el-upload
            v-model:file-list="fileList"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="5"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :on-change="handleChange"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">最多上传5张图片，支持jpg、png格式</div>
        </el-form-item>

        <!-- 退款金额 -->
        <el-form-item label="退款金额">
          <div class="refund-amount">
            <span class="amount">¥{{ order.payAmount }}</span>
            <span class="tip">（退款金额将原路退回）</span>
          </div>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" @click="submitRefund" :loading="loading">提交申请</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 图片预览 -->
    <el-dialog v-model="previewVisible" title="图片预览">
      <img :src="previewImage" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const orderId = ref(Number(route.query.orderId))
const order = ref<any>({})
const loading = ref(false)
const refundFormRef = ref()
const fileList = ref<any[]>([])
const previewVisible = ref(false)
const previewImage = ref('')

const refundForm = reactive({
  orderId: orderId.value,
  reason: '',
  description: '',
  images: [] as string[]
})

const rules = {
  reason: [{ required: true, message: '请选择退款原因', trigger: 'change' }],
  description: [{ required: true, message: '请填写退款说明', trigger: 'blur' }]
}

// 计算退款类型：待发货=仅退款，已发货/已收货=退货退款
const refundType = computed(() => {
  return order.value.orderStatus === 2 ? 1 : 2
})

// 获取订单状态文本
const getOrderStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    1: '待付款',
    2: '待发货',
    3: '待收货',
    4: '已完成',
    5: '已取消',
    6: '已关闭',
    7: '已退款'
  }
  return statusMap[status] || '未知状态'
}

// 加载订单详情
const loadOrderDetail = async () => {
  try {
    const res = await request.get(`/order/${orderId.value}`)
    order.value = res.data
  } catch (error) {
    ElMessage.error('加载订单信息失败')
    console.error(error)
  }
}

// 处理图片预览
const handlePreview = (file: any) => {
  previewImage.value = file.url
  previewVisible.value = true
}

// 处理图片移除
const handleRemove = (file: any) => {
  const index = fileList.value.findIndex(item => item.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
}

// 处理图片变化
const handleChange = (file: any, files: any[]) => {
  fileList.value = files
}

// 提交退款申请
const submitRefund = async () => {
  try {
    await refundFormRef.value.validate()
    
    await ElMessageBox.confirm(
      `确认申请退款吗？退款金额 ¥${order.value.payAmount} 将原路退回`,
      '确认申请',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true

    // TODO: 上传图片到服务器，获取图片URL列表
    // 这里暂时模拟图片URL
    const imageUrls = fileList.value.map((file, index) => {
      return file.url || URL.createObjectURL(file.raw)
    })

    refundForm.images = imageUrls

    await request.post('/refund/apply', refundForm)
    
    ElMessage.success('退款申请已提交，请等待商家审核')
    router.push('/customer/refunds')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '提交失败')
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  if (!orderId.value) {
    ElMessage.error('订单ID不能为空')
    router.back()
    return
  }
  loadOrderDetail()
})
</script>

<style scoped lang="scss">
.apply-refund-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.refund-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: bold;
  }
}

.order-info {
  margin-bottom: 30px;
  
  h3 {
    margin-bottom: 15px;
    font-size: 16px;
    color: #303133;
  }
}

.type-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.refund-amount {
  .amount {
    font-size: 24px;
    font-weight: bold;
    color: #f56c6c;
  }
  
  .tip {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
