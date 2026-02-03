<template>
  <div class="checkout-container">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <h2>确认订单</h2>
      </template>
    </el-page-header>

    <div class="checkout-content" v-loading="loading">
      <!-- 收货地址 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">收货地址</span>
            <el-button type="primary" size="small" @click="showAddressDialog = true">
              添加新地址
            </el-button>
          </div>
        </template>

        <div v-if="addresses.length === 0" class="empty-address">
          <el-empty description="暂无收货地址，请添加">
            <el-button type="primary" @click="showAddressDialog = true">添加地址</el-button>
          </el-empty>
        </div>

        <div v-else class="address-list">
          <div 
            v-for="addr in addresses" 
            :key="addr.id"
            class="address-item"
            :class="{ selected: selectedAddress?.id === addr.id }"
            @click="selectedAddress = addr"
          >
            <div class="address-info">
              <div class="address-header">
                <span class="receiver-name">{{ addr.receiverName }}</span>
                <span class="receiver-phone">{{ addr.receiverPhone }}</span>
                <el-tag v-if="addr.isDefault" type="success" size="small">默认</el-tag>
              </div>
              <div class="address-detail">
                {{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detailAddress }}
              </div>
            </div>
            <el-icon v-if="selectedAddress?.id === addr.id" class="check-icon" color="#67c23a">
              <CircleCheck />
            </el-icon>
          </div>
        </div>
      </el-card>

      <!-- 商品清单 -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">商品清单</span>
        </template>

        <el-table :data="cartItems" style="width: 100%">
          <el-table-column label="商品信息" min-width="300">
            <template #default="{ row }">
              <div class="product-info">
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
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="100">
            <template #default="{ row }">
              <span>{{ row.quantity }}</span>
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span class="price">¥{{ (row.price * row.quantity).toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 优惠券选择 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">优惠券</span>
            <el-button type="primary" link @click="openCouponDialog">
              选择优惠券
            </el-button>
          </div>
        </template>
        <div v-if="selectedCoupon" class="selected-coupon">
          <div class="coupon-info">
            <div class="selected-coupon-left">
              <span class="coupon-amount">
                <span v-if="selectedCoupon.couponType === 1 || selectedCoupon.couponType === 3">
                  -¥{{ selectedCoupon.discountAmount }}
                </span>
                <span v-else>
                  {{ (selectedCoupon.discountRate * 10).toFixed(1) }}折
                </span>
              </span>
            </div>
            <div class="selected-coupon-right">
              <div class="selected-coupon-name">{{ selectedCoupon.couponName }}</div>
              <div class="selected-coupon-condition">
                <span v-if="selectedCoupon.minAmount && selectedCoupon.minAmount > 0">
                  满{{ selectedCoupon.minAmount }}元可用
                </span>
                <span v-else>无门槛</span>
              </div>
            </div>
          </div>
          <el-button type="danger" link @click="removeCoupon">取消使用</el-button>
        </div>
        <div v-else class="no-coupon">
          <span>暂未选择优惠券</span>
        </div>
      </el-card>

      <!-- 订单备注 -->
      <el-card class="section-card">
        <template #header>
          <span class="card-title">订单备注</span>
        </template>
        <el-input
          v-model="orderNote"
          type="textarea"
          :rows="3"
          placeholder="选填，请先和商家协商一致"
          maxlength="200"
          show-word-limit
        />
      </el-card>

      <!-- 结算信息 -->
      <el-card class="section-card settlement-card">
        <div class="settlement-info">
          <div class="settlement-row">
            <span>商品总额：</span>
            <span class="amount">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
          <div class="settlement-row">
            <span>运费：</span>
            <span class="amount">¥{{ freightAmount.toFixed(2) }}</span>
          </div>
          <div class="settlement-row discount" v-if="couponDiscount > 0">
            <span>优惠券抵扣：</span>
            <span class="discount-amount">-¥{{ couponDiscount.toFixed(2) }}</span>
          </div>
          <div class="settlement-row total">
            <span>应付总额：</span>
            <span class="total-amount">¥{{ payAmount.toFixed(2) }}</span>
          </div>
        </div>

        <el-button 
          type="primary" 
          size="large" 
          class="submit-btn"
          :disabled="!selectedAddress || cartItems.length === 0"
          @click="submitOrder"
        >
          提交订单
        </el-button>
      </el-card>
    </div>

    <!-- 添加地址对话框 -->
    <el-dialog v-model="showAddressDialog" title="添加收货地址" width="500px">
      <el-form :model="addressForm" label-width="100px">
        <el-form-item label="收货人" required>
          <el-input v-model="addressForm.receiverName" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号码" required>
          <el-input v-model="addressForm.receiverPhone" placeholder="请输入手机号码" />
        </el-form-item>
        <el-form-item label="所在地区" required>
          <el-cascader
            v-model="selectedRegion"
            :options="regionOptions"
            :props="{ value: 'name', label: 'name', children: 'children' }"
            placeholder="请选择省/市/区"
            style="width: 100%"
            @change="handleRegionChange"
          />
        </el-form-item>
        <el-form-item label="详细地址" required>
          <el-input v-model="addressForm.detailAddress" type="textarea" :rows="3" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="邮政编码">
          <el-input v-model="addressForm.postalCode" placeholder="选填" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="addressForm.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddressDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>

    <!-- 选择优惠券对话框 -->
    <el-dialog v-model="showCouponDialog" title="选择优惠券" width="600px">
      <div v-loading="loadingCoupons">
        <div v-if="availableCoupons.length === 0" class="empty-coupons">
          <el-empty description="暂无可用优惠券">
            <el-button type="primary" @click="$router.push('/customer/coupons')">
              去兑换优惠券
            </el-button>
          </el-empty>
        </div>
        <div v-else class="coupon-list">
          <div 
            v-for="coupon in availableCoupons" 
            :key="coupon.id"
            class="coupon-item"
            :class="{ 
              selected: tempSelectedCoupon?.id === coupon.id,
              disabled: !isCouponUsable(coupon)
            }"
            @click="selectCoupon(coupon)"
          >
            <div class="coupon-left">
              <div class="coupon-value">
                <span v-if="coupon.couponType === 1 || coupon.couponType === 3">
                  ¥{{ coupon.discountAmount }}
                </span>
                <span v-else>
                  {{ (coupon.discountRate * 10).toFixed(1) }}折
                </span>
              </div>
              <div class="coupon-type">
                {{ getCouponTypeName(coupon.couponType) }}
              </div>
            </div>
            <div class="coupon-right">
              <div class="coupon-name">{{ coupon.couponName }}</div>
              <div class="coupon-condition">
                <span v-if="coupon.minAmount && coupon.minAmount > 0">
                  满{{ coupon.minAmount }}元可用
                </span>
                <span v-else>无门槛</span>
              </div>
              <div class="coupon-desc" v-if="coupon.description">
                {{ coupon.description }}
              </div>
              <div class="coupon-footer">
                <span class="coupon-expire">
                  有效期至：{{ formatDate(coupon.expireAt) }}
                </span>
                <el-tag v-if="!isCouponUsable(coupon)" type="info" size="small">不可用</el-tag>
                <el-tag v-else-if="tempSelectedCoupon?.id === coupon.id" type="success" size="small">已选择</el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCouponDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCoupon">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const addresses = ref<any[]>([])
const selectedAddress = ref<any>(null)
const cartItems = ref<any[]>([])
const orderNote = ref('')
const isBuyNow = ref(false) // 是否是立即购买模式
const showAddressDialog = ref(false)
const selectedRegion = ref<string[]>([])
const addressForm = ref({
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  postalCode: '',
  isDefault: false
})

// 优惠券相关
const showCouponDialog = ref(false)
const loadingCoupons = ref(false)
const availableCoupons = ref<any[]>([])
const selectedCoupon = ref<any>(null)
const tempSelectedCoupon = ref<any>(null)

// 中国省市区数据（简化版，包含主要城市）
const regionOptions = ref([
  {
    name: '北京市',
    children: [
      { name: '北京市', children: [
        { name: '东城区' }, { name: '西城区' }, { name: '朝阳区' }, { name: '丰台区' },
        { name: '石景山区' }, { name: '海淀区' }, { name: '门头沟区' }, { name: '房山区' }
      ]}
    ]
  },
  {
    name: '上海市',
    children: [
      { name: '上海市', children: [
        { name: '黄浦区' }, { name: '徐汇区' }, { name: '长宁区' }, { name: '静安区' },
        { name: '普陀区' }, { name: '虹口区' }, { name: '杨浦区' }, { name: '闵行区' }
      ]}
    ]
  },
  {
    name: '广东省',
    children: [
      { name: '广州市', children: [
        { name: '天河区' }, { name: '越秀区' }, { name: '海珠区' }, { name: '荔湾区' },
        { name: '白云区' }, { name: '黄埔区' }, { name: '番禺区' }, { name: '花都区' }
      ]},
      { name: '深圳市', children: [
        { name: '福田区' }, { name: '罗湖区' }, { name: '南山区' }, { name: '宝安区' },
        { name: '龙岗区' }, { name: '盐田区' }, { name: '龙华区' }, { name: '坪山区' }
      ]},
      { name: '东莞市', children: [{ name: '东莞市' }] },
      { name: '佛山市', children: [{ name: '禅城区' }, { name: '南海区' }, { name: '顺德区' }] }
    ]
  },
  {
    name: '浙江省',
    children: [
      { name: '杭州市', children: [
        { name: '西湖区' }, { name: '上城区' }, { name: '拱墅区' }, { name: '滨江区' },
        { name: '萧山区' }, { name: '余杭区' }, { name: '临平区' }
      ]},
      { name: '宁波市', children: [{ name: '海曙区' }, { name: '江北区' }, { name: '鄞州区' }] },
      { name: '温州市', children: [{ name: '鹿城区' }, { name: '龙湾区' }, { name: '瓯海区' }] }
    ]
  },
  {
    name: '江苏省',
    children: [
      { name: '南京市', children: [
        { name: '玄武区' }, { name: '秦淮区' }, { name: '建邺区' }, { name: '鼓楼区' },
        { name: '栖霞区' }, { name: '雨花台区' }, { name: '江宁区' }
      ]},
      { name: '苏州市', children: [{ name: '姑苏区' }, { name: '吴中区' }, { name: '相城区' }] },
      { name: '无锡市', children: [{ name: '梁溪区' }, { name: '滨湖区' }, { name: '惠山区' }] }
    ]
  },
  {
    name: '四川省',
    children: [
      { name: '成都市', children: [
        { name: '锦江区' }, { name: '青羊区' }, { name: '金牛区' }, { name: '武侯区' },
        { name: '成华区' }, { name: '龙泉驿区' }, { name: '温江区' }
      ]},
      { name: '绵阳市', children: [{ name: '涪城区' }, { name: '游仙区' }] }
    ]
  }
])

const handleRegionChange = (value: string[]) => {
  if (value && value.length === 3) {
    addressForm.value.province = value[0]
    addressForm.value.city = value[1]
    addressForm.value.district = value[2]
  }
}

const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const freightAmount = computed(() => {
  return 0
})

const couponDiscount = computed(() => {
  if (!selectedCoupon.value) return 0
  
  const coupon = selectedCoupon.value
  const total = totalAmount.value
  
  // 检查使用门槛
  if (coupon.minAmount && total < coupon.minAmount) {
    return 0
  }
  
  let discount = 0
  
  // 计算优惠金额
  if (coupon.couponType === 1 || coupon.couponType === 3) {
    // 满减券或无门槛券
    discount = coupon.discountAmount || 0
  } else if (coupon.couponType === 2) {
    // 折扣券
    discount = total * (1 - (coupon.discountRate || 0))
  }
  
  // 优惠金额不能超过订单总额
  if (discount > total) {
    discount = total
  }
  
  return discount
})

const payAmount = computed(() => {
  const amount = totalAmount.value + freightAmount.value - couponDiscount.value
  return amount > 0 ? amount : 0
})

const loadAddresses = async () => {
  try {
    const res = await request.get('/customer/address')
    addresses.value = res.data || []
    const defaultAddr = addresses.value.find(addr => addr.isDefault)
    selectedAddress.value = defaultAddr || addresses.value[0]
  } catch (error) {
    console.error('加载地址失败', error)
  }
}

const loadCartItems = async () => {
  loading.value = true
  try {
    // 检查是否是立即购买模式
    if (route.query.type === 'buyNow') {
      isBuyNow.value = true
      const buyNowItemStr = sessionStorage.getItem('buyNowItem')
      if (buyNowItemStr) {
        const buyNowItem = JSON.parse(buyNowItemStr)
        cartItems.value = [buyNowItem]
        // 清除 sessionStorage
        sessionStorage.removeItem('buyNowItem')
      } else {
        ElMessage.warning('商品信息已失效，请重新选择')
        router.push('/customer/products')
      }
    } else {
      // 购物车结算模式
      isBuyNow.value = false
      const res = await request.get('/cart/list')
      const allItems = res.data || []
      // isChecked 是数字类型（0或1），需要显式判断为1
      cartItems.value = allItems.filter((item: any) => item.isChecked === 1)
      
      if (cartItems.value.length === 0) {
        ElMessage.warning('请先选择要结算的商品')
        router.push('/customer/cart')
      }
    }
  } catch (error) {
    console.error('加载商品失败', error)
    ElMessage.error('加载商品失败')
  } finally {
    loading.value = false
  }
}

const saveAddress = async () => {
  if (!addressForm.value.receiverName || !addressForm.value.receiverPhone || 
      !addressForm.value.province || !addressForm.value.city || 
      !addressForm.value.district || !addressForm.value.detailAddress) {
    ElMessage.warning('请填写完整的地址信息')
    return
  }

  try {
    const data = {
      ...addressForm.value,
      isDefault: addressForm.value.isDefault ? 1 : 0
    }
    await request.post('/customer/address', data)
    ElMessage.success('地址添加成功')
    showAddressDialog.value = false
    addressForm.value = {
      receiverName: '',
      receiverPhone: '',
      province: '',
      city: '',
      district: '',
      detailAddress: '',
      postalCode: '',
      isDefault: false
    }
    await loadAddresses()
  } catch (error: any) {
    ElMessage.error(error.message || '添加地址失败')
  }
}

// 加载可用优惠券
const loadAvailableCoupons = async () => {
  loadingCoupons.value = true
  try {
    const res = await request.get('/coupon/usable')
    availableCoupons.value = res.data || []
  } catch (error: any) {
    console.error('加载优惠券失败', error)
  } finally {
    loadingCoupons.value = false
  }
}

// 判断优惠券是否可用
const isCouponUsable = (coupon: any) => {
  if (coupon.status !== 1) return false
  if (new Date(coupon.expireAt) < new Date()) return false
  // 检查订单金额是否满足优惠券使用门槛
  if (coupon.minAmount && totalAmount.value < coupon.minAmount) return false
  return true
}

// 选择优惠券
const selectCoupon = (coupon: any) => {
  if (!isCouponUsable(coupon)) {
    if (coupon.status !== 1) {
      ElMessage.warning('该优惠券已使用或已过期')
    } else if (new Date(coupon.expireAt) < new Date()) {
      ElMessage.warning('该优惠券已过期')
    } else if (coupon.minAmount && totalAmount.value < coupon.minAmount) {
      ElMessage.warning(`订单金额需满${coupon.minAmount}元才能使用该优惠券`)
    } else {
      ElMessage.warning('该优惠券不可用')
    }
    return
  }
  tempSelectedCoupon.value = coupon
}

// 确认选择优惠券
const confirmCoupon = () => {
  selectedCoupon.value = tempSelectedCoupon.value
  showCouponDialog.value = false
}

// 取消使用优惠券
const removeCoupon = () => {
  selectedCoupon.value = null
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// 获取优惠券类型名称
const getCouponTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    1: '满减券',
    2: '折扣券',
    3: '无门槛券'
  }
  return typeMap[type] || '优惠券'
}

// 打开优惠券对话框时加载优惠券
const openCouponDialog = () => {
  showCouponDialog.value = true
  tempSelectedCoupon.value = selectedCoupon.value
  loadAvailableCoupons()
}

const submitOrder = async () => {
  if (!selectedAddress.value) {
    ElMessage.warning('请选择收货地址')
    return
  }

  try {
    await ElMessageBox.confirm('确认提交订单？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    loading.value = true
    
    // 构造订单请求参数
    const orderRequest: any = {
      addressId: selectedAddress.value.id,
      orderNote: orderNote.value,
      couponId: selectedCoupon.value?.id || null
    }
    
    // 如果是立即购买模式，添加buyNowItem参数
    if (isBuyNow.value && cartItems.value.length > 0) {
      const item = cartItems.value[0]
      orderRequest.buyNowItem = {
        productId: item.productId,
        skuId: item.skuId,
        quantity: item.quantity
      }
    }
    
    const res = await request.post('/order/create', orderRequest)
    const orderId = res.data  // 后端返回的 data 字段直接就是 orderId

    ElMessage.success('订单创建成功，请尽快完成支付')
    // 跳转到订单详情页，用户可以在那里进行支付
    router.push(`/customer/order/${orderId}`)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '订单创建失败')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAddresses()
  loadCartItems()
})
</script>

<style scoped>
.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.checkout-content {
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

/* 收货地址 */
.empty-address {
  padding: 40px 0;
}

.address-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.address-item {
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.address-item:hover {
  border-color: #409eff;
}

.address-item.selected {
  border-color: #67c23a;
  background: #f0f9ff;
}

.address-info {
  flex: 1;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.receiver-name {
  font-weight: bold;
  font-size: 15px;
  color: #303133;
}

.receiver-phone {
  color: #606266;
  font-size: 14px;
}

.address-detail {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.check-icon {
  font-size: 24px;
  flex-shrink: 0;
}

/* 商品清单 */
.product-info {
  display: flex;
  align-items: center;
  gap: 15px;
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

/* 结算信息 */
.settlement-card {
  position: sticky;
  bottom: 20px;
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

.settlement-info {
  margin-bottom: 20px;
}

.settlement-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
}

.settlement-row.total {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
  margin-top: 10px;
  font-size: 16px;
  font-weight: bold;
}

.amount {
  color: #606266;
}

.total-amount {
  color: #f56c6c;
  font-size: 20px;
}

.submit-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
}

/* 优惠券样式 */
.selected-coupon {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #409eff;
}

.coupon-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.selected-coupon-left {
  display: flex;
  align-items: center;
}

.coupon-amount {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

.selected-coupon-right {
  flex: 1;
}

.selected-coupon-name {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.selected-coupon-condition {
  font-size: 13px;
  color: #909399;
}

.coupon-desc {
  color: #606266;
  font-size: 14px;
}

.no-coupon {
  padding: 15px;
  color: #909399;
  text-align: center;
}

.discount-amount {
  color: #67c23a;
  font-weight: bold;
}

/* 优惠券对话框 */
.empty-coupons {
  padding: 40px 0;
}

.coupon-list {
  max-height: 400px;
  overflow-y: auto;
}

.coupon-item {
  display: flex;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.coupon-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.coupon-item.selected {
  border-color: #67c23a;
  background: #f0f9ff;
}

.coupon-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.coupon-left {
  width: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  margin-right: 15px;
  padding: 10px;
}

.coupon-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.coupon-type {
  font-size: 12px;
  opacity: 0.9;
}

.coupon-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.coupon-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.coupon-condition {
  font-size: 13px;
  color: #f56c6c;
  margin-bottom: 5px;
}

.coupon-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  line-height: 1.5;
}

.coupon-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coupon-expire {
  font-size: 12px;
  color: #909399;
}
</style>
