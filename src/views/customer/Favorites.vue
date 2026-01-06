<template>
  <div class="favorites">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <h2>我的收藏</h2>
      </template>
    </el-page-header>

    <el-card v-loading="loading" style="margin-top: 20px;">
      <el-empty v-if="favoriteList.length === 0" description="暂无收藏商品">
        <el-button type="primary" @click="$router.push('/customer/products')">去逛逛</el-button>
      </el-empty>

      <div v-else>
        <div class="product-grid">
          <el-card 
            v-for="item in favoriteList" 
            :key="item.id" 
            class="product-card"
            shadow="hover"
          >
            <div class="product-image" @click="goToProduct(item.id)">
              <el-image :src="item.mainImage" fit="cover" />
            </div>
            <div class="product-info">
              <div class="product-name" @click="goToProduct(item.id)">{{ item.productName }}</div>
              <div class="product-sku" v-if="item.skuName">
                <el-tag size="small" type="info">{{ item.skuName }}</el-tag>
              </div>
              <div class="product-price">
                <span class="sale-price">¥{{ item.salePrice }}</span>
                <span class="original-price" v-if="item.originalPrice > item.salePrice">
                  ¥{{ item.originalPrice }}
                </span>
              </div>
              <div class="product-sales">销量：{{ item.salesVolume }} 件</div>
              <div class="product-actions">
                <el-button type="primary" size="small" @click="addToCart(item)">
                  加入购物车
                </el-button>
                <el-button type="danger" size="small" plain @click="removeFavorite(item.id)">
                  取消收藏
                </el-button>
              </div>
            </div>
          </el-card>
        </div>

        <el-pagination
          v-if="pagination.total > 0"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadFavorites"
          @size-change="loadFavorites"
          style="margin-top: 20px; justify-content: center;"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const favoriteList = ref<any[]>([])
const pagination = ref({
  page: 1,
  size: 12,
  total: 0
})

const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await request.get('/product/favorite/list', {
      params: {
        page: pagination.value.page,
        size: pagination.value.size
      }
    })
    favoriteList.value = res.data.list || []
    pagination.value.total = res.data.total || 0
  } catch (error) {
    console.error('加载收藏列表失败', error)
    ElMessage.error('加载收藏列表失败')
  } finally {
    loading.value = false
  }
}

const goToProduct = (productId: number) => {
  router.push(`/customer/product/${productId}`)
}

const addToCart = async (item: any) => {
  try {
    await request.post('/cart/add', {
      productId: item.id,
      skuId: item.skuId || null,
      quantity: 1
    })
    ElMessage.success('已加入购物车')
  } catch (error: any) {
    console.error('加入购物车失败', error)
    ElMessage.error(error.message || '加入购物车失败')
  }
}

const removeFavorite = async (productId: number) => {
  try {
    await ElMessageBox.confirm('确定要取消收藏吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/product/favorite/${productId}`)
    ElMessage.success('已取消收藏')
    loadFavorites()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消收藏失败', error)
      ElMessage.error('取消收藏失败')
    }
  }
}

onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.favorites {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.favorites h2 {
  margin: 0;
  font-size: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  width: 100%;
  height: 250px;
  cursor: pointer;
  overflow: hidden;
  border-radius: 4px;
  margin-bottom: 12px;
}

.product-image :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.product-info {
  padding: 0 4px;
}

.product-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: pointer;
  min-height: 40px;
}

.product-name:hover {
  color: #409eff;
}

.product-sku {
  margin-bottom: 8px;
}

.product-price {
  margin-bottom: 8px;
}

.sale-price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
  margin-right: 8px;
}

.original-price {
  color: #909399;
  font-size: 14px;
  text-decoration: line-through;
}

.product-sales {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.product-actions {
  display: flex;
  gap: 8px;
}

.product-actions .el-button {
  flex: 1;
}
</style>
