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
            
            <!-- 商品评分 -->
            <div class="product-rating-section" v-if="product.averageRating && product.ratingCount > 0">
              <el-rate 
                :model-value="product.averageRating" 
                disabled 
                show-score
                :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                text-color="#ff9900"
              />
              <span class="rating-count">{{ product.ratingCount }} 条评价</span>
            </div>
            
            <!-- 商家信息 -->
            <div class="merchant-info" v-if="product.shopName">
              <el-icon class="shop-icon"><Shop /></el-icon>
              <span class="shop-name">{{ product.shopName }}</span>
              <el-tag size="small" type="success" style="margin-left: 10px;">官方认证</el-tag>
            </div>
            
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
              <el-button 
                size="large" 
                :icon="isFavorite ? 'StarFilled' : 'Star'" 
                @click="toggleFavorite"
                :loading="favoriteLoading"
              >
                {{ isFavorite ? '已收藏' : '收藏' }}
              </el-button>
              <el-button 
                size="large" 
                type="success"
                @click="contactMerchant"
              >
                <el-icon><ChatDotRound /></el-icon>
                联系客服
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <!-- 商品详情和评价标签页 -->
      <el-tabs v-model="activeTab">
        <el-tab-pane label="商品详情" name="detail">
          <div class="product-detail-content" v-if="product.detailHtml">
            <div v-html="product.detailHtml"></div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="商品评价" name="reviews">
          <div class="reviews-section">
            <!-- 评价统计 -->
            <div class="review-stats" v-if="product.ratingCount > 0">
              <div class="rating-summary-detail">
                <div class="rating-score-large">
                  <div class="score-number">{{ product.averageRating }}</div>
                  <el-rate :model-value="product.averageRating" disabled :colors="['#99A9BF', '#F7BA2A', '#FF9900']" />
                  <div class="rating-count-text">{{ product.ratingCount }} 条评价</div>
                </div>
                
                <div class="rating-distribution" v-if="product.ratingDistribution">
                  <div v-for="star in 5" :key="star" class="rating-bar">
                    <span class="star-label">{{ 6 - star }}星</span>
                    <el-progress 
                      :percentage="getRatingPercent(6 - star)" 
                      :color="'#FF9900'"
                      :show-text="false"
                    />
                    <span class="star-count">{{ getRatingCount(6 - star) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 评分筛选 -->
            <div class="review-filter">
              <el-radio-group v-model="filterRating" @change="loadReviews">
                <el-radio-button :label="0">全部({{ reviewStats.total }})</el-radio-button>
                <el-radio-button :label="5">好评({{ reviewStats.rating5 }})</el-radio-button>
                <el-radio-button :label="3">中评({{ reviewStats.rating3 }})</el-radio-button>
                <el-radio-button :label="1">差评({{ reviewStats.rating1 }})</el-radio-button>
              </el-radio-group>
            </div>
            
            <!-- 评价列表 -->
            <div v-loading="reviewLoading" class="review-list">
              <div v-if="reviews.length === 0" class="empty-reviews">
                <el-empty description="暂无评价" />
              </div>
              
              <div v-for="review in reviews" :key="review.id" class="review-card">
                <div class="review-header">
                  <el-avatar :src="review.customerAvatar" :size="40">
                    {{ review.customerNickname?.charAt(0) }}
                  </el-avatar>
                  <div class="review-user">
                    <div class="user-name">{{ review.customerNickname }}</div>
                    <el-rate :model-value="review.rating" disabled />
                  </div>
                  <div class="review-time">{{ formatTime(review.createdAt) }}</div>
                </div>
                
                <div class="review-content">{{ review.content }}</div>
                
                <div v-if="review.images" class="review-images">
                  <el-image 
                    v-for="(img, index) in review.images.split(',')" 
                    :key="index"
                    :src="img"
                    :preview-src-list="review.images.split(',')"
                    fit="cover"
                    class="review-image"
                  />
                </div>
                
                <div v-if="review.replyContent" class="merchant-reply">
                  <div class="reply-label">商家回复：</div>
                  <div class="reply-content">{{ review.replyContent }}</div>
                  <div class="reply-time">{{ formatTime(review.replyTime) }}</div>
                </div>
              </div>
              
              <!-- 分页 -->
              <el-pagination
                v-if="reviewTotal > 0"
                v-model:current-page="reviewPage"
                :page-size="reviewSize"
                :total="reviewTotal"
                layout="prev, pager, next"
                @current-change="loadReviews"
                style="margin-top: 20px; justify-content: center"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Shop, ChatDotRound } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const product = ref<any>({})
const skus = ref<any[]>([])
const selectedSku = ref<any>(null)
const quantity = ref(1)
const currentImage = ref('')
const isFavorite = ref(false)
const favoriteLoading = ref(false)

// 评价相关
const activeTab = ref('detail')
const reviews = ref<any[]>([])
const reviewLoading = ref(false)
const reviewPage = ref(1)
const reviewSize = ref(10)
const reviewTotal = ref(0)
const filterRating = ref(0)
const reviewStats = ref({
  total: 0,
  avgRating: 0,
  rating5: 0,
  rating3: 0,
  rating1: 0
})

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

const addToCart = async () => {
  if (!canAddToCart()) {
    ElMessage.warning('商品库存不足')
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }
    
    await request.post('/cart/add', {
      productId: product.value.id,
      skuId: selectedSku.value?.id || null,
      quantity: quantity.value
    })
    
    ElMessage.success('已加入购物车')
  } catch (error: any) {
    console.error('加入购物车失败', error)
    ElMessage.error(error.message || '加入购物车失败')
  }
}

const buyNow = async () => {
  if (!canAddToCart()) {
    ElMessage.warning('商品库存不足')
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }
    
    // 构造商品信息，直接跳转到确认订单页面
    const buyNowItem = {
      productId: product.value.id,
      productName: product.value.productName,
      productImage: selectedSku.value?.skuImage || product.value.mainImage,
      skuId: selectedSku.value?.id || null,
      skuName: selectedSku.value?.skuName || null,
      price: selectedSku.value?.price || product.value.salePrice,
      quantity: quantity.value,
      stock: selectedSku.value?.stock || product.value.stock
    }
    
    // 将商品信息存储到 sessionStorage，供确认订单页面使用
    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem))
    
    // 直接跳转到确认订单页面
    router.push('/customer/checkout?type=buyNow')
  } catch (error: any) {
    console.error('操作失败', error)
    ElMessage.error(error.message || '操作失败')
  }
}

// 检查是否已收藏
const checkFavorite = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    isFavorite.value = false
    return
  }
  
  try {
    // 通过获取收藏列表来检查（简化实现）
    // 实际项目中可以添加专门的检查接口
    const res = await request.get('/product/favorite/list', {
      params: { page: 1, size: 100 }
    })
    const favoriteIds = res.data.list.map((item: any) => item.id)
    isFavorite.value = favoriteIds.includes(product.value.id)
  } catch (error) {
    console.error('检查收藏状态失败', error)
  }
}

// 切换收藏状态
const toggleFavorite = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  favoriteLoading.value = true
  try {
    if (isFavorite.value) {
      // 取消收藏
      await request.delete(`/product/favorite/${product.value.id}`)
      ElMessage.success('已取消收藏')
      isFavorite.value = false
    } else {
      // 添加收藏，传递当前选择的SKU
      const skuId = selectedSku.value?.id || null
      await request.post(`/product/favorite/${product.value.id}`, null, {
        params: { skuId }
      })
      ElMessage.success('收藏成功')
      isFavorite.value = true
    }
  } catch (error: any) {
    console.error('收藏操作失败', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    favoriteLoading.value = false
  }
}

// 联系客服
const contactMerchant = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  if (product.value.merchantId) {
    router.push(`/customer/chat/${product.value.merchantId}`)
  } else {
    ElMessage.error('商家信息不存在')
  }
}

// 加载评价列表
const loadReviews = async () => {
  reviewLoading.value = true
  try {
    const productId = route.params.id
    const rating = filterRating.value === 0 ? null : filterRating.value
    const res = await request.get(`/review/product/${productId}`, {
      params: {
        rating,
        page: reviewPage.value,
        size: reviewSize.value
      }
    })
    reviews.value = res.data.list || []
    reviewTotal.value = res.data.total || 0
    
    // 计算评价统计
    calculateReviewStats()
  } catch (error) {
    console.error('加载评价失败', error)
  } finally {
    reviewLoading.value = false
  }
}

// 获取评分百分比
const getRatingPercent = (star: number) => {
  if (!product.value.ratingDistribution) return 0
  const key = `${['one', 'two', 'three', 'four', 'five'][star - 1]}StarPercent`
  return product.value.ratingDistribution[key] || 0
}

// 获取评分数量
const getRatingCount = (star: number) => {
  if (!product.value.ratingDistribution) return 0
  const key = `${['one', 'two', 'three', 'four', 'five'][star - 1]}Star`
  return product.value.ratingDistribution[key] || 0
}

// 计算评价统计
const calculateReviewStats = async () => {
  try {
    const productId = route.params.id
    
    // 获取所有评价统计
    const allRes = await request.get(`/review/product/${productId}`, {
      params: { page: 1, size: 1 }
    })
    reviewStats.value.total = allRes.data.total || 0
    
    // 获取5星评价数量
    const rating5Res = await request.get(`/review/product/${productId}`, {
      params: { rating: 5, page: 1, size: 1 }
    })
    reviewStats.value.rating5 = rating5Res.data.total || 0
    
    // 获取3星评价数量
    const rating3Res = await request.get(`/review/product/${productId}`, {
      params: { rating: 3, page: 1, size: 1 }
    })
    reviewStats.value.rating3 = rating3Res.data.total || 0
    
    // 获取1星评价数量
    const rating1Res = await request.get(`/review/product/${productId}`, {
      params: { rating: 1, page: 1, size: 1 }
    })
    reviewStats.value.rating1 = rating1Res.data.total || 0
    
    // 计算平均评分（简化计算）
    if (reviewStats.value.total > 0) {
      reviewStats.value.avgRating = 4.5 // 简化处理，实际应该从后端获取
    }
  } catch (error) {
    console.error('计算评价统计失败', error)
  }
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  loadProduct()
  checkFavorite()
  loadReviews()
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
  margin-bottom: 15px;
}

.product-rating-section {
  display: flex;
  align-items: center;
  margin: 15px 0;
  padding: 12px 16px;
  background: #fff9e6;
  border-radius: 8px;
  border-left: 3px solid #FF9900;
}

.product-rating-section .rating-count {
  margin-left: 12px;
  color: #666;
  font-size: 14px;
}

.merchant-info {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 3px solid #409eff;
}

.shop-icon {
  font-size: 18px;
  color: #409eff;
  margin-right: 8px;
}

.shop-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
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

/* 评价样式 */
.reviews-section {
  padding: 20px 0;
}

.review-stats {
  background: #f5f7fa;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.rating-summary-detail {
  display: flex;
  gap: 60px;
  align-items: center;
}

.rating-score-large {
  text-align: center;
  min-width: 200px;
}

.score-number {
  font-size: 56px;
  font-weight: bold;
  color: #FF9900;
  line-height: 1;
  margin-bottom: 10px;
}

.rating-count-text {
  color: #909399;
  font-size: 14px;
  margin-top: 10px;
}

.rating-distribution {
  flex: 1;
  max-width: 500px;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.star-label {
  width: 50px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.star-count {
  width: 60px;
  text-align: right;
  font-size: 14px;
  color: #909399;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 20px;
}

.rating-score {
  font-size: 48px;
  font-weight: bold;
  color: #ff6700;
}

.rating-count {
  color: #909399;
  font-size: 14px;
}

.review-filter {
  margin-bottom: 20px;
}

.review-list {
  min-height: 300px;
}

.review-card {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.review-card:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.review-user {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
}

.review-time {
  color: #909399;
  font-size: 12px;
}

.review-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 15px;
}

.review-images {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.review-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  cursor: pointer;
}

.merchant-reply {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
}

.reply-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.reply-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 5px;
}

.reply-time {
  color: #909399;
  font-size: 12px;
}

.empty-reviews {
  padding: 50px 0;
  text-align: center;
}

.product-detail-content h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
}
</style>
