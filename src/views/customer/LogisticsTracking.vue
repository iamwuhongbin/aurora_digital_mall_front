<template>
  <div class="logistics-tracking">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <h2>物流追踪</h2>
      </template>
    </el-page-header>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>配送路线</span>
          <el-tag v-if="logistics" :type="getStatusType(logistics.status)">
            {{ getStatusText(logistics.status) }}
          </el-tag>
        </div>
      </template>

      <!-- 地图容器 -->
      <amap-container
        ref="mapRef"
        height="500px"
        :show-panel="true"
        @map-ready="onMapReady"
      />

      <!-- 物流信息 -->
      <el-descriptions v-if="logistics" :column="2" border style="margin-top: 20px;">
        <el-descriptions-item label="订单编号">{{ logistics.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="物流公司">{{ logistics.logisticsCompany }}</el-descriptions-item>
        <el-descriptions-item label="物流单号">{{ logistics.logisticsNo }}</el-descriptions-item>
        <el-descriptions-item label="配送距离">{{ logistics.distance }} 公里</el-descriptions-item>
        <el-descriptions-item label="预计时长">{{ logistics.estimatedDuration }} 分钟</el-descriptions-item>
        <el-descriptions-item label="预计送达">
          {{ formatTime(logistics.estimatedDeliveryTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="发件地址" :span="2">
          {{ logistics.senderAddress }}
        </el-descriptions-item>
        <el-descriptions-item label="收件地址" :span="2">
          {{ logistics.receiverAddress }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 物流轨迹 -->
      <el-timeline v-if="traces.length > 0" style="margin-top: 20px;">
        <el-timeline-item
          v-for="(trace, index) in traces"
          :key="trace.id"
          :timestamp="formatTime(trace.traceTime)"
          :type="index === 0 ? 'primary' : 'info'"
        >
          <div>
            <div style="font-weight: bold;">{{ trace.location }}</div>
            <div style="color: #909399; margin-top: 5px;">{{ trace.description }}</div>
            <div v-if="trace.operator" style="color: #909399; font-size: 12px; margin-top: 3px;">
              操作人：{{ trace.operator }}
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AmapContainer from '@/components/AmapContainer.vue'
import request from '@/utils/request'

const route = useRoute()
const mapRef = ref<any>(null)
const logistics = ref<any>(null)
const traces = ref<any[]>([])

// 地图准备完成
const onMapReady = ({ map, AMap }: any) => {
  console.log('地图加载完成', map, AMap)
  
  // 如果有物流信息，显示路线
  if (logistics.value) {
    showRoute()
  }
}

// 显示配送路线
const showRoute = () => {
  if (!mapRef.value || !logistics.value) return

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

// 加载物流信息
const loadLogistics = async () => {
  try {
    const orderId = route.params.orderId
    const res = await request.get(`/logistics/${orderId}`)
    logistics.value = res.data
  } catch (error: any) {
    console.error('加载物流信息失败', error)
    ElMessage.error(error.message || '加载物流信息失败')
  }
}

// 加载物流轨迹
const loadTraces = async () => {
  try {
    const orderId = route.params.orderId
    const res = await request.get(`/logistics/${orderId}/trace`)
    traces.value = res.data || []
  } catch (error: any) {
    console.error('加载物流轨迹失败', error)
  }
}

// 获取状态文本
const getStatusText = (status: number) => {
  const statusMap: any = {
    1: '已发货',
    2: '运输中',
    3: '派送中',
    4: '已签收',
    5: '异常'
  }
  return statusMap[status] || '未知'
}

// 获取状态类型
const getStatusType = (status: number) => {
  const typeMap: any = {
    1: 'info',
    2: 'warning',
    3: 'primary',
    4: 'success',
    5: 'danger'
  }
  return typeMap[status] || 'info'
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  loadLogistics()
  loadTraces()
})
</script>

<style scoped>
.logistics-tracking {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.logistics-tracking h2 {
  margin: 0;
  font-size: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
