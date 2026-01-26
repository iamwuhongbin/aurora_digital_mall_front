<template>
  <div class="order-detail">
    <el-page-header @back="goBack" content="订单详情" />
    
    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
    
    <div v-else-if="order" class="detail-content">
      <!-- 订单状态 -->
      <el-card class="status-card">
        <div class="order-status">
          <el-icon class="status-icon" :style="{ color: getStatusColor(order.orderStatus) }">
            <component :is="getStatusIcon(order.orderStatus)" />
          </el-icon>
          <div class="status-text">
            <h2>{{ order.orderStatusText }}</h2>
            <p v-if="order.orderStatus === 2">请尽快为客户发货</p>
            <p v-else-if="order.orderStatus === 3">商品运输中，请关注物流信息</p>
            <p v-else-if="order.orderStatus === 6">客户已申请退款，请及时处理</p>
          </div>
        </div>
      </el-card>
      
      <!-- 收货信息 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <el-icon><Location /></el-icon>
            <span>收货信息</span>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="收货人">{{ order.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ order.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            {{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverDistrict }} {{ order.receiverAddress }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- 物流信息 -->
      <el-card v-if="logistics && order.orderStatus !== 6" class="section-card">
        <template #header>
          <div class="card-header">
            <el-icon><Van /></el-icon>
            <span>物流信息</span>
          </div>
        </template>
        <div class="logistics-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物流公司">{{ logistics.logisticsCompany }}</el-descriptions-item>
            <el-descriptions-item label="物流单号">
              <el-text copyable>{{ logistics.logisticsNo }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getLogisticsStatusType(logistics.status)">
                {{ logistics.statusText }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前位置">{{ logistics.currentLocation || '-' }}</el-descriptions-item>
            <el-descriptions-item label="配送距离" v-if="logistics.distance">
              {{ logistics.distance }} 公里
            </el-descriptions-item>
            <el-descriptions-item label="预计时长" v-if="logistics.estimatedDuration">
              {{ logistics.estimatedDuration }} 分钟
            </el-descriptions-item>
          </el-descriptions>
          
          <!-- 配送路线地图 -->
          <div class="logistics-map" v-if="logistics.senderLongitude && logistics.receiverLongitude">
            <h4 style="margin: 20px 0 10px 0;">配送路线</h4>
            <amap-container
              ref="mapRef"
              height="400px"
              @map-ready="onMapReady"
            />
          </div>
          
          <!-- 物流轨迹 -->
          <div v-if="logistics.traces && logistics.traces.length > 0" class="logistics-trace">
            <h4>物流轨迹</h4>
            <el-timeline>
              <el-timeline-item 
                v-for="trace in logistics.traces" 
                :key="trace.id"
                :timestamp="formatTime(trace.traceTime)"
                placement="top"
              >
                <div class="trace-content">
                  <div class="trace-location">{{ trace.location }}</div>
                  <div class="trace-desc">{{ trace.description }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </el-card>
      
      <!-- 商品信息 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <el-icon><Box /></el-icon>
            <span>商品信息</span>
          </div>
        </template>
        <el-table :data="order.items" border>
          <el-table-column label="商品">
            <template #default="{ row }">
              <div class="product-info">
                <el-image 
                  :src="row.productImage" 
                  style="width: 80px; height: 80px"
                  fit="cover"
                />
                <div class="product-detail">
                  <div class="product-name">{{ row.productName }}</div>
                  <div class="product-attrs" v-if="row.skuAttrs">{{ row.skuAttrs }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="productPrice" label="单价" width="120">
            <template #default="{ row }">
              ¥{{ row.productPrice }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column prop="totalAmount" label="小计" width="120">
            <template #default="{ row }">
              <span style="color: #ff6700; font-weight: bold">¥{{ row.totalAmount }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 订单信息 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>订单信息</span>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号">{{ order.orderSn }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(order.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="支付时间" v-if="order.payTime">
            {{ formatTime(order.payTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="发货时间" v-if="order.deliveryTime">
            {{ formatTime(order.deliveryTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="订单备注" :span="2" v-if="order.orderNote">
            {{ order.orderNote }}
          </el-descriptions-item>
        </el-descriptions>
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
        <el-button 
          v-if="order.orderStatus === 2" 
          type="primary" 
          size="large"
          @click="showShipDialog"
        >
          立即发货
        </el-button>
      </div>
    </div>
    
    <!-- 发货对话框 -->
    <el-dialog v-model="showShip" title="订单发货" width="600px">
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="物流公司">
          <el-select v-model="shipForm.logisticsCompany" placeholder="请选择物流公司" @change="generateLogisticsNo">
            <el-option 
              v-for="company in companies" 
              :key="company.companyCode"
              :label="company.companyName"
              :value="company.companyName"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="物流单号">
          <el-input v-model="shipForm.logisticsNo" placeholder="选择物流公司后自动生成">
            <template #append>
              <el-button @click="generateLogisticsNo">重新生成</el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="发件人">
          <el-input v-model="shipForm.senderName" placeholder="请输入发件人姓名" />
        </el-form-item>
        
        <el-form-item label="发件电话">
          <el-input v-model="shipForm.senderPhone" placeholder="请输入发件人电话" />
        </el-form-item>
        
        <el-form-item label="发件地区">
          <el-cascader
            v-model="shipForm.senderRegion"
            :options="regionOptions"
            :props="{ expandTrigger: 'hover', value: 'label' }"
            placeholder="请选择省/市/区"
            style="width: 100%"
            @change="handleRegionChange"
          />
        </el-form-item>
        
        <el-form-item label="详细地址">
          <el-input 
            v-model="shipForm.senderDetailAddress" 
            type="textarea" 
            :rows="2"
            placeholder="请输入详细地址（街道、门牌号等）"
          />
        </el-form-item>
        
        <el-form-item label="预计送达">
          <el-date-picker 
            v-model="shipForm.estimatedDeliveryTime"
            type="datetime"
            placeholder="选择预计送达时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="shipForm.remark" 
            type="textarea" 
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showShip = false">取消</el-button>
        <el-button type="primary" @click="submitShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Location, Van, Box, Document, Clock, CircleCheck, CircleClose, Warning } from '@element-plus/icons-vue'
import AmapContainer from '@/components/AmapContainer.vue'
import request from '@/utils/request'
import { regionData } from '@/utils/regionData'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const order = ref<any>(null)
const logistics = ref<any>(null)
const mapRef = ref<any>(null)

const showShip = ref(false)
const companies = ref<any[]>([])
const regionOptions = ref<any[]>([])
const shipForm = ref({
  logisticsCompany: '',
  logisticsNo: '',
  senderName: '',
  senderPhone: '',
  senderRegion: [] as string[],
  senderDetailAddress: '',
  senderAddress: '',
  estimatedDeliveryTime: null,
  remark: ''
})

const orderId = route.params.id

const loadOrderDetail = async () => {
  loading.value = true
  try {
    const res = await request.get(`/merchant/order/${orderId}`)
    order.value = res.data
    
    // 如果订单已发货且不是退款中，加载物流信息
    if (order.value.orderStatus >= 3 && order.value.orderStatus !== 6) {
      await loadLogistics()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载订单详情失败')
  } finally {
    loading.value = false
  }
}

const loadLogistics = async () => {
  try {
    const res = await request.get(`/logistics/order/${orderId}`)
    logistics.value = res.data
  } catch (error) {
    console.error('加载物流信息失败', error)
  }
}

const loadCompanies = async () => {
  try {
    const res = await request.get('/logistics/companies')
    companies.value = res.data || []
  } catch (error) {
    console.error('加载物流公司失败', error)
  }
}

const showShipDialog = () => {
  showShip.value = true
}

// 生成物流单号
const generateLogisticsNo = () => {
  if (!shipForm.value.logisticsCompany) {
    ElMessage.warning('请先选择物流公司')
    return
  }
  
  // 根据不同物流公司生成不同格式的单号
  const company = shipForm.value.logisticsCompany
  let trackingNo = ''
  
  if (company.includes('顺丰')) {
    // 顺丰：SF + 12位数字
    trackingNo = 'SF' + generateRandomDigits(12)
  } else if (company.includes('圆通')) {
    // 圆通：YT + 13位数字
    trackingNo = 'YT' + generateRandomDigits(13)
  } else if (company.includes('中通')) {
    // 中通：ZT + 12位数字
    trackingNo = 'ZT' + generateRandomDigits(12)
  } else if (company.includes('申通')) {
    // 申通：ST + 12位数字
    trackingNo = 'ST' + generateRandomDigits(12)
  } else if (company.includes('韵达')) {
    // 韵达：YD + 13位数字
    trackingNo = 'YD' + generateRandomDigits(13)
  } else if (company.includes('百世')) {
    // 百世：BS + 13位数字
    trackingNo = 'BS' + generateRandomDigits(13)
  } else if (company.includes('京东')) {
    // 京东：JD + 15位数字
    trackingNo = 'JD' + generateRandomDigits(15)
  } else if (company.includes('邮政') || company.includes('EMS')) {
    // EMS：13位数字
    trackingNo = generateRandomDigits(13)
  } else if (company.includes('德邦')) {
    // 德邦：DB + 12位数字
    trackingNo = 'DB' + generateRandomDigits(12)
  } else {
    // 默认：公司首字母 + 12位数字
    const prefix = company.substring(0, 2).toUpperCase()
    trackingNo = prefix + generateRandomDigits(12)
  }
  
  shipForm.value.logisticsNo = trackingNo
  ElMessage.success('物流单号已生成')
}

// 生成指定位数的随机数字
const generateRandomDigits = (length: number): string => {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10)
  }
  return result
}

// 处理省市区选择变化
const handleRegionChange = (value: string[]) => {
  if (value && value.length === 3) {
    // 组合完整地址：省 + 市 + 区 + 详细地址
    shipForm.value.senderAddress = value.join('') + shipForm.value.senderDetailAddress
  }
}

const submitShip = async () => {
  if (!shipForm.value.logisticsCompany || !shipForm.value.logisticsNo) {
    ElMessage.warning('请填写物流公司和物流单号')
    return
  }
  
  if (!shipForm.value.senderRegion || shipForm.value.senderRegion.length === 0) {
    ElMessage.warning('请选择发件地区')
    return
  }
  
  if (!shipForm.value.senderDetailAddress) {
    ElMessage.warning('请填写详细地址')
    return
  }
  
  // 组合完整地址
  shipForm.value.senderAddress = shipForm.value.senderRegion.join('') + shipForm.value.senderDetailAddress
  
  try {
    await request.post(`/merchant/order/${orderId}/ship`, shipForm.value)
    ElMessage.success('发货成功')
    showShip.value = false
    
    // 重置表单
    shipForm.value = {
      logisticsCompany: '',
      logisticsNo: '',
      senderName: '',
      senderPhone: '',
      senderRegion: [],
      senderDetailAddress: '',
      senderAddress: '',
      estimatedDeliveryTime: null,
      remark: ''
    }
    
    // 刷新订单详情
    loadOrderDetail()
  } catch (error: any) {
    ElMessage.error(error.message || '发货失败')
  }
}

const getStatusIcon = (status: number) => {
  switch (status) {
    case 1: return Clock
    case 2: return Box
    case 3: return Van
    case 4:
    case 5: return CircleCheck
    case 6: return Warning
    case 7: return CircleCheck
    case 8: return CircleClose
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
    case 6: return '#e6a23c'
    case 7: return '#67c23a'
    case 8: return '#f56c6c'
    default: return '#909399'
  }
}

const getLogisticsStatusType = (status: number) => {
  const types: any = {
    1: 'primary',
    2: 'info',
    3: 'warning',
    4: 'success',
    5: 'danger'
  }
  return types[status] || ''
}

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
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

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadOrderDetail()
  loadCompanies()
  // 加载省市区数据
  regionOptions.value = regionData
})
</script>

<style scoped>
.order-detail {
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 100px 0;
  font-size: 48px;
  color: #909399;
}

.detail-content {
  max-width: 1200px;
  margin: 20px auto;
}

.status-card {
  margin-bottom: 20px;
}

.order-status {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.status-icon {
  font-size: 60px;
}

.status-text h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.status-text p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.section-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.product-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.product-detail {
  flex: 1;
}

.product-name {
  font-size: 14px;
  margin-bottom: 5px;
}

.product-attrs {
  font-size: 12px;
  color: #909399;
}

.logistics-trace {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.logistics-trace h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 500;
}

.trace-content {
  padding: 5px 0;
}

.trace-location {
  font-weight: 500;
  margin-bottom: 5px;
}

.trace-desc {
  color: #606266;
  font-size: 13px;
}

.amount-card {
  background-color: #f5f7fa;
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
  margin-top: 10px;
  padding-top: 15px;
  font-size: 16px;
  font-weight: bold;
}

.total-amount {
  color: #ff6700;
  font-size: 20px;
}

.discount {
  color: #67c23a;
}

.action-buttons {
  text-align: center;
  margin-top: 30px;
  padding: 20px 0;
}
</style>
