<template>
  <div class="home">
    <!-- 最新产品发布区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">最新产品发布</h1>
          <p class="hero-subtitle">我们为您提供最新上市的数码产品，确保您第一时间了解市场动态。</p>
          <el-button type="primary" size="large" class="hero-button" @click="goToProducts()">
            查看新品
          </el-button>
        </div>
        <div class="hero-image">
          <el-carousel height="400px" :interval="4000" arrow="never">
            <el-carousel-item v-for="(product, index) in featuredProducts" :key="index">
              <img :src="product.mainImage" class="carousel-image" />
            </el-carousel-item>
          </el-carousel>
        </div>
      </div>
    </section>

    <!-- 热销产品推荐 -->
    <section class="hot-products-section">
      <h2 class="section-title">热销产品推荐</h2>
      <p class="section-subtitle">这些是我们最受顾客喜爱的产品，您绝对不能错过！</p>
      <div class="hot-products-grid">
        <div 
          v-for="product in hotProducts" 
          :key="product.id" 
          class="hot-product-card"
          @click="goToDetail(product.id)"
        >
          <div class="hot-product-image">
            <img :src="product.mainImage" />
            <div class="hot-product-overlay">
              <el-button type="primary" size="large" @click.stop="buyNow(product.id)">
                立即购买
              </el-button>
            </div>
          </div>
          <div class="hot-product-info">
            <h3>{{ product.productName }}</h3>
            <p class="hot-product-price">¥{{ product.salePrice }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 数码电子商城产品展示 -->
    <section class="category-showcase-section">
      <h2 class="section-title">数码电子商城产品展示</h2>
      <p class="section-subtitle">高品质数码产品，满足您的各种需求</p>
      <div class="category-showcase-grid">
        <div 
          v-for="category in showcaseCategories" 
          :key="category.id" 
          class="category-showcase-card"
          @click="goToProducts(category.id)"
        >
          <div class="category-showcase-image">
            <img :src="category.image" />
          </div>
          <div class="category-showcase-info">
            <h3>{{ category.name }}</h3>
            <p class="category-showcase-price">¥{{ category.price }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 数码电子商城新品推荐 -->
    <section class="new-products-section">
      <h2 class="section-title">数码电子商城新品推荐</h2>
      <p class="section-subtitle">最新上架，抢先体验最前沿科技</p>
      <div class="new-products-grid">
        <div 
          v-for="product in newProducts" 
          :key="product.id" 
          class="new-product-card"
          @click="goToDetail(product.id)"
        >
          <div class="new-product-image">
            <img :src="product.mainImage" />
          </div>
          <div class="new-product-info">
            <h3>{{ product.productName }}</h3>
            <p class="new-product-price">¥{{ product.salePrice }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()

const featuredProducts = ref<any[]>([])
const hotProducts = ref<any[]>([])
const showcaseCategories = ref<any[]>([
  { id: 1, name: '无线耳机', price: '799.00', image: 'https://via.placeholder.com/400x400?text=无线耳机' },
  { id: 2, name: '智能手机', price: '2,999.00', image: 'https://via.placeholder.com/400x400?text=智能手机' },
  { id: 3, name: '平板电脑', price: '2,499.00', image: 'https://via.placeholder.com/400x400?text=平板电脑' }
])
const newProducts = ref<any[]>([])

onMounted(async () => {
  await loadProducts()
})

const loadProducts = async () => {
  try {
    // 获取销量最高的商品用于热销推荐
    const hotRes = await request.get('/product/list', {
      params: { page: 1, size: 3, sortBy: 'sales' }
    })
    hotProducts.value = hotRes.data?.list || hotRes.data?.records || []
    
    // 获取最新商品用于轮播图和新品推荐
    const newRes = await request.get('/product/list', {
      params: { page: 1, size: 9, sortBy: 'time' }
    })
    const newProductsList = newRes.data?.list || newRes.data?.records || []
    
    // 轮播图商品（最新的前3个）
    featuredProducts.value = newProductsList.slice(0, 3)
    
    // 新品推荐（最新的第4-6个）
    newProducts.value = newProductsList.slice(3, 6)
    
    // 产品展示（最新的第7-9个）
    if (newProductsList.length >= 9) {
      showcaseCategories.value = [
        { id: newProductsList[6].id, name: newProductsList[6].productName, price: newProductsList[6].salePrice, image: newProductsList[6].mainImage },
        { id: newProductsList[7].id, name: newProductsList[7].productName, price: newProductsList[7].salePrice, image: newProductsList[7].mainImage },
        { id: newProductsList[8].id, name: newProductsList[8].productName, price: newProductsList[8].salePrice, image: newProductsList[8].mainImage }
      ]
    }
  } catch (error) {
    console.error('加载商品失败', error)
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
</script>

<style scoped>
.home {
  background: #fff;
}

/* 最新产品发布区域 */
.hero-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf0 100%);
  padding: 60px 0;
  margin-bottom: 80px;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 60px;
  padding: 0 20px;
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: 42px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 20px;
}

.hero-subtitle {
  font-size: 16px;
  color: #606266;
  line-height: 1.8;
  margin-bottom: 30px;
}

.hero-button {
  padding: 15px 40px;
  font-size: 16px;
  background: #000;
  border-color: #000;
}

.hero-button:hover {
  background: #333;
  border-color: #333;
}

.hero-image {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.carousel-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
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

/* 热销产品推荐 */
.hot-products-section {
  max-width: 1200px;
  margin: 0 auto 80px;
  padding: 0 20px;
}

.hot-products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.hot-product-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.hot-product-card:hover {
  transform: translateY(-10px);
}

.hot-product-image {
  position: relative;
  width: 100%;
  height: 350px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.hot-product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hot-product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.hot-product-card:hover .hot-product-overlay {
  opacity: 1;
}

.hot-product-info {
  text-align: center;
}

.hot-product-info h3 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 10px;
}

.hot-product-price {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

/* 数码电子商城产品展示 */
.category-showcase-section {
  background: #f5f7fa;
  padding: 60px 0 80px;
  margin-bottom: 80px;
}

.category-showcase-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  padding: 0 20px;
}

.category-showcase-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.category-showcase-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.category-showcase-image {
  width: 100%;
  height: 300px;
  overflow: hidden;
}

.category-showcase-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-showcase-info {
  padding: 20px;
  background: #fff;
}

.category-showcase-info h3 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 10px;
}

.category-showcase-price {
  font-size: 22px;
  font-weight: bold;
  color: #f56c6c;
}

/* 数码电子商城新品推荐 */
.new-products-section {
  max-width: 1200px;
  margin: 0 auto 80px;
  padding: 0 20px;
}

.new-products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.new-product-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.new-product-card:hover {
  transform: translateY(-10px);
}

.new-product-image {
  width: 100%;
  height: 350px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.new-product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.new-product-info {
  text-align: center;
}

.new-product-info h3 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 10px;
}

.new-product-price {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
  }
  
  .hot-products-grid,
  .category-showcase-grid,
  .new-products-grid {
    grid-template-columns: 1fr;
  }
  
  .hero-title {
    font-size: 32px;
  }
  
  .section-title {
    font-size: 28px;
  }
}
</style>
