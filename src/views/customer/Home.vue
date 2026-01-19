<template>
  <div class="home">
    <!-- 轮播图区域 -->
    <section class="banner-section">
      <div class="banner-container">
        <el-carousel height="450px" :interval="5000" arrow="always" indicator-position="outside">
          <el-carousel-item v-for="banner in banners" :key="banner.id">
            <div class="banner-item" @click="handleBannerClick(banner)">
              <img :src="banner.imageUrl" class="banner-image" />
              <div class="banner-overlay">
                <h2 class="banner-title">{{ banner.title }}</h2>
                <el-button 
                  v-if="banner.productId || banner.linkUrl"
                  type="primary" 
                  size="large" 
                  class="banner-button"
                  @click.stop="handleBannerClick(banner)"
                >
                  立即查看
                </el-button>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </section>

    <!-- 猜你喜欢 -->
    <section class="recommend-products-section">
      <h2 class="section-title">猜你喜欢</h2>
      <p class="section-subtitle">{{ recommendSubtitle }}</p>
      <div class="recommend-products-grid">
        <div 
          v-for="product in recommendProducts" 
          :key="product.id" 
          class="recommend-product-card"
          @click="goToDetail(product.id)"
        >
          <div class="recommend-product-image">
            <img :src="product.mainImage" />
            <div class="recommend-product-overlay">
              <el-button type="primary" size="large" @click.stop="buyNow(product.id)">
                立即购买
              </el-button>
            </div>
          </div>
          <div class="recommend-product-info">
            <h3>{{ product.productName }}</h3>
            <p class="recommend-product-price">¥{{ product.salePrice }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 分类商品展示 -->
    <section 
      v-for="categoryGroup in categoryProducts" 
      :key="categoryGroup.category.id" 
      class="category-products-section"
    >
      <div class="category-header">
        <h2 class="section-title">{{ categoryGroup.category.categoryName }}</h2>
        <el-button text type="primary" @click="goToProducts(categoryGroup.category.id)">
          查看更多 →
        </el-button>
      </div>
      <div class="category-products-grid">
        <div 
          v-for="product in categoryGroup.products" 
          :key="product.id" 
          class="category-product-card"
          @click="goToDetail(product.id)"
        >
          <div class="category-product-image">
            <img :src="product.mainImage" />
            <div class="category-product-overlay">
              <el-button type="primary" size="small" @click.stop="buyNow(product.id)">
                立即购买
              </el-button>
            </div>
          </div>
          <div class="category-product-info">
            <h3>{{ product.productName }}</h3>
            <div class="category-product-meta">
              <span class="category-product-price">¥{{ product.salePrice }}</span>
              <span class="category-product-sales">已售{{ (product.actualSales || 0) + (product.virtualSales || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 浮动客服按钮 -->
    <el-tooltip content="联系客服" placement="left">
      <el-button 
        class="customer-service-btn" 
        type="primary" 
        :icon="ChatDotRound" 
        circle 
        size="large"
        @click="goToCustomerService"
      />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChatDotRound } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()

const banners = ref<any[]>([])
const recommendProducts = ref<any[]>([])
const recommendSubtitle = ref('为您精心挑选的优质商品')
const categoryProducts = ref<any[]>([])

onMounted(async () => {
  await loadBanners()
  await loadRecommendProducts()
  await loadCategoryProducts()
})

const loadBanners = async () => {
  try {
    const res = await request.get('/banner/active')
    banners.value = res.data || []
  } catch (error) {
    console.error('加载轮播图失败', error)
  }
}

const handleBannerClick = (banner: any) => {
  if (banner.linkUrl) {
    window.location.href = banner.linkUrl
  } else if (banner.productId) {
    router.push(`/customer/product/${banner.productId}`)
  }
}

const loadRecommendProducts = async () => {
  try {
    const token = localStorage.getItem('token')
    
    if (token) {
      // 用户已登录，尝试获取用户购买历史推荐
      try {
        const orderRes = await request.get('/order/list', {
          params: { page: 1, size: 5 }
        })
        const orders = orderRes.data?.list || orderRes.data?.records || []
        
        if (orders.length > 0) {
          // 获取最近订单的商品分类
          const categoryIds = new Set()
          for (const order of orders) {
            if (order.items && order.items.length > 0) {
              for (const item of order.items) {
                if (item.categoryId) {
                  categoryIds.add(item.categoryId)
                }
              }
            }
          }
          
          // 如果有购买历史，根据分类推荐商品
          if (categoryIds.size > 0) {
            const categoryId = Array.from(categoryIds)[0] // 取第一个分类
            const res = await request.get('/product/list', {
              params: { 
                categoryId: categoryId,
                page: 1, 
                size: 6, 
                sortBy: 'sales' 
              }
            })
            recommendProducts.value = res.data?.list || res.data?.records || []
            recommendSubtitle.value = '根据您的购买记录为您推荐'
            return
          }
        }
      } catch (error) {
        console.log('获取购买历史失败，使用默认推荐', error)
      }
    }
    
    // 未登录或没有购买历史，推荐热销商品
    const res = await request.get('/product/list', {
      params: { page: 1, size: 6, sortBy: 'sales' }
    })
    recommendProducts.value = res.data?.list || res.data?.records || []
    recommendSubtitle.value = '为您精心挑选的优质商品'
  } catch (error) {
    console.error('加载推荐商品失败', error)
  }
}

const loadCategoryProducts = async () => {
  try {
    // 获取一级分类
    const categoryRes = await request.get('/category/level/1')
    const categories = categoryRes.data || []
    
    // 为每个分类加载销量前6的商品
    const categoryProductsData = []
    for (const category of categories) {
      try {
        const productRes = await request.get('/product/list', {
          params: { 
            categoryId: category.id,
            page: 1, 
            size: 6, 
            sortBy: 'sales'
          }
        })
        const products = productRes.data?.list || productRes.data?.records || []
        if (products.length > 0) {
          categoryProductsData.push({
            category: category,
            products: products
          })
        }
      } catch (error) {
        console.error(`加载分类 ${category.categoryName} 的商品失败`, error)
      }
    }
    categoryProducts.value = categoryProductsData
  } catch (error) {
    console.error('加载分类商品失败', error)
  }
}

const goToProducts = (categoryId?: number) => {
  if (categoryId) {
    router.push({ path: '/customer/products', query: { categoryId } })
  } else {
    router.push('/customer/products')
  }
}

const goToDetail = (id: number) => {
  router.push(`/customer/product/${id}`)
}

const buyNow = (id: number) => {
  router.push(`/customer/product/${id}`)
}

const goToCustomerService = () => {
  // 跳转到客服聊天页面，merchantId可以从商品详情页传入，这里默认为1
  router.push('/customer/chat/1')
}
</script>

<style scoped>
.home {
  background: #fff;
}

/* 最新产品发布区域 */
/* 轮播图区域 */
.banner-section {
  margin-bottom: 60px;
}

.banner-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.banner-item {
  position: relative;
  width: 100%;
  height: 450px;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.banner-item:hover .banner-image {
  transform: scale(1.05);
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  padding: 30px;
}

.banner-title {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.banner-button {
  padding: 10px 24px;
  font-size: 14px;
  background: #409eff;
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.banner-button:hover {
  background: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.6);
}

/* 区域标题样式 */
.section-title {
  text-align: center;
  font-size: 36px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 15px;
}

.section-subtitle {
  text-align: center;
  font-size: 16px;
  color: #909399;
  margin-bottom: 50px;
}

/* 猜你喜欢 */
.recommend-products-section {
  max-width: 1200px;
  margin: 0 auto 80px;
  padding: 0 20px;
}

.recommend-products-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
}

.recommend-product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.recommend-product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.recommend-product-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.recommend-product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.recommend-product-card:hover .recommend-product-image img {
  transform: scale(1.1);
}

.recommend-product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.recommend-product-card:hover .recommend-product-overlay {
  opacity: 1;
}

.recommend-product-info {
  padding: 12px;
  text-align: center;
}

.recommend-product-info h3 {
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-product-price {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

/* 分类商品展示 */
.category-products-section {
  max-width: 1200px;
  margin: 0 auto 80px;
  padding: 0 20px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.category-header .section-title {
  margin-bottom: 0;
  text-align: left;
}

.category-products-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
}

.category-product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.category-product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.category-product-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.category-product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.category-product-card:hover .category-product-image img {
  transform: scale(1.1);
}

.category-product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.category-product-card:hover .category-product-overlay {
  opacity: 1;
}

.category-product-info {
  padding: 12px;
}

.category-product-info h3 {
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-product-price {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.category-product-sales {
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .recommend-products-grid,
  .category-products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .hero-title {
    font-size: 32px;
  }
  
  .section-title {
    font-size: 28px;
  }
}

/* 浮动客服按钮 */
.customer-service-btn {
  position: fixed;
  right: 30px;
  bottom: 80px;
  width: 60px;
  height: 60px;
  font-size: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  z-index: 1000;
  transition: all 0.3s;
}

.customer-service-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.customer-service-btn:active {
  transform: scale(0.95);
}
</style>
