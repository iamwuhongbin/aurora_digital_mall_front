<template>
  <div class="product-detail">
    <el-card v-loading="loading">
      <el-row :gutter="40" v-if="product.id">
        <el-col :span="10">
          <div class="image-gallery">
            <el-image 
              :src="currentImage" 
              class="main-image"
              fit="cover"
              :preview-src-list="imageList"
            />
            <div class="thumbnail-list" v-if="imageList.length > 1">
              <el-image 
                v-for="(img, index) in imageList" 
                :key="index"
                :src="img" 
                class="thumbnail"
                :class="{ active: currentImage === img }"
                @click="currentImage = img"
                fit="cover"
              />
            </div>
          </div>
        </el-col>
        <el-col :span="14">
          <div class="product-info">
            <h1 class="product-title">{{ product.productName }}</h1>
            <div class="product-subtitle">{{ product.brand }}</div>
            
            <div class="price-section">
              <div class="price-row">
                <span class="label">售价</span>
                <span class="sale-price">¥{{ product.salePrice }}</span>
                <span class="original-price" v-if="product.originalPrice > product.salePrice">
                  ¥{{ product.originalPrice }}
                </span>
              </div>
            </div>

            <div class="info-row">
              <span class="label">库存</span>
              <span class="value">{{ product.stock }} 件</span>
            </div>

            <div class="info-row">
              <span class="label">销量</span>
              <span class="value">{{ product.salesVolume + (product.virtualSales || 0) }} 件</span>
            </div>

            <!-- SKU选择 -->
            <div class="sku-section" v-if="skus.length > 0">
              <div class="label">选择规格</div>
              <div class="sku-list">
                <el-tag 
                  v-for="sku in skus" 
                  :key="sku.id"
                  :type="selectedSku?.id === sku.id ? 'primary' : 'info'"
                  class="sku-tag"
                  @click="selectSku(sku)"
                  style="cursor: pointer; margin-right: 10px; margin-bottom: 10px;"
                >
                  {{ sku.skuName }}
                </el-tag>
              </div>
              <div class="sku-info" v-if="selectedSku">
                <span class="sku-price">¥{{ selectedSku.price }}</span>
                <span class="sku-stock">库存：{{ selectedSku.stock }} 件</span>
              </div>
            </div>

            <div class="quantity-section">
              <span class="label">数量</span>
              <el-input-number v-model="quantity" :min="1" :max="getMaxStock()" />
            </div>

            <div class="action-buttons">
              <el-button type="primary" size="large" @click="addToCart" :disabled="!canAddToCart()">
                加入购物车
              </el-button>
              <el-button size="large" @click="buyNow" :disabled="!canAddToCart()">
                立即购买
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <div class="product-detail-content" v-if="product.detailHtml">
        <h3>商品详情</h3>
        <div v-html="product.detailHtml"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const route = useRoute()
const loading = ref(false)
const product = ref<any>({})
const skus = ref<any[]>([])
const selectedSku = ref<any>(null)
const quantity = ref(1)
const currentImage = ref('')

const imageList = computed(() => {
  const images = []
  if (product.value.mainImage) {
    images.push(product.value.mainImage)
  }
  if (product.value.subImages && typeof product.value.subImages === 'string') {
    const subImages = product.value.subImages.split(',').filter((url: string) => url.trim())
    images.push(...subImages)
  }
  return images
})

const loadProduct = async () => {
  loading.value = true
  try {
    const productId = route.params.id
    const res = await request.get(`/product/${productId}`)
    product.value = res.data
    currentImage.value = res.data.mainImage
    
    // 加载SKU列表
    try {
      const skuRes = await request.get(`/product/${productId}/skus`)
      skus.value = skuRes.data || []
      if (skus.value.length > 0) {
        selectedSku.value = skus.value[0]
      }
    } catch (error) {
      console.error('加载SKU失败', error)
    }
  } catch (error) {
    console.error('加载商品详情失败', error)
    ElMessage.error('加载商品详情失败')
  } finally {
    loading.value = false
  }
}

const selectSku = (sku: any) => {
  selectedSku.value = sku
  if (sku.skuImage) {
    currentImage.value = sku.skuImage
  }
}

const getMaxStock = () => {
  if (skus.value.length > 0 && selectedSku.value) {
    return selectedSku.value.stock
  }
  return product.value.stock || 999
}

const canAddToCart = () => {
  if (skus.value.length > 0) {
    return selectedSku.value && selectedSku.value.stock > 0
  }
  return product.value.stock > 0
}

const addToCart = () => {
  if (!canAddToCart()) {
    ElMessage.warning('商品库存不足')
    return
  }
  ElMessage.success('已加入购物车')
}

const buyNow = () => {
  if (!canAddToCart()) {
    ElMessage.warning('商品库存不足')
    return
  }
  ElMessage.success('立即购买功能开发中')
}

onMounted(() => {
  loadProduct()
})
</script>

<style scoped>
.product-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.image-gallery {
  position: sticky;
  top: 20px;
}

.main-image {
  width: 100%;
  height: 450px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.thumbnail-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.thumbnail:hover {
  border-color: #409eff;
}

.thumbnail.active {
  border-color: #409eff;
}

.product-info {
  padding: 0 20px;
}

.product-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
  line-height: 1.4;
}

.product-subtitle {
  color: #909399;
  font-size: 14px;
  margin-bottom: 20px;
}

.price-section {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 15px;
}

.sale-price {
  color: #f56c6c;
  font-size: 32px;
  font-weight: bold;
}

.original-price {
  color: #909399;
  font-size: 18px;
  text-decoration: line-through;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.label {
  color: #909399;
  width: 100px;
  font-size: 14px;
}

.value {
  color: #606266;
  font-size: 14px;
}

.sku-section {
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.sku-section .label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: #303133;
}

.sku-list {
  margin-bottom: 10px;
}

.sku-info {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.sku-price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

.sku-stock {
  color: #606266;
  font-size: 14px;
}

.quantity-section {
  display: flex;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.action-buttons {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}

.action-buttons .el-button {
  flex: 1;
  height: 50px;
  font-size: 16px;
}

.product-detail-content {
  margin-top: 30px;
  padding: 20px;
}

.product-detail-content h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
}
</style>
