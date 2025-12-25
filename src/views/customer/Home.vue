<template>
  <div class="home">
    <el-carousel height="400px" class="banner">
      <el-carousel-item v-for="item in 3" :key="item">
        <div class="banner-item" :style="{ background: `linear-gradient(135deg, ${colors[item-1]})` }">
          <h2>欢迎来到极光数码商城</h2>
          <p>精选数码产品，品质保证</p>
        </div>
      </el-carousel-item>
    </el-carousel>

    <div class="categories">
      <h3>商品分类</h3>
      <el-row :gutter="20">
        <el-col :span="6" v-for="category in categories" :key="category.id">
          <el-card shadow="hover" class="category-card" @click="goToProducts(category.id)">
            <div class="category-content">
              <el-icon :size="40"><Goods /></el-icon>
              <h4>{{ category.name }}</h4>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="products">
      <h3>热门商品</h3>
      <el-row :gutter="20">
        <el-col :span="6" v-for="product in products" :key="product.id">
          <el-card shadow="hover" class="product-card" @click="goToDetail(product.id)">
            <img :src="product.mainImage || '/placeholder.png'" class="product-image" />
            <div class="product-info">
              <h4 class="product-name">{{ product.productName }}</h4>
              <p class="price">¥{{ product.salePrice }}</p>
              <div class="product-meta">
                <span class="sales">已售 {{ product.salesVolume }}</span>
              </div>
              <el-button type="primary" size="small" style="width: 100%; margin-top: 10px;">查看详情</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Goods } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()

const colors = [
  '#667eea 0%, #764ba2 100%',
  '#f093fb 0%, #f5576c 100%',
  '#4facfe 0%, #00f2fe 100%'
]

const categories = ref<any[]>([])
const products = ref<any[]>([])

onMounted(async () => {
  await loadCategories()
  await loadProducts()
})

const loadCategories = async () => {
  try {
    const res = await request.get('/product/category')
    categories.value = res.data ? res.data.slice(0, 8) : []
  } catch (error) {
    console.error('加载分类失败', error)
  }
}

const loadProducts = async () => {
  try {
    const res = await request.get('/product/list', {
      params: { page: 1, size: 8, sortBy: 'sales' }
    })
    console.log('商品列表响应:', res.data)
    products.value = res.data?.list || res.data?.records || []
    console.log('加载的商品数量:', products.value.length)
  } catch (error) {
    console.error('加载商品失败', error)
  }
}

const goToProducts = (categoryId: number) => {
  router.push({ path: '/customer/products', query: { categoryId } })
}

const goToDetail = (id: number) => {
  router.push(`/customer/product/${id}`)
}
</script>

<style scoped>
.home {
  padding-bottom: 40px;
}

.banner {
  margin-bottom: 40px;
  border-radius: 8px;
  overflow: hidden;
}

.banner-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: white;
}

.banner-item h2 {
  font-size: 36px;
  margin-bottom: 16px;
}

.banner-item p {
  font-size: 18px;
}

.categories, .products {
  margin-bottom: 40px;
}

.categories h3, .products h3 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.category-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.category-card:hover {
  transform: translateY(-5px);
}

.category-content {
  text-align: center;
  padding: 20px;
}

.category-content h4 {
  margin-top: 12px;
  color: #606266;
}

.product-card {
  cursor: pointer;
  transition: transform 0.3s;
  margin-bottom: 20px;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-info {
  padding: 12px 0;
}

.product-name {
  font-size: 14px;
  color: #303133;
  margin: 0 0 10px 0;
  height: 40px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price {
  color: #f56c6c;
  font-size: 22px;
  font-weight: bold;
  margin: 10px 0;
}

.product-meta {
  color: #909399;
  font-size: 12px;
  margin-bottom: 10px;
}

.sales {
  color: #909399;
}
</style>
