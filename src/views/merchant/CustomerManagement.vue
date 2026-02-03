<template>
  <div class="customer-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>客户管理</span>
          <el-button type="primary" size="small" @click="syncCustomerData" :loading="syncing">
            同步历史数据
          </el-button>
        </div>
      </template>

      <!-- 数据概览 -->
      <div class="stats-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                <el-icon :size="24"><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.totalCustomers || 0 }}</div>
                <div class="stat-label">客户总数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                <el-icon :size="24"><TrendCharts /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">+{{ stats.newCustomersThisMonth || 0 }}</div>
                <div class="stat-label">本月新增</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                <el-icon :size="24"><Histogram /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.activeCustomers || 0 }}</div>
                <div class="stat-label">活跃客户</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
                <el-icon :size="24"><Money /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">¥{{ formatMoney(stats.totalRevenue) }}</div>
                <div class="stat-label">累计消费</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 筛选条件 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="搜索">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="客户昵称/手机号" 
            clearable 
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="客户等级">
          <el-select v-model="searchForm.customerLevel" placeholder="全部" clearable style="width: 120px">
            <el-option label="普通客户" :value="1" />
            <el-option label="银牌客户" :value="2" />
            <el-option label="金牌客户" :value="3" />
            <el-option label="钻石客户" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="消费金额">
          <el-input-number 
            v-model="searchForm.minAmount" 
            :min="0" 
            :precision="2" 
            placeholder="最低"
            style="width: 120px"
          />
          <span style="margin: 0 8px">-</span>
          <el-input-number 
            v-model="searchForm.maxAmount" 
            :min="0" 
            :precision="2" 
            placeholder="最高"
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadCustomers">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 客户列表 -->
      <el-table :data="customers" v-loading="loading" style="width: 100%">
        <el-table-column label="客户信息" min-width="200">
          <template #default="{ row }">
            <div class="customer-info">
              <el-avatar :src="row.avatar" :size="40">
                {{ row.nickname?.charAt(0) }}
              </el-avatar>
              <div class="customer-details">
                <div class="customer-name">{{ row.nickname }}</div>
                <div class="customer-phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户等级" width="120">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.customerLevel)">
              {{ row.customerLevelText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalOrders" label="订单数" width="100" />
        <el-table-column label="累计消费" width="120">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold">
              ¥{{ formatMoney(row.totalAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="平均客单价" width="120">
          <template #default="{ row }">
            ¥{{ formatMoney(row.avgOrderAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="最后购买" width="180">
          <template #default="{ row }">
            {{ formatTime(row.lastOrderTime) }}
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.registerTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showCustomerDetail(row.customerId)">
              详情
            </el-button>
            <el-button link type="success" size="small" @click="startChat(row.customerId)">
              聊天
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadCustomers"
        @current-change="loadCustomers"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 客户详情对话框 -->
    <el-dialog 
      v-model="detailVisible" 
      title="客户详情" 
      width="900px"
      @close="resetDetail"
    >
      <div v-if="customerDetail" class="customer-detail">
        <el-tabs v-model="activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <div class="detail-section">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">客户昵称：</span>
                    <span class="info-value">{{ customerDetail.nickname }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">手机号码：</span>
                    <span class="info-value">{{ customerDetail.phone }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">注册时间：</span>
                    <span class="info-value">{{ formatDate(customerDetail.registerTime) }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="info-item">
                    <span class="info-label">客户等级：</span>
                    <el-tag :type="getLevelType(customerDetail.customerLevel)">
                      {{ customerDetail.customerLevelText }}
                    </el-tag>
                  </div>
                  <div class="info-item">
                    <span class="info-label">邮箱地址：</span>
                    <span class="info-value">{{ customerDetail.email || '未填写' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">最后登录：</span>
                    <span class="info-value">{{ formatDate(customerDetail.lastLoginTime) }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 消费数据 -->
          <el-tab-pane label="消费数据" name="consume">
            <div class="detail-section">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="data-card">
                    <div class="data-label">累计消费</div>
                    <div class="data-value" style="color: #f56c6c">
                      ¥{{ formatMoney(customerDetail.totalAmount) }}
                    </div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="data-card">
                    <div class="data-label">订单总数</div>
                    <div class="data-value" style="color: #409eff">
                      {{ customerDetail.totalOrders }}
                    </div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="data-card">
                    <div class="data-label">平均客单价</div>
                    <div class="data-value" style="color: #67c23a">
                      ¥{{ formatMoney(customerDetail.avgOrderAmount) }}
                    </div>
                  </div>
                </el-col>
              </el-row>
              <el-row :gutter="20" style="margin-top: 20px">
                <el-col :span="8">
                  <div class="data-card">
                    <div class="data-label">已完成订单</div>
                    <div class="data-value">{{ customerDetail.completedOrders }}</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="data-card">
                    <div class="data-label">已取消订单</div>
                    <div class="data-value">{{ customerDetail.cancelledOrders }}</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="data-card">
                    <div class="data-label">首次购买</div>
                    <div class="data-value" style="font-size: 14px">
                      {{ formatDate(customerDetail.firstOrderTime) }}
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 订单历史 -->
          <el-tab-pane label="订单历史" name="orders">
            <el-table :data="customerDetail.recentOrders" style="width: 100%" max-height="400">
              <el-table-column prop="orderSn" label="订单号" width="180" />
              <el-table-column label="下单时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.orderTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="productNames" label="商品" show-overflow-tooltip />
              <el-table-column label="订单金额" width="120">
                <template #default="{ row }">
                  ¥{{ formatMoney(row.totalAmount) }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getOrderStatusType(row.orderStatus)">
                    {{ row.orderStatusText }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="customerDetail.recentOrders && customerDetail.recentOrders.length === 0" 
                 style="text-align: center; padding: 20px; color: #909399">
              暂无订单记录
            </div>
          </el-tab-pane>

          <!-- 客户备注 -->
          <el-tab-pane label="客户备注" name="notes">
            <el-input
              v-model="customerNotes"
              type="textarea"
              :rows="6"
              placeholder="添加客户备注..."
            />
            <div style="margin-top: 12px; text-align: right">
              <el-button type="primary" @click="saveNotes" :loading="savingNotes">
                保存备注
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="success" @click="startChat(customerDetail?.customerId)">
          发起聊天
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, TrendCharts, Histogram, Money } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const savingNotes = ref(false)
const syncing = ref(false)
const customers = ref<any[]>([])
const detailVisible = ref(false)
const customerDetail = ref<any>(null)
const customerNotes = ref('')
const activeTab = ref('basic')

const stats = reactive({
  totalCustomers: 0,
  newCustomersThisMonth: 0,
  activeCustomers: 0,
  totalRevenue: 0
})

const searchForm = reactive({
  keyword: '',
  customerLevel: null as number | null,
  minAmount: null as number | null,
  maxAmount: null as number | null
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

onMounted(() => {
  loadStats()
  loadCustomers()
})

const loadStats = async () => {
  try {
    const res = await request.get('/merchant/customer/stats')
    Object.assign(stats, res.data)
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

const loadCustomers = async () => {
  loading.value = true
  try {
    const res = await request.get('/merchant/customer/list', {
      params: {
        keyword: searchForm.keyword || undefined,
        customerLevel: searchForm.customerLevel,
        minAmount: searchForm.minAmount,
        maxAmount: searchForm.maxAmount,
        page: pagination.page,
        size: pagination.size
      }
    })
    customers.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('加载客户列表失败', error)
    ElMessage.error('加载客户列表失败')
  } finally {
    loading.value = false
  }
}

const showCustomerDetail = async (customerId: number) => {
  try {
    const res = await request.get(`/merchant/customer/detail/${customerId}`)
    customerDetail.value = res.data
    customerNotes.value = res.data.notes || ''
    detailVisible.value = true
    activeTab.value = 'basic'
  } catch (error) {
    console.error('加载客户详情失败', error)
    ElMessage.error('加载客户详情失败')
  }
}

const saveNotes = async () => {
  if (!customerDetail.value) return
  
  savingNotes.value = true
  try {
    await request.put(`/merchant/customer/notes/${customerDetail.value.customerId}`, customerNotes.value)
    ElMessage.success('备注保存成功')
    customerDetail.value.notes = customerNotes.value
  } catch (error) {
    console.error('保存备注失败', error)
    ElMessage.error('保存备注失败')
  } finally {
    savingNotes.value = false
  }
}

const syncCustomerData = async () => {
  syncing.value = true
  try {
    const res = await request.post('/admin/data-sync/sync-customer-data')
    ElMessage.success(res.data || '数据同步成功')
    await loadStats()
    await loadCustomers()
  } catch (error) {
    console.error('同步数据失败', error)
    ElMessage.error('同步数据失败')
  } finally {
    syncing.value = false
  }
}

const startChat = (customerId: number) => {
  ElMessage.info('聊天功能开发中...')
  // TODO: 跳转到聊天页面或打开聊天窗口
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.customerLevel = null
  searchForm.minAmount = null
  searchForm.maxAmount = null
  pagination.page = 1
  loadCustomers()
}

const resetDetail = () => {
  customerDetail.value = null
  customerNotes.value = ''
}

const getLevelType = (level: number) => {
  switch (level) {
    case 4: return 'danger'
    case 3: return 'warning'
    case 2: return 'success'
    default: return 'info'
  }
}

const getOrderStatusType = (status: number) => {
  switch (status) {
    case 4: return 'success'
    case 6: return 'info'
    case 5: return 'warning'
    default: return 'primary'
  }
}

const formatMoney = (amount: number | null | undefined) => {
  if (!amount) return '0.00'
  return amount.toFixed(2)
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (date: string | null | undefined) => {
  if (!date) return '从未购买'
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}
</script>

<style scoped>
.customer-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.stats-overview {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.search-form {
  margin: 20px 0;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-details {
  flex: 1;
}

.customer-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.customer-phone {
  font-size: 12px;
  color: #909399;
}

.customer-detail {
  min-height: 400px;
}

.detail-section {
  padding: 20px 0;
}

.info-item {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.info-label {
  font-weight: 600;
  color: #606266;
  min-width: 100px;
}

.info-value {
  color: #303133;
}

.data-card {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.data-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.data-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}
</style>
