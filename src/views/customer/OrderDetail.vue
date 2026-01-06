<template>
  <div class="order-detail-container">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <h2>订单详情</h2>
      </template>
    </el-page-header>

    <div class="order-content" v-loading="loading">
      <!-- 订单状态 -->
      <el-card class="status-card">
        <div class="status-info">
          <el-icon :size="50" :color="getStatusColor(order.orderStatus)">
            <component :is="getStatusIcon(order.orderStatus)" />
          </el-icon>
          <div class="status-text">
            <h3>{{ order.orderStatusText }}</h3>
            <p v-if="order.orderStatus === 1">请尽快完成支付</p>
            <p v-else-if="order.orderStatus === 2">商家正在准备发货</p>
            <p v-else-if="order.orderStatus === 3">商品正在配送中</p>
          </div>
        </div>
      </el-card>

      <!-- 收货地址 -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">收货信息</span>
        </template>
        <div class="address-info">
          <div class="info-row">
            <span class="label">收货人：</span>
            <span>{{ order.receiverName }} {{ order.receiverPhone }}</span>
          </div>
          <div class="info-row">
            <span class="label">收货地址：</span>
            <span>{{ order.receiverFullAddress }}</span>
          </div>
        </div>
      </el-card>

      <!-- 物流追踪 -->
      <el-card class="section-card" v-if="order.orderStatus >= 3 && logistics">
        <template #header>
          <div class="card-header">
            <span class="card-title">物流追踪</span>
            <el-tag :type="getLogisticsStatusType(logistics.status)">
              {{ logistics.statusText }}
            </el-tag>
          </div>
        </template>
        
        <!-- 物流基本信息 -->
        <div class="logistics-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物流公司">{{ logistics.logisticsCompany }}</el-descriptions-item>
            <el-descriptions-item label="物流单号">{{ logistics.logisticsNo }}</el-descriptions-item>
            <el-descriptions-item label="配送距离" v-if="logistics.distance">
              {{ logistics.distance }} 公里
            </el-descriptions-item>
            <el-descriptions-item label="预计时长" v-if="logistics.estimatedDuration">
              {{ logistics.estimatedDuration }} 分钟
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 配送路线地图 -->
        <div class="logistics-map" v-if="logistics.senderLongitude && logistics.receiverLongitude">
          <h4 style="margin: 20px 0 10px 0;">配送路线</h4>
          <amap-container
            ref="mapRef"
            height="400px"
            @map-ready="onMapReady"
          />
        </div>

        <!-- 物流轨迹时间线 -->
        <div class="logistics-trace" v-if="logistics.traces && logistics.traces.length > 0">
          <h4 style="margin: 20px 0 10px 0;">物流轨迹</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(trace, index) in logistics.traces"
              :key="trace.id"
              :timestamp="formatTime(trace.traceTime)"
              :type="index === 0 ? 'primary' : 'info'"
              placement="top"
            >
              <div class="trace-content">
                <div class="trace-location">{{ trace.location }}</div>
                <div class="trace-description">{{ trace.description }}</div>
                <div class="trace-operator" v-if="trace.operator">
                  操作人：{{ trace.operator }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-card>

      <!-- 商品信息 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">商品信息</span>
            <span class="shop-name">{{ order.merchantName }}</span>
          </div>
        </template>
        <el-table :data="order.items" style="width: 100%">
          <el-table-column label="商品" min-width="300">
            <template #default="{ row }">
              <div class="product-info" @click="goToProduct(row.productId)">
                <el-image :src="row.productImage" class="product-image" fit="cover" />
                <div class="product-detail">
                  <div class="product-name">{{ row.productName }}</div>
                  <div class="product-sku" v-if="row.skuName">{{ row.skuName }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <span class="price">¥{{ row.productPrice }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="100">
            <template #default="{ row }">
              <span>{{ row.quantity }}</span>
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span class="price">¥{{ row.totalAmount }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 订单信息 -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">订单信息</span>
        </template>
        <div class="order-info">
          <div class="info-row">
            <span class="label">订单编号：</span>
            <span>{{ order.orderSn }}</span>
          </div>
          <div class="info-row">
            <span class="label">创建时间：</span>
            <span>{{ formatTime(order.createdAt) }}</span>
          </div>
          <div class="info-row" v-if="order.payTime">
            <span class="label">支付时间：</span>
            <span>{{ formatTime(order.payTime) }}</span>
          </div>
          <div class="info-row" v-if="order.deliveryTime">
            <span class="label">发货时间：</span>
            <span>{{ formatTime(order.deliveryTime) }}</span>
          </div>
          <div class="info-row" v-if="order.receiveTime">
            <span class="label">收货时间：</span>
            <span>{{ formatTime(order.receiveTime) }}</span>
          </div>
          <div class="info-row" v-if="order.orderNote">
            <span class="label">订单备注：</span>
            <span>{{ order.orderNote }}</span>
          </div>
        </div>
      </el-card>

      <!-- 费用信息 -->
      <el-card class="section-card amount-card">
        <div class="amount-info">
          <div class="amount-row">
            <span>商品总额：</span>
            <span>¥{{ order.totalAmount }}</span>
          </div>
          <div class="amount-row">
            <span>运费：</span>
            <span>¥{{ order.freightAmount }}</span>
          </div>
          <div class="amount-row" v-if="order.discountAmount > 0">
            <span>优惠金额：</span>
            <span class="discount">-¥{{ order.discountAmount }}</span>
          </div>
          <div class="amount-row total">
            <span>实付金额：</span>
            <span class="total-amount">¥{{ order.payAmount }}</span>
          </div>
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button v-if="order.orderStatus === 1" type="danger" @click="cancelOrder">取消订单</el-button>
        <el-button v-if="order.orderStatus === 1" type="primary" @click="payOrder">去支付</el-button>
        <el-button v-if="order.orderStatus === 3" type="primary" @click="confirmReceive">确认收货</el-button>
        <el-button v-if="order.orderStatus === 4" type="primary" @click="showReviewDialog">评价订单</el-button>
      </div>
    </div>
    
    <!-- 评价对话框 -->
    <el-dialog v-model="showReview" title="评价商品" width="600px">
      <div v-for="item in order.items" :key="item.id" class="review-item">
        <div class="review-product">
          <el-image :src="item.productImage" style="width: 60px; height: 60px" fit="cover" />
          <div class="product-name">{{ item.productName }}</div>
        </div>
        
        <el-form :model="reviewForms[item.id]" label-width="80px">
          <el-form-item label="评分">
            <el-rate v-model="reviewForms[item.id].rating" />
          </el-form-item>
          
          <el-form-item label="评价内容">
            <el-input 
              v-model="reviewForms[item.id].content"
              type="textarea"
              :rows="3"
              placeholder="分享你的购买心得，帮助更多人了解商品"
            />
          </el-form-item>
          
          <el-form-item label="上传图片">
            <el-upload
              :file-list="reviewForms[item.id].imageList"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :on-success="(response, file) => handleUploadSuccess(response, file, item.id)"
              :on-remove="(file) => handleRemoveImage(file, item.id)"
              :before-upload="beforeUpload"
              list-type="picture-card"
              :limit="3"
              :accept="'image/*'"
              multiple
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">最多上传3张图片，支持jpg、png格式</div>
          </el-form-item>
          
          <el-form-item label="匿名评价">
            <el-checkbox v-model="reviewForms[item.id].isAnonymous">匿名</el-checkbox>
          </el-form-item>
        </el-form>
        
        <el-divider v-if="order.items.indexOf(item) < order.items.length - 1" />
      </div>
      
      <template #footer>
        <el-button @click="showReview = false">取消</el-button>
        <el-button type="primary" @click="submitReviews">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Box, Van, CircleCheck, CircleClose, Plus } from '@element-plus/icons-vue'
import AmapContainer from '@/components/AmapContainer.vue'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const order = ref<any>({
  items: []
})
const logistics = ref<any>(null)
const mapRef = ref<any>(null)

const showReview = ref(false)
const reviewForms = ref<any>({})

// 图片上传相关
const uploadUrl = ref('http://localhost:8080/api/upload/image')
const uploadHeaders = ref({
  'Authorization': localStorage.getItem('token') || ''
})

const loadOrderDetail = async () => {
  loading.value = true
  try {
    const res = await request.get(`/order/${route.params.id}`)
    order.value = res.data || { items: [] }
    
    // 初始化评价表单
    if (order.value.items) {
      order.value.items.forEach((item: any) => {
        reviewForms.value[item.id] = {
          orderItemId: item.id,
          rating: 5,
          content: '',
          images: '',
          imageList: [], // 上传的图片列表
          isAnonymous: false
        }
      })
    }

    // 如果订单已发货，加载物流信息
    if (order.value.orderStatus >= 3) {
      loadLogistics()
    }
  } catch (error) {
    console.error('加载订单详情失败', error)
    ElMessage.error('加载订单详情失败')
  } finally {
    loading.value = false
  }
}

// 加载物流信息
const loadLogistics = async () => {
  try {
    const res = await request.get(`/logistics/order/${order.value.id}`)
    logistics.value = res.data
  } catch (error) {
    console.error('加载物流信息失败', error)
  }
}

// 地图准备完成
const onMapReady = ({ map, AMap }: any) => {
  if (!logistics.value) return

  const { senderLongitude, senderLatitude, receiverLongitude, receiverLatitude } = logistics.value

  if (senderLongitude && senderLatitude && receiverLongitude && receiverLatitude) {
    // 添加起点标记
    mapRef.value.addMarker([senderLongitude, senderLatitude], {
      title: '发货地',
      label: {
        content: '起',
        direction: 'top'
      }
    })

    // 添加终点标记
    mapRef.value.addMarker([receiverLongitude, receiverLatitude], {
      title: '收货地',
      label: {
        content: '终',
        direction: 'top'
      }
    })

    // 规划路线
    mapRef.value.planRoute(
      [senderLongitude, senderLatitude],
      [receiverLongitude, receiverLatitude]
    )

    // 自适应显示
    setTimeout(() => {
      mapRef.value.setFitView()
    }, 500)
  }
}

// 获取物流状态类型
const getLogisticsStatusType = (status: number) => {
  const typeMap: any = {
    1: 'info',
    2: 'warning',
    3: 'primary',
    4: 'success',
    5: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusIcon = (status: number) => {
  switch (status) {
    case 1: return Clock
    case 2: return Box
    case 3: return Van
    case 4:
    case 5: return CircleCheck
    case 6: return CircleClose
    default: return Clock
  }
}

const getStatusColor = (status: number) => {
  switch (status) {
    case 1: return '#e6a23c'
    case 2: return '#409eff'
    case 3: return '#409eff'
    case 4:
    case 5: return '#67c23a'
    case 6: return '#f56c6c'
    default: return '#909399'
  }
}

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const goToProduct = (productId: number) => {
  router.push(`/customer/product/${productId}`)
}

const cancelOrder = async () => {
  try {
    await ElMessageBox.confirm('确定要取消订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await request.put(`/order/${order.value.id}/cancel`)
    ElMessage.success('订单已取消')
    loadOrderDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('取消订单失败')
    }
  }
}

const payOrder = () => {
  router.push(`/customer/payment?orderId=${order.value.id}`)
}

const confirmReceive = async () => {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    await request.put(`/order/${order.value.id}/receive`)
    ElMessage.success('确认收货成功')
    loadOrderDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('确认收货失败')
    }
  }
}

const showReviewDialog = () => {
  showReview.value = true
}

// 图片上传成功处理
const handleUploadSuccess = (response: any, file: any, orderItemId: number) => {
  if (response.code === 200) {
    reviewForms.value[orderItemId].imageList.push({
      name: file.name,
      url: response.data
    })
    // 更新images字段
    const imageUrls = reviewForms.value[orderItemId].imageList.map((img: any) => img.url).join(',')
    reviewForms.value[orderItemId].images = imageUrls
  }
}

// 移除图片处理
const handleRemoveImage = (file: any, orderItemId: number) => {
  const index = reviewForms.value[orderItemId].imageList.findIndex((img: any) => img.name === file.name)
  if (index > -1) {
    reviewForms.value[orderItemId].imageList.splice(index, 1)
    // 更新images字段
    const imageUrls = reviewForms.value[orderItemId].imageList.map((img: any) => img.url).join(',')
    reviewForms.value[orderItemId].images = imageUrls
  }
}

// 上传前验证
const beforeUpload = (file: any) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const submitReviews = async () => {
  try {
    // 提交所有商品的评价
    const reviews = Object.values(reviewForms.value)
    
    for (const review of reviews as any[]) {
      await request.post('/review/create', {
        orderItemId: review.orderItemId,
        rating: review.rating,
        content: review.content,
        images: review.images,
        isAnonymous: review.isAnonymous ? 1 : 0
      })
    }
    
    ElMessage.success('评价成功')
    showReview.value = false
    loadOrderDetail()
  } catch (error: any) {
    ElMessage.error(error.message || '评价失败')
  }
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.order-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.order-content {
  margin-top: 20px;
}

.section-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.shop-name {
  color: #606266;
  font-size: 14px;
}

/* 订单状态 */
.status-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.status-text h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.status-text p {
  margin: 0;
  opacity: 0.9;
}

/* 地址信息 */
.address-info, .order-info {
  padding: 10px 0;
}

.info-row {
  display: flex;
  padding: 10px 0;
  font-size: 14px;
}

.label {
  color: #909399;
  width: 100px;
  flex-shrink: 0;
}

/* 商品信息 */
.product-info {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
}

.product-info:hover .product-name {
  color: #409eff;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  flex-shrink: 0;
}

.product-detail {
  flex: 1;
}

.product-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
}

.product-sku {
  font-size: 12px;
  color: #909399;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}

/* 费用信息 */
.amount-card {
  background: #f5f7fa;
}

.amount-info {
  padding: 10px 0;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
}

.amount-row.total {
  border-top: 1px solid #dcdfe6;
  padding-top: 15px;
  margin-top: 10px;
  font-size: 16px;
  font-weight: bold;
}

.discount {
  color: #67c23a;
}

.total-amount {
  color: #f56c6c;
  font-size: 20px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.action-buttons .el-button {
  min-width: 120px;
}

/* 评价对话框 */
.review-item {
  margin-bottom: 20px;
}

.review-product {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.review-product .product-name {
  font-size: 14px;
  font-weight: 500;
}

/* 物流追踪 */
.logistics-info {
  margin-bottom: 20px;
}

.logistics-map {
  margin-top: 20px;
}

.logistics-trace {
  margin-top: 20px;
}

.trace-content {
  padding: 5px 0;
}

.trace-location {
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
}

.trace-description {
  color: #606266;
  font-size: 14px;
  margin-bottom: 3px;
}

.trace-operator {
  color: #909399;
  font-size: 12px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
