<template>
  <div class="sku-manager">
    <div class="sku-header">
      <span>商品规格</span>
      <el-button type="primary" size="small" @click="addSku">添加规格</el-button>
    </div>
    
    <el-table :data="skus" border style="width: 100%; margin-top: 10px">
      <el-table-column label="规格名称" width="180">
        <template #default="{ row }">
          <el-input v-model="row.skuName" placeholder="如：红色-128G" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="价格" width="130">
        <template #default="{ row }">
          <el-input-number v-model="row.price" :min="0" :precision="2" size="small" style="width: 100%" />
        </template>
      </el-table-column>
      <el-table-column label="库存" width="110">
        <template #default="{ row }">
          <el-input-number v-model="row.stock" :min="0" size="small" style="width: 100%" />
        </template>
      </el-table-column>
      <el-table-column label="规格图片" width="120">
        <template #default="{ row }">
          <ImageUpload v-model="row.skuImage" :show-file-list="false" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ $index }">
          <el-button link type="danger" size="small" @click="removeSku($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-alert 
      v-if="skus.length === 0" 
      title="暂无规格，如果商品有多个规格（如颜色、尺寸等），请添加规格信息" 
      type="info" 
      :closable="false"
      style="margin-top: 10px"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ImageUpload from './ImageUpload.vue'

interface Sku {
  id?: number
  skuName: string
  skuAttrs: string
  price: number
  stock: number
  skuImage: string
}

const props = defineProps<{
  modelValue: Sku[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Sku[]): void
}>()

const skus = ref<Sku[]>(props.modelValue || [])

watch(() => props.modelValue, (newVal) => {
  skus.value = newVal || []
}, { deep: true })

watch(skus, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

const addSku = () => {
  skus.value.push({
    skuName: '',
    skuAttrs: '{}',
    price: 0,
    stock: 0,
    skuImage: ''
  })
}

const removeSku = (index: number) => {
  skus.value.splice(index, 1)
}
</script>

<style scoped>
.sku-manager {
  width: 100%;
}

.sku-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
}
</style>
