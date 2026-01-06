<template>
  <div class="points-center">
    <el-card class="points-summary">
      <div class="summary-content">
        <div class="points-info">
          <div class="total-points">
            <div class="label">总积分</div>
            <div class="value">{{ pointsData.totalPoints || 0 }}</div>
          </div>
          <div class="available-points">
            <div class="label">可用积分</div>
            <div class="value">{{ pointsData.availablePoints || 0 }}</div>
          </div>
          <div class="frozen-points">
            <div class="label">冻结积分</div>
            <div class="value">{{ pointsData.frozenPoints || 0 }}</div>
          </div>
        </div>
        <div class="actions">
          <el-button type="primary" @click="goToCoupons">
            <el-icon><Ticket /></el-icon>
            兑换优惠券
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="points-records">
      <template #header>
        <div class="card-header">
          <span>积分明细</span>
        </div>
      </template>

      <el-table :data="records" v-loading="loading" style="width: 100%">
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="积分变动" width="120">
          <template #default="{ row }">
            <span :class="row.points > 0 ? 'points-add' : 'points-minus'">
              {{ row.points > 0 ? '+' : '' }}{{ row.points }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="说明" prop="description" />
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="loadRecords"
        style="margin-top: 20px; justify-content: center"
      />

      <el-empty v-if="!loading && records.length === 0" description="暂无积分记录" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Ticket } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const pointsData = ref<any>({})
const records = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)

const loadPointsBalance = async () => {
  try {
    const res = await request.get('/points/balance')
    pointsData.value = res.data || {}
  } catch (error: any) {
    console.error('加载积分余额失败', error)
  }
}

const loadRecords = async () => {
  loading.value = true
  try {
    const res = await request.get('/points/log', {
      params: { page: page.value, size: size.value }
    })
    records.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error: any) {
    console.error('加载积分记录失败', error)
    ElMessage.error(error.message || '加载积分记录失败')
  } finally {
    loading.value = false
  }
}

const goToCoupons = () => {
  router.push('/customer/coupons')
}

const getTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    1: '消费获得',
    2: '兑换优惠券',
    3: '积分过期',
    4: '系统赠送',
    5: '退款扣除'
  }
  return typeMap[type] || '未知'
}

const getTypeTagType = (type: number) => {
  if (type === 1 || type === 4) return 'success'
  if (type === 2 || type === 5) return 'warning'
  if (type === 3) return 'danger'
  return 'info'
}

const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadPointsBalance()
  loadRecords()
})
</script>

<style scoped>
.points-center {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.points-summary {
  margin-bottom: 20px;
}

.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.points-info {
  display: flex;
  gap: 60px;
}

.total-points,
.available-points,
.frozen-points {
  text-align: center;
}

.label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.total-points .value {
  color: #409eff;
}

.available-points .value {
  color: #67c23a;
}

.frozen-points .value {
  color: #e6a23c;
}

.actions {
  display: flex;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.points-add {
  color: #67c23a;
  font-weight: bold;
}

.points-minus {
  color: #f56c6c;
  font-weight: bold;
}
</style>
