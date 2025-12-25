<template>
  <div class="profile">
    <div class="profile-container">
      <!-- 左侧菜单 -->
      <div class="sidebar">
        <!-- 用户信息卡片 -->
        <el-card class="user-card">
          <div class="user-avatar">
            <el-avatar :size="80" :icon="UserFilled" />
          </div>
          <div class="user-name">{{ userInfo.nickname || userInfo.username }}</div>
          <div class="user-phone">{{ userInfo.phone || '未绑定手机' }}</div>
        </el-card>

        <!-- 菜单卡片 -->
        <el-card class="menu-card">
          <div class="menu-group">
            <div class="menu-title">账户与安全</div>
            <div class="menu-item" :class="{active: activeMenu === 'info'}" @click="handleMenuSelect('info')">
              <span>个人信息</span>
            </div>
            <div class="menu-item" :class="{active: activeMenu === 'address'}" @click="handleMenuSelect('address')">
              <span>收货地址</span>
            </div>
            <div class="menu-item" :class="{active: activeMenu === 'points'}" @click="handleMenuSelect('points')">
              <span>我的积分</span>
            </div>
            <div class="menu-item" :class="{active: activeMenu === 'coupon'}" @click="handleMenuSelect('coupon')">
              <span>优惠券</span>
            </div>
            <div class="menu-item" :class="{active: activeMenu === 'security'}" @click="handleMenuSelect('security')">
              <span>账号安全</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧内容 -->
      <div class="content">
        <!-- 个人信息 -->
        <el-card v-show="activeMenu === 'info'">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
              <el-button type="primary" size="small" @click="editDialogVisible = true">编辑资料</el-button>
            </div>
          </template>
          <el-descriptions :column="1" border size="large">
            <el-descriptions-item label="用户名" label-class-name="desc-label">
              {{ userInfo.username || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="昵称" label-class-name="desc-label">
              {{ userInfo.nickname || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号" label-class-name="desc-label">
              {{ userInfo.phone || '未绑定' }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱" label-class-name="desc-label">
              {{ userInfo.email || '未绑定' }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间" label-class-name="desc-label">
              {{ userInfo.createdAt || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 收货地址 -->
        <el-card v-show="activeMenu === 'address'">
          <template #header>
            <div class="card-header">
              <span>收货地址</span>
              <el-button type="primary" size="small" @click="showAddressDialog()">添加地址</el-button>
            </div>
          </template>
          <el-empty v-if="addresses.length === 0" description="暂无收货地址" />
          <div v-else class="address-list">
            <div v-for="addr in addresses" :key="addr.id" class="address-item">
              <el-tag v-if="addr.isDefault" type="success" size="small">默认</el-tag>
              <div class="address-info">
                <div>{{ addr.receiverName }} {{ addr.receiverPhone }}</div>
                <div>{{ addr.province }} {{ addr.city }} {{ addr.district }}</div>
                <div>{{ addr.detailAddress }}</div>
              </div>
              <div class="address-actions">
                <el-button link type="primary" size="small" @click="showAddressDialog(addr)">编辑</el-button>
                <el-button link type="primary" size="small" @click="setDefaultAddress(addr.id)" v-if="!addr.isDefault">设为默认</el-button>
                <el-button link type="danger" size="small" @click="deleteAddress(addr.id)">删除</el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 我的积分 -->
        <el-card v-show="activeMenu === 'points'">
          <template #header>
            <div class="card-header">
              <span>我的积分</span>
            </div>
          </template>
          <div class="points-summary">
            <div class="points-card">
              <h3>总积分</h3>
              <div class="value">{{ pointsInfo.totalPoints || 0 }}</div>
            </div>
            <div class="points-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <h3>可用积分</h3>
              <div class="value">{{ pointsInfo.availablePoints || 0 }}</div>
            </div>
            <div class="points-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <h3>已使用</h3>
              <div class="value">{{ pointsInfo.usedPoints || 0 }}</div>
            </div>
          </div>
          <div class="points-logs">
            <h3 style="margin-bottom: 16px; color: #303133;">积分明细</h3>
            <el-empty v-if="pointsLogs.length === 0" description="暂无积分记录" />
            <div v-else>
              <div v-for="log in pointsLogs" :key="log.id" class="log-item">
                <div class="log-info">
                  <div class="remark">{{ log.remark || '积分变动' }}</div>
                  <div class="time">{{ log.createdAt }}</div>
                </div>
                <div class="log-amount" :class="log.changeAmount > 0 ? 'positive' : 'negative'">
                  {{ log.changeAmount > 0 ? '+' : '' }}{{ log.changeAmount }}
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 优惠券 -->
        <el-card v-show="activeMenu === 'coupon'">
          <template #header>
            <div class="card-header">
              <span>我的优惠券</span>
            </div>
          </template>
          <el-empty v-if="unusedCoupons.length === 0" description="暂无可用优惠券" />
          <div v-else class="coupon-list">
            <div v-for="coupon in unusedCoupons" :key="coupon.id" class="coupon-item">
              <div class="coupon-amount">¥{{ coupon.discountAmount || 0 }}</div>
              <div class="coupon-name">{{ coupon.couponName || '优惠券' }}</div>
              <div class="coupon-expire">有效期至：{{ coupon.expireTime || '-' }}</div>
            </div>
          </div>
        </el-card>

        <!-- 账号安全 -->
        <el-card v-show="activeMenu === 'security'">
          <template #header>
            <span>账号安全</span>
          </template>
          <div class="security-list">
            <div class="security-item">
              <div class="security-info">
                <el-icon><Lock /></el-icon>
                <div class="security-content">
                  <div style="font-weight: 600; color: #303133; margin-bottom: 4px;">登录密码</div>
                  <div style="color: #909399; font-size: 13px;">定期修改密码可以提高账号安全性</div>
                </div>
              </div>
              <el-button type="primary" size="small" @click="passwordDialogVisible = true">修改密码</el-button>
            </div>
            <div class="security-item">
              <div class="security-info">
                <el-icon><Iphone /></el-icon>
                <div class="security-content">
                  <div style="font-weight: 600; color: #303133; margin-bottom: 4px;">手机号</div>
                  <div style="color: #909399; font-size: 13px;">{{ userInfo.phone || '未绑定' }}</div>
                </div>
              </div>
              <el-button type="primary" size="small" @click="editDialogVisible = true">{{ userInfo.phone ? '修改' : '绑定' }}</el-button>
            </div>
            <div class="security-item">
              <div class="security-info">
                <el-icon><Message /></el-icon>
                <div class="security-content">
                  <div style="font-weight: 600; color: #303133; margin-bottom: 4px;">邮箱</div>
                  <div style="color: #909399; font-size: 13px;">{{ userInfo.email || '未绑定' }}</div>
                </div>
              </div>
              <el-button type="primary" size="small" @click="editDialogVisible = true">{{ userInfo.email ? '修改' : '绑定' }}</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑资料" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUserInfo">保存</el-button>
      </template>
    </el-dialog>

    <!-- 地址对话框 -->
    <el-dialog v-model="addressDialogVisible" :title="addressForm.id ? '编辑地址' : '添加地址'" width="600px">
      <el-form :model="addressForm" label-width="100px">
        <el-form-item label="收货人">
          <el-input v-model="addressForm.receiverName" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addressForm.receiverPhone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="所在地区">
          <el-input v-model="addressForm.province" placeholder="省" style="width: 30%; margin-right: 5%" />
          <el-input v-model="addressForm.city" placeholder="市" style="width: 30%; margin-right: 5%" />
          <el-input v-model="addressForm.district" placeholder="区" style="width: 30%" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="addressForm.detailAddress" type="textarea" :rows="3" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="addressForm.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="500px">
      <el-form :model="passwordForm" label-width="100px">
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Location, Medal, Ticket, Lock, Iphone, Message, UserFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'

const activeMenu = ref('info')
const userInfo = ref<any>({})
const addresses = ref<any[]>([])
const pointsInfo = ref<any>({})
const pointsLogs = ref<any[]>([])
const unusedCoupons = ref<any[]>([])
const couponTab = ref('unused')

const editDialogVisible = ref(false)
const addressDialogVisible = ref(false)
const passwordDialogVisible = ref(false)

const editForm = reactive({
  nickname: '',
  phone: '',
  email: ''
})

const addressForm = reactive({
  id: null,
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  isDefault: false
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const handleMenuSelect = (index: string) => {
  activeMenu.value = index
  if (index === 'address' && addresses.value.length === 0) {
    loadAddresses()
  } else if (index === 'points' && pointsLogs.value.length === 0) {
    loadPoints()
  } else if (index === 'coupon' && unusedCoupons.value.length === 0) {
    loadCoupons()
  }
}

const loadUserInfo = async () => {
  try {
    const res = await request.get('/customer/profile')
    userInfo.value = res.data
    localStorage.setItem('userInfo', JSON.stringify(res.data))
  } catch (error: any) {
    console.error('加载用户信息失败', error)
    // 如果是403错误，说明没有权限，使用本地存储的数据
    if (error.response?.status === 403 || error.response?.status === 401) {
      ElMessage.warning('请先登录')
      const localInfo = localStorage.getItem('userInfo')
      if (localInfo) {
        userInfo.value = JSON.parse(localInfo)
      }
    }
  }
}

const saveUserInfo = async () => {
  try {
    await request.put('/customer/profile', editForm)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadUserInfo()
  } catch (error) {
    console.error('保存失败', error)
  }
}

const loadAddresses = async () => {
  try {
    const res = await request.get('/customer/address')
    addresses.value = res.data || []
  } catch (error) {
    console.error('加载地址失败', error)
  }
}

const showAddressDialog = (addr?: any) => {
  if (addr) {
    Object.assign(addressForm, addr)
  } else {
    Object.assign(addressForm, {
      id: null,
      receiverName: '',
      receiverPhone: '',
      province: '',
      city: '',
      district: '',
      detailAddress: '',
      isDefault: false
    })
  }
  addressDialogVisible.value = true
}

const saveAddress = async () => {
  try {
    const data = {
      ...addressForm,
      isDefault: addressForm.isDefault ? 1 : 0
    }
    if (addressForm.id) {
      await request.put(`/customer/address/${addressForm.id}`, data)
    } else {
      await request.post('/customer/address', data)
    }
    ElMessage.success('保存成功')
    addressDialogVisible.value = false
    loadAddresses()
  } catch (error) {
    console.error('保存地址失败', error)
  }
}

const setDefaultAddress = async (id: number) => {
  try {
    await request.put(`/customer/address/${id}/default`)
    ElMessage.success('设置成功')
    loadAddresses()
  } catch (error) {
    console.error('设置默认地址失败', error)
  }
}

const deleteAddress = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个地址吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.delete(`/customer/address/${id}`)
    ElMessage.success('删除成功')
    loadAddresses()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除地址失败', error)
    }
  }
}

const loadPoints = async () => {
  try {
    const res = await request.get('/points/balance')
    pointsInfo.value = res.data
    const logsRes = await request.get('/points/log', {
      params: { page: 1, size: 20 }
    })
    pointsLogs.value = logsRes.data?.list || []
  } catch (error) {
    console.error('加载积分信息失败', error)
  }
}

const loadCoupons = async () => {
  try {
    const res = await request.get('/coupon/my', {
      params: { status: 1, page: 1, size: 20 }
    })
    unusedCoupons.value = res.data?.list || []
  } catch (error) {
    console.error('加载优惠券失败', error)
  }
}

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  try {
    await request.put('/customer/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordDialogVisible.value = false
    setTimeout(() => {
      localStorage.clear()
      window.location.href = '/login'
    }, 1500)
  } catch (error) {
    console.error('修改密码失败', error)
  }
}

onMounted(() => {
  const info = localStorage.getItem('userInfo')
  if (info) {
    userInfo.value = JSON.parse(info)
    editForm.nickname = userInfo.value.nickname
    editForm.phone = userInfo.value.phone
    editForm.email = userInfo.value.email
  }
  loadUserInfo()
})
</script>

<style scoped>
.profile {
  min-height: calc(100vh - 60px);
  background-color: #f5f5f5;
  padding: 30px 60px;
}

.profile-container {
  display: flex;
  gap: 30px;
  max-width: 1600px;
  margin: 0 auto;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
}

.content {
  flex: 1;
  min-width: 0;
}

/* 用户信息卡片 */
.user-card {
  margin-bottom: 20px;
  text-align: center;
}

.user-avatar {
  margin: 20px 0;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.user-phone {
  font-size: 13px;
  color: #909399;
  margin-bottom: 20px;
}

/* 菜单卡片 */
.menu-card {
  background-color: #fff;
}

.menu-group {
  padding: 0;
}

.menu-title {
  padding: 16px 20px 12px;
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.menu-item {
  padding: 14px 20px;
  cursor: pointer;
  color: #303133;
  font-size: 14px;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background-color: #fef5e7;
}

.menu-item.active {
  background-color: #fef5e7;
  border-left-color: #ff6700;
  color: #ff6700;
  font-weight: 500;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-card) {
  margin-bottom: 16px;
}

:deep(.desc-label) {
  width: 100px;
  font-weight: normal;
}

:deep(.el-descriptions__cell) {
  padding: 12px 16px;
}

:deep(.el-descriptions__label) {
  background-color: #fafafa;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  position: relative;
}

.address-item .el-tag {
  position: absolute;
  top: 12px;
  right: 12px;
}

.address-info div {
  margin-bottom: 6px;
  color: #606266;
  font-size: 14px;
}

.address-info div:first-child {
  font-weight: 500;
  color: #303133;
}

.address-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.points-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.points-card {
  flex: 1;
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  color: #fff;
}

.points-card h3 {
  font-size: 13px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.points-card .value {
  font-size: 28px;
  font-weight: bold;
}

.points-logs {
  margin-top: 16px;
}

.log-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.log-item:last-child {
  border-bottom: none;
}

.log-info .remark {
  color: #303133;
  font-size: 14px;
  margin-bottom: 4px;
}

.log-info .time {
  color: #909399;
  font-size: 12px;
}

.log-amount {
  font-size: 16px;
  font-weight: bold;
}

.log-amount.positive {
  color: #67c23a;
}

.log-amount.negative {
  color: #f56c6c;
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupon-item {
  border: 1px dashed #ff6b6b;
  border-radius: 4px;
  padding: 16px;
  background: #fff5f5;
}

.coupon-amount {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
  margin-bottom: 6px;
}

.coupon-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 6px;
}

.coupon-expire {
  font-size: 12px;
  color: #909399;
}

.security-list {
  display: flex;
  flex-direction: column;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
}

.security-item:last-child {
  border-bottom: none;
}

.security-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.security-info .el-icon {
  font-size: 20px;
  color: #409eff;
}

.security-content {
  display: flex;
  flex-direction: column;
}
</style>
