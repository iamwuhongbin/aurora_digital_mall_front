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
              :class="{ active: selectedCategoryId === parent.id }"
              @click="selectCategory(parent.id)"
            >
              <el-icon class="category-icon"><Folder /></el-icon>
              <span class="category-name">{{ parent.categoryName }}</span>
              <el-icon v-if="parent.children && parent.children.length > 0" class="arrow-icon">
                <ArrowRight />
              </el-icon>
            </div>
            
            <!-- 子分类 -->
            <div v-if="parent.children && parent.children.length > 0" class="children-list">
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
          </div>
        </div>
      </aside>

      <!-- 右侧商品区域 -->
      <main class="product-main">
        <!-- 搜索栏 -->
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
        </div>

        <!-- 商品列表 -->
        <div class="product-content" v-loading="loading">
          <el-row :gutter="20" v-if="products.length > 0">
            <el-col :span="6" v-for="product in products" :key="product.id">
              <el-card shadow="hover" class="product-card" @click="goToDetail(product.id)">
                <img :src="product.mainImage || '/placeholder.png'" class="product-image" />
                <div class="product-info">
                  <h4 class="product-name">{{ product.productName }}</h4>
                  <p class="price">¥{{ product.salePrice }}</p>
                  <div class="product-meta">
                    <span class="sales">已售 {{ product.salesVolume }}</span>
                  </div>
                </div>
              </el-card>
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
import { Search, Folder, ArrowRight } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const products = ref<any[]>([])
const categories = ref<any[]>([])
const categoryTree = ref<any[]>([])
const searchKeyword = ref('')
const selectedCategoryId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

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

onMounted(async () => {
  await loadCategories()
  await loadProducts()
})
</script>

<style scoped>
.product-list-container {
  min-height: calc(100vh - 120px);
  background: #f5f7fa;
}

.layout-wrapper {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
}

/* 左侧分类导航 */
.category-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 80px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  font-weight: bold;
}

.category-menu {
  padding: 10px 0;
}

.category-section {
  margin-bottom: 5px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.category-item:hover {
  background: #f5f7fa;
}

.category-item.active {
  background: #ecf5ff;
  color: #409eff;
}

.category-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #409eff;
}

.category-item.all-item {
  font-weight: bold;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 5px;
}

.category-item.parent-item {
  font-weight: 600;
  font-size: 14px;
}

.category-item.child-item {
  padding-left: 50px;
  font-size: 13px;
  color: #606266;
}

.category-item.child-item:hover {
  color: #409eff;
}

.category-icon {
  margin-right: 8px;
  font-size: 16px;
}

.category-name {
  flex: 1;
}

.arrow-icon {
  font-size: 14px;
  color: #909399;
}

.children-list {
  background: #fafafa;
}

/* 右侧商品区域 */
.product-main {
  flex: 1;
  min-width: 0;
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
  transition: all 0.3s;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 4px;
}

.product-info {
  padding: 15px 0;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
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
