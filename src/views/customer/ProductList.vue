<template>
  <div class="product-list-container">
    <div class="layout-wrapper">
      <!-- 左侧分类导航 -->
      <aside class="category-sidebar">
        <div class="sidebar-header">
          <h3>商品分类</h3>
        </div>
        
        <div class="category-menu">
          <!-- 全部商品 -->
          <div 
            class="category-item all-item"
            :class="{ active: selectedCategoryId === null }"
            @click="selectCategory(null)"
          >
            <span class="category-name">全部商品</span>
          </div>
          
          <!-- 分类树 -->
          <div v-for="parent in categoryTree" :key="parent.id" class="category-section">
            <div 
              class="category-item parent-item"
              :class="{ active: selectedCategoryId === parent.id, expanded: expandedCategories.includes(parent.id) }"
            >
              <el-icon class="category-icon"><Folder /></el-icon>
              <span class="category-name" @click="selectCategory(parent.id)">{{ parent.categoryName }}</span>
              <el-icon 
                v-if="parent.children && parent.children.length > 0" 
                class="arrow-icon"
                @click.stop="toggleCategory(parent.id)"
              >
                <ArrowRight />
              </el-icon>
            </div>
            
            <!-- 子分类 -->
            <transition name="slide-fade">
              <div v-if="parent.children && parent.children.length > 0 && expandedCategories.includes(parent.id)" class="children-list">
                <div 
                  v-for="child in parent.children" 
                  :key="child.id"
                  class="category-item child-item"
                  :class="{ active: selectedCategoryId === child.id }"
                  @click="selectCategory(child.id)"
                >
                  <span class="category-name">{{ child.categoryName }}</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </aside>

      <!-- 右侧商品区域 -->
      <main class="product-main">
        <!-- 店铺信息横幅 -->
        <div v-if="merchantInfo" class="merchant-banner">
          <div class="merchant-banner-content">
            <el-icon class="shop-icon"><Shop /></el-icon>
            <div class="merchant-details">
              <h2 class="merchant-name">{{ merchantInfo.shopName }}</h2>
              <p class="merchant-desc">欢迎光临本店，精选优质商品</p>
            </div>
          </div>
          <el-button type="primary" @click="clearMerchantFilter">
            查看全部商品
          </el-button>
        </div>

        <!-- 搜索栏和排序 -->
        <div class="search-bar">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索商品" 
            style="width: 300px; margin-right: 10px;"
            @keyup.enter="loadProducts"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="loadProducts">搜索</el-button>
          
          <div style="flex: 1"></div>
          
          <el-select 
            v-model="sortBy" 
            placeholder="排序方式" 
            style="width: 180px;"
            @change="loadProducts"
          >
            <el-option label="默认排序" value="" />
            <el-option label="价格从低到高" value="price_asc" />
            <el-option label="价格从高到低" value="price_desc" />
            <el-option label="销量从低到高" value="sales_asc" />
            <el-option label="销量从高到低" value="sales_desc" />
            <el-option label="评分从低到高" value="rating_asc" />
            <el-option label="评分从高到低" value="rating_desc" />
          </el-select>
        </div>

        <!-- 商品列表 -->
        <div class="product-content" v-loading="loading">
          <el-row :gutter="20" v-if="products.length > 0">
            <el-col :span="6" v-for="product in products" :key="product.id">
              <div class="product-card" @click="goToDetail(product.id)">
                <div class="product-image-wrapper">
                  <img :src="product.mainImage || '/placeholder.png'" class="product-image" />
                  
                  <!-- 折扣标签 -->
                  <div v-if="product.originalPrice && product.originalPrice > product.salePrice" class="discount-badge">
                    {{ Math.round((1 - product.salePrice / product.originalPrice) * 100) }}% OFF
                  </div>
                  
                  <!-- 热销标签 -->
                  <div v-if="product.salesVolume > 100" class="hot-badge">
                    <el-icon><TrendCharts /></el-icon>
                    热销
                  </div>
                  
                  <!-- 库存不足提示 -->
                  <div v-if="product.stock && product.stock < 10 && product.stock > 0" class="stock-badge">
                    仅剩{{ product.stock }}件
                  </div>
                  
                  <!-- 悬浮操作按钮 -->
                  <div class="hover-actions">
                    <el-button circle size="small" @click.stop="addToCart(product)">
                      <el-icon><ShoppingCart /></el-icon>
                    </el-button>
                    <el-button circle size="small" @click.stop="toggleFavorite(product)">
                      <el-icon><Star /></el-icon>
                    </el-button>
                  </div>
                </div>
                
                <div class="product-info">
                  <h4 class="product-name" :title="product.productName">{{ product.productName }}</h4>
                  
                  <div class="product-rating" v-if="product.averageRating && product.ratingCount > 0">
                    <el-rate 
                      :model-value="product.averageRating" 
                      disabled 
                      size="small"
                      :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                    />
                    <span class="rating-count">({{ product.ratingCount }})</span>
                  </div>
                  
                  <div class="price-section">
                    <div class="price-main">
                      <span class="price-symbol">¥</span>
                      <span class="sale-price">{{ product.salePrice }}</span>
                    </div>
                    <span class="original-price" v-if="product.originalPrice && product.originalPrice > product.salePrice">
                      ¥{{ product.originalPrice }}
                    </span>
                  </div>
                  
                  <div class="product-footer">
                    <div class="product-meta">
                      <el-icon class="meta-icon"><Goods /></el-icon>
                      <span class="sales">{{ product.salesVolume || 0 }}人付款</span>
                    </div>
                    <el-tag v-if="product.stock && product.stock > 0" size="small" type="success">
                      有货 {{ product.stock }}件
                    </el-tag>
                    <el-tag v-else size="small" type="info">缺货</el-tag>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>

          <el-empty v-else description="暂无商品" />

          <el-pagination
            v-if="total > 0"
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[12, 24, 48]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadProducts"
            @current-change="loadProducts"
            class="pagination"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Folder, ArrowRight, Shop, ShoppingCart, Star, TrendCharts, Goods } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const products = ref<any[]>([])
const categories = ref<any[]>([])
const categoryTree = ref<any[]>([])
const searchKeyword = ref('')
const selectedCategoryId = ref<number | null>(null)
const sortBy = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const expandedCategories = ref<number[]>([])
const merchantInfo = ref<any>(null)

// 展平分类树为一维数组
const flattenCategories = (tree: any[]): any[] => {
  const result: any[] = []
  
  const flatten = (nodes: any[]) => {
    nodes.forEach(node => {
      result.push(node)
      if (node.children && node.children.length > 0) {
        flatten(node.children)
      }
    })
  }
  
  flatten(tree)
  return result
}

// 获取分类及其所有子分类的ID列表（从树形结构中查找）
const getCategoryIds = (categoryId: number): number[] => {
  const ids: number[] = [categoryId]
  
  // 从展平的分类列表中查找该分类
  const category = categories.value.find(cat => cat.id === categoryId)
  
  if (category && category.children && category.children.length > 0) {
    // 递归获取所有子分类的ID
    category.children.forEach((child: any) => {
      ids.push(...getCategoryIds(child.id))
    })
  }
  
  return ids
}

const loadCategories = async () => {
  try {
    const res = await request.get('/product/category')
    console.log('分类数据响应:', res.data)
    // 后端已经返回树形结构，直接使用
    categoryTree.value = res.data || []
    // 同时展平所有分类用于查询子分类
    categories.value = flattenCategories(categoryTree.value)
    console.log('分类树:', categoryTree.value)
    console.log('展平后的分类:', categories.value)
  } catch (error) {
    console.error('加载分类失败', error)
  }
}

const toggleCategory = (categoryId: number) => {
  const index = expandedCategories.value.indexOf(categoryId)
  if (index > -1) {
    expandedCategories.value.splice(index, 1)
  } else {
    expandedCategories.value.push(categoryId)
  }
}

const selectCategory = (categoryId: number | null) => {
  selectedCategoryId.value = categoryId
  currentPage.value = 1
  loadProducts()
}

const loadProducts = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    if (selectedCategoryId.value) {
      params.categoryId = selectedCategoryId.value
    } else if (route.query.categoryId) {
      params.categoryId = route.query.categoryId
      selectedCategoryId.value = Number(route.query.categoryId)
    }
    
    // 支持按商家ID筛选
    if (route.query.merchantId) {
      params.merchantId = route.query.merchantId
    }
    
    if (sortBy.value) {
      params.sortBy = sortBy.value
    }

    const res = await request.get('/product/list', { params })
    products.value = res.data?.list || res.data?.records || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('加载商品列表失败', error)
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

const goToDetail = (id: number) => {
  router.push(`/customer/product/${id}`)
}

// 添加到购物车
const addToCart = async (product: any) => {
  try {
    await request.post('/cart/add', {
      productId: product.id,
      quantity: 1
    })
    ElMessage.success('已添加到购物车')
  } catch (error: any) {
    ElMessage.error(error.message || '添加失败')
  }
}

// 收藏/取消收藏
const toggleFavorite = async (product: any) => {
  try {
    await request.post('/favorite/toggle', {
      productId: product.id
    })
    ElMessage.success('操作成功')
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 加载商家信息
const loadMerchantInfo = async (merchantId: number) => {
  try {
    const res = await request.get(`/merchant/${merchantId}`)
    merchantInfo.value = res.data
  } catch (error) {
    console.error('加载商家信息失败', error)
  }
}

// 清除商家筛选
const clearMerchantFilter = () => {
  merchantInfo.value = null
  router.push('/customer/products')
}

onMounted(async () => {
  await loadCategories()
  await loadProducts()
  
  // 如果URL中有商家ID，加载商家信息
  if (route.query.merchantId) {
    await loadMerchantInfo(Number(route.query.merchantId))
  }
  
  // 如果URL中有分类ID，自动展开对应的父分类
  if (route.query.categoryId) {
    const categoryId = Number(route.query.categoryId)
    const category = categories.value.find(cat => cat.id === categoryId)
    if (category && category.parentId) {
      expandedCategories.value.push(category.parentId)
    }
  }
})
</script>

<style scoped>
.product-list-container {
  min-height: calc(100vh - 120px);
  background: #f5f7fa;
}

.layout-wrapper {
  display: flex;
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  gap: 24px;
  justify-content: center;
}

/* 左侧分类导航 */
.category-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: fit-content;
  position: sticky;
  top: 80px;
  border: 1px solid #f0f0f0;
}

.sidebar-header {
  padding: 16px 18px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px 12px 0 0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: white;
  font-weight: bold;
  text-align: center;
  letter-spacing: 1px;
}

.category-menu {
  padding: 8px 0;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.category-menu::-webkit-scrollbar {
  width: 4px;
}

.category-menu::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.category-menu::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.category-section {
  margin-bottom: 5px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  margin: 2px 8px;
  border-radius: 8px;
}

.category-item:hover {
  background: linear-gradient(90deg, #f5f7fa 0%, #ecf5ff 100%);
  transform: translateX(4px);
}

.category-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.category-item.active .category-icon,
.category-item.active .arrow-icon {
  color: white;
}

.category-item.all-item {
  font-weight: bold;
  margin: 2px 8px 8px 8px;
  border-bottom: 2px solid #f0f0f0;
  border-radius: 8px 8px 0 0;
  padding-bottom: 12px;
}

.category-item.parent-item {
  font-weight: 600;
  font-size: 13px;
}

.category-item.child-item {
  padding-left: 36px;
  font-size: 12px;
  color: #606266;
  margin: 2px 8px;
}

.category-item.child-item:hover {
  color: #667eea;
  background: linear-gradient(90deg, #f5f7fa 0%, #ecf5ff 100%);
}

.category-item.child-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  font-weight: 500;
}

.category-icon {
  margin-right: 6px;
  font-size: 14px;
  color: #909399;
  transition: color 0.3s;
}

.category-name {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  font-size: 12px;
  color: #c0c4cc;
  transition: all 0.3s;
  cursor: pointer;
}

.arrow-icon:hover {
  color: #667eea;
}

.category-item.expanded .arrow-icon {
  transform: rotate(90deg);
  color: #667eea;
}

.children-list {
  background: transparent;
  overflow: hidden;
  padding: 4px 0;
}

/* 折叠动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
  max-height: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
  max-height: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* 右侧商品区域 */
.product-main {
  flex: 1;
  min-width: 0;
  max-width: 1280px;
}

/* 店铺信息横幅 */
.merchant-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.merchant-banner-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.merchant-banner .shop-icon {
  font-size: 40px;
  color: white;
}

.merchant-details {
  color: white;
}

.merchant-name {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.merchant-desc {
  margin: 5px 0 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.merchant-banner .el-button {
  background: white;
  color: #667eea;
  border: none;
}

.merchant-banner .el-button:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #764ba2;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 500px;
}

.product-card {
  cursor: pointer;
  margin-bottom: 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(103, 194, 58, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 1;
}

.product-card:hover::before {
  opacity: 1;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.product-image-wrapper {
  position: relative;
  overflow: hidden;
  background: #f5f7fa;
}

.product-image {
  width: 100%;
  height: 260px;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-card:hover .product-image {
  transform: scale(1.08);
}

/* 折扣标签 */
.discount-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
  z-index: 2;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 热销标签 */
.hot-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(245, 87, 108, 0.4);
  z-index: 2;
}

/* 库存标签 */
.stock-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(255, 152, 0, 0.95);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  z-index: 2;
}

/* 悬浮操作按钮 */
.hover-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s;
  z-index: 2;
}

.product-card:hover .hover-actions {
  opacity: 1;
  transform: translateY(0);
}

.hover-actions .el-button {
  background: white;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.hover-actions .el-button:hover {
  background: #409eff;
  color: white;
  transform: scale(1.1);
}

.product-info {
  padding: 16px;
  position: relative;
  z-index: 2;
}

.product-name {
  font-size: 15px;
  color: #303133;
  margin: 0 0 12px 0;
  height: 42px;
  line-height: 21px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-weight: 500;
  transition: color 0.3s;
}

.product-card:hover .product-name {
  color: #409eff;
}

.price-section {
  margin: 12px 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.price-main {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  color: #ff4757;
  font-size: 16px;
  font-weight: bold;
  margin-right: 2px;
}

.sale-price {
  color: #ff4757;
  font-size: 26px;
  font-weight: bold;
  font-family: 'Arial', sans-serif;
}

.original-price {
  color: #999;
  font-size: 13px;
  text-decoration: line-through;
  opacity: 0.8;
}

.product-rating {
  display: flex;
  align-items: center;
  margin: 10px 0;
  gap: 6px;
}

.rating-count {
  color: #999;
  font-size: 12px;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
}

.meta-icon {
  font-size: 14px;
  color: #c0c4cc;
}

.sales {
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
