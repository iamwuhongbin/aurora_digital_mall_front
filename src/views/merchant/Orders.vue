<template>
  <div class="orders">
    <h2>订单管理</h2>
    
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="0" />
        <el-tab-pane label="待发货" name="2" />
        <el-tab-pane label="待收货" name="3" />
        <el-tab-pane label="已完成" name="5" />
      </el-tabs>
      
      <el-table :data="orders" v-loading="loading" style="width: 100%">
        <el-table-column prop="orderSn" label="订单号" width="180" />
        <el-table-column label="商品">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 10px">
              <el-image 
                v-if="row.productImage" 
                :src="row.productImage" 
                style="width: 60px; height: 60px"
                fit="cover"
              />
              <span>共{{ row.itemCount }}件商品</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="订单金额" width="120">
          <template #default="{ row }">
            <span style="color: #ff6700; font-weight: bold">¥{{ row.payAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.orderStatus)">
              {{ row.orderStatusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row.id)">查看详情</el-button>
            <el-button 
              v-if="row.orderStatus === 2" 
              size="small" 
              type="primary" 
              @click="showShipDialog(row)"
            >
              发货
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadOrders"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>
    
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { regionData } from '@/utils/regionData'

const router = useRouter()
const activeTab = ref('0')
const orders = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)

const showShip = ref(false)
const currentOrder = ref<any>(null)
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

const loadOrders = async () => {
  loading.value = true
  try {
    const status = activeTab.value === '0' ? null : activeTab.value
    const res = await request.get('/merchant/order/list', {
      params: { 
        status, 
        page: page.value, 
        size: size.value 
      }
    })
    orders.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载订单列表失败')
  } finally {
    loading.value = false
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

const handleTabChange = () => {
  page.value = 1
  loadOrders()
}

const viewDetail = (id: number) => {
  router.push(`/merchant/order/${id}`)
}

const showShipDialog = (order: any) => {
  currentOrder.value = order
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
    await request.post(`/merchant/order/${currentOrder.value.id}/ship`, shipForm.value)
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
    
    // 刷新订单列表
    loadOrders()
  } catch (error: any) {
    ElMessage.error(error.message || '发货失败')
  }
}

const getStatusType = (status: number) => {
  const types: any = {
    1: 'warning',
    2: 'primary',
    3: 'info',
    4: 'success',
    5: 'success',
    6: 'danger'
  }
  return types[status] || ''
}

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  loadOrders()
  loadCompanies()
  // 加载省市区数据
  regionOptions.value = regionData
})
</script>

<style scoped>
.orders h2 {
  margin-bottom: 20px;
}
</style>
