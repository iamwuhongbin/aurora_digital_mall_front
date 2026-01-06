<template>
  <div class="amap-container">
    <div id="amap" :style="{ width: width, height: height }"></div>
    <div v-if="showPanel" id="panel" class="route-panel"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { amapConfig, mapDefaultConfig } from '@/config/amap.config'

interface Props {
  width?: string
  height?: string
  center?: [number, number]
  zoom?: number
  showPanel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '500px',
  center: () => [116.397428, 39.90923],
  zoom: 13,
  showPanel: false
})

const emit = defineEmits(['mapReady'])

const map = ref<any>(null)
const AMap = ref<any>(null)

// 初始化地图
const initMap = async () => {
  try {
    // 设置安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: amapConfig.securityJsCode
    }

    // 加载高德地图
    AMap.value = await AMapLoader.load({
      key: amapConfig.key,
      version: amapConfig.version,
      plugins: amapConfig.plugins
    })

    // 创建地图实例
    map.value = new AMap.value.Map('amap', {
      ...mapDefaultConfig,
      center: props.center,
      zoom: props.zoom
    })

    // 添加控件
    map.value.addControl(new AMap.value.Scale())
    map.value.addControl(new AMap.value.ToolBar())

    // 通知父组件地图已准备好
    emit('mapReady', { map: map.value, AMap: AMap.value })
  } catch (error) {
    console.error('地图加载失败', error)
  }
}

// 添加标记
const addMarker = (position: [number, number], options: any = {}) => {
  if (!map.value || !AMap.value) return null

  const marker = new AMap.value.Marker({
    position,
    ...options
  })

  map.value.add(marker)
  return marker
}

// 添加路线
const addPolyline = (path: any[], options: any = {}) => {
  if (!map.value || !AMap.value) return null

  const polyline = new AMap.value.Polyline({
    path,
    strokeColor: '#3366FF',
    strokeWeight: 6,
    strokeOpacity: 0.8,
    ...options
  })

  map.value.add(polyline)
  return polyline
}

// 路径规划
const planRoute = (start: [number, number], end: [number, number]) => {
  if (!map.value || !AMap.value) return

  const driving = new AMap.value.Driving({
    map: map.value,
    panel: props.showPanel ? 'panel' : undefined
  })

  driving.search(
    new AMap.value.LngLat(start[0], start[1]),
    new AMap.value.LngLat(end[0], end[1]),
    (status: string, result: any) => {
      if (status === 'complete') {
        console.log('路径规划成功', result)
      } else {
        console.error('路径规划失败', result)
      }
    }
  )
}

// 清除地图上的覆盖物
const clearMap = () => {
  if (map.value) {
    map.value.clearMap()
  }
}

// 设置地图中心
const setCenter = (center: [number, number]) => {
  if (map.value) {
    map.value.setCenter(center)
  }
}

// 设置缩放级别
const setZoom = (zoom: number) => {
  if (map.value) {
    map.value.setZoom(zoom)
  }
}

// 自适应显示所有覆盖物
const setFitView = () => {
  if (map.value) {
    map.value.setFitView()
  }
}

// 监听中心点变化
watch(() => props.center, (newCenter) => {
  setCenter(newCenter)
})

// 监听缩放级别变化
watch(() => props.zoom, (newZoom) => {
  setZoom(newZoom)
})

// 暴露方法给父组件
defineExpose({
  map,
  AMap,
  addMarker,
  addPolyline,
  planRoute,
  clearMap,
  setCenter,
  setZoom,
  setFitView
})

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.destroy()
  }
})
</script>

<style scoped>
.amap-container {
  position: relative;
  width: 100%;
}

#amap {
  border-radius: 4px;
}

.route-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 10px;
}
</style>
