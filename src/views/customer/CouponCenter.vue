<template>
  <div class="coupon-center">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 可兑换优惠券 -->
      <el-tab-pane label="可兑换优惠券" name="available">
        <div class="coupon-list" v-loading="loading">
          <div v-if="availableCoupons.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无可兑换的优惠券" />
          </div>
          <div v-else class="coupon-grid">
            <div v-for="coupon in availableCoupons" :key="coupon.id" class="coupon-card">
              <div class="coupon-left">
                <div class="coupon-amount">
                  <span v-if="coupon.couponType === 1 || coupon.couponType === 3" class="amount">
                    ¥{{ coupon.discountAmount }}
                  </span>
                  <span v-else class="amount">
                    {{ (coupon.discountRate * 10).toFixed(1) }}折
                  </span>
                </div>
                <div class="coupon-condition">
                  <span v-if="coupon.minAmount > 0">满{{ coupon.minAmount }}元可用</span>
                  <span v-else>无门槛</span>
                </div>
              </div>
              <div class="coupon-right">
                <div class="coupon-name">{{ coupon.couponName }}</div>
                <div class="coupon-desc">{{ coupon.description }}</div>
                <div class="coupon-info">
                  <span class="points-cost">{{ coupon.pointsCost }}积分</span>
                  <span class="valid-days">有效期{{ coupon.validDays }}天</span>
                </div>
                <div class="coupon-stock" v-if="coupon.totalCount > 0">
                  剩余：{{ coupon.totalCount - coupon.receivedCount }}/{{ coupon.totalCount }}
                </div>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="exchangeCoupon(coupon)"
                  :loading="exchanging === coupon.id"
                >
                  立即兑换
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 我的优惠券 -->
      <el-tab-pane label="我的优惠券" name="my">
        <el-radio-group v-model="couponStatus" @change="loadMyCoupons" class="status-filter">
          <el-radio-button :label="null">全部</el-radio-button>
          <el-radio-button :label="1">未使用</el-radio-button>
          <el-radio-button :label="2">已使用</el-radio-button>
          <el-radio-button :label="3">已过期</el-radio-button>
        </el-radio-group>

        <div class="coupon-list" v-loading="loading">
          <div v-if="myCoupons.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无优惠券" />
          </div>
          <div v-else class="coupon-grid">
            <div 
              v-for="item in myCoupons" 
              :key="item.id" 
              class="coupon-card"
              :class="{ 'coupon-used': item.status === 2, 'coupon-expired': item.status === 3 }"
            >
              <div class="coupon-left">
                <div class="coupon-amount">
                  <span class="amount" v-if="item.couponType === 1 || item.couponType === 3">
                    ¥{{ item.discountAmount }}
                  </span>
                  <span class="amount" v-else-if="item.couponType === 2">
                    {{ (item.discountRate * 10).toFixed(1) }}折
                  </span>
                  <span class="amount" v-else>优惠券</span>
                </div>
                <div class="coupon-type">
                  {{ getCouponTypeName(item.couponType) }}
                </div>
              </div>
              <div class="coupon-right">
                <div class="coupon-header">
                  <h3 class="coupon-name">{{ item.couponName || '优惠券' }}</h3>
                  <el-tag v-if="item.status === 1" type="success" size="small">未使用</el-tag>
                  <el-tag v-else-if="item.status === 2" type="info" size="small">已使用</el-tag>
                  <el-tag v-else type="danger" size="small">已过期</el-tag>
                </div>
                <div class="coupon-condition">
                  <span v-if="item.minAmount && item.minAmount > 0">
                    满{{ item.minAmount }}元可用
                  </span>
                  <span v-else>无门槛</span>
                </div>
                <div class="coupon-desc" v-if="item.description">
                  {{ item.description }}
                </div>
                <div class="coupon-time">
                  <div>领取时间：{{ formatTime(item.receivedAt) }}</div>
                  <div>过期时间：{{ formatTime(item.expireAt) }}</div>
                  <div v-if="item.usedAt">使用时间：{{ formatTime(item.usedAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const activeTab = ref('available')
const loading = ref(false)
const exchanging = ref<number | null>(null)
const availableCoupons = ref<any[]>([])
const myCoupons = ref<any[]>([])
const couponStatus = ref<number | null>(null)

const loadAvailableCoupons = async () => {
  loading.value = true
  try {
    const res = await request.get('/coupon/available', {
      params: { page: 1, size: 100 }
    })
    availableCoupons.value = res.data?.list || []
  } catch (error: any) {
    console.error('加载可兑换优惠券失败', error)
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const loadMyCoupons = async () => {
  loading.value = true
  try {
    const res = await request.get('/coupon/my', {
      params: { 
        status: couponStatus.value,
        page: 1, 
        size: 100 
      }
    })
    myCoupons.value = res.data?.list || []
  } catch (error: any) {
    console.error('加载我的优惠券失败', error)
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const exchangeCoupon = async (coupon: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要用 ${coupon.pointsCost} 积分兑换该优惠券吗？`,
      '确认兑换',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    exchanging.value = coupon.id
    await request.post(`/coupon/exchange/${coupon.id}`)
    ElMessage.success('兑换成功！')
    
    loadAvailableCoupons()
    if (activeTab.value === 'my') {
      loadMyCoupons()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('兑换优惠券失败', error)
      ElMessage.error(error.message || '兑换失败')
    }
  } finally {
    exchanging.value = null
  }
}

const handleTabChange = (tab: string) => {
  if (tab === 'available') {
    loadAvailableCoupons()
  } else {
    loadMyCoupons()
  }
}

const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getCouponTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    1: '满减券',
    2: '折扣券',
    3: '无门槛券'
  }
  return typeMap[type] || '优惠券'
}

onMounted(() => {
  loadAvailableCoupons()
})
</script>

<style scoped>
.coupon-center {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.status-filter {
  margin-bottom: 20px;
}

.coupon-list {
  min-height: 400px;
}

.empty-state {
  padding: 60px 0;
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.coupon-card {
  display: flex;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  transition: all 0.3s;
}

.coupon-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.coupon-used,
.coupon-expired {
  opacity: 0.6;
  filter: grayscale(0.5);
}

.coupon-left {
  width: 140px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
}

.coupon-left::after {
  content: '';
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
}

.coupon-amount {
  margin-bottom: 10px;
}

.amount {
  font-size: 28px;
  font-weight: bold;
}

.coupon-type {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 5px;
}

.coupon-right {
  flex: 1;
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.coupon-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.coupon-condition {
  font-size: 13px;
  color: #f56c6c;
  margin-bottom: 8px;
}

.coupon-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
  line-height: 1.5;
}

.coupon-info {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 10px;
}

.points-cost {
  color: #f56c6c;
  font-weight: bold;
}

.coupon-stock {
  font-size: 12px;
  color: #e6a23c;
  margin-bottom: 10px;
}

.coupon-status {
  margin-bottom: 10px;
}

.coupon-time {
  font-size: 12px;
  color: #909399;
  line-height: 1.8;
}
</style>
