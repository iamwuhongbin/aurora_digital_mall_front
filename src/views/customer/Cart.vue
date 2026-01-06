<template>
  <div class="cart">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <h2>购物车</h2>
      </template>
    </el-page-header>

    <el-card v-loading="loading" style="margin-top: 20px;">
      <el-empty v-if="cartItems.length === 0" description="购物车是空的">
        <el-button type="primary" @click="$router.push('/customer/products')">去逛逛</el-button>
      </el-empty>

      <div v-else>
        <el-table ref="tableRef" :data="cartItems" style="width: 100%" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column label="商品" min-width="300">
            <template #default="{ row }">
              <div class="product-info" @click="goToProduct(row.productId)" style="cursor: pointer;">
                <el-image :src="row.productImage" class="product-img" fit="cover" />
                <div class="product-detail">
                  <div class="product-name">{{ row.productName }}</div>
                  <div class="product-sku" v-if="row.skuName">规格：{{ row.skuName }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="180">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.quantity" 
                :min="1" 
                :max="row.stock"
                @change="updateQuantity(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span class="subtotal">¥{{ (row.price * row.quantity).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" link @click="removeItem(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="cart-footer">
          <div class="footer-left">
            <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
            <el-button link type="danger" @click="clearCart">清空购物车</el-button>
          </div>
          <div class="footer-right">
            <div class="total-info">
              <span>已选商品 <span class="count">{{ selectedCount }}</span> 件</span>
              <span class="total">合计: <span class="total-price">¥{{ totalPrice }}</span></span>
            </div>
            <el-button type="primary" size="large" :disabled="selectedCount === 0" @click="checkout">
              结算 ({{ selectedCount }})
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const tableRef = ref()
const loading = ref(false)
const cartItems = ref<any[]>([])
const selectedItems = ref<any[]>([])
const selectAll = ref(false)

// 加载购物车数据
const loadCart = async () => {
  loading.value = true
  try {
    const res = await request.get('/cart/list')
    cartItems.value = res.data || []
  } catch (error) {
    console.error('加载购物车失败', error)
    ElMessage.error('加载购物车失败')
  } finally {
    loading.value = false
  }
}

// 选中商品数量
const selectedCount = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

// 总价
const totalPrice = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
})

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedItems.value = selection
  selectAll.value = selection.length === cartItems.value.length && cartItems.value.length > 0
}

// 全选/取消全选
const handleSelectAll = () => {
  if (!tableRef.value) return
  
  if (selectAll.value) {
    // 全选
    cartItems.value.forEach(row => {
      tableRef.value.toggleRowSelection(row, true)
    })
  } else {
    // 取消全选
    tableRef.value.clearSelection()
  }
}

// 更新数量
const updateQuantity = async (item: any) => {
  try {
    await request.put(`/cart/${item.id}`, {
      quantity: item.quantity
    })
    ElMessage.success('已更新数量')
  } catch (error) {
    console.error('更新数量失败', error)
    ElMessage.error('更新数量失败')
    loadCart() // 重新加载
  }
}

// 删除商品
const removeItem = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/cart/${id}`)
    ElMessage.success('已删除')
    loadCart()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
      ElMessage.error('删除失败')
    }
  }
}

// 清空购物车
const clearCart = async () => {
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete('/cart/clear')
    ElMessage.success('已清空购物车')
    loadCart()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('清空失败', error)
      ElMessage.error('清空失败')
    }
  }
}

// 结算
const checkout = async () => {
  if (selectedCount.value === 0) {
    ElMessage.warning('请选择要结算的商品')
    return
  }
  
  // 更新选中商品的勾选状态
  try {
    for (const item of cartItems.value) {
      const isChecked = selectedItems.value.some(selected => selected.id === item.id)
      await request.put(`/cart/${item.id}`, {
        quantity: item.quantity,
        isChecked: isChecked ? 1 : 0
      })
    }
    router.push('/customer/checkout')
  } catch (error) {
    console.error('更新购物车状态失败', error)
    ElMessage.error('结算失败，请重试')
  }
}

// 跳转到商品详情页
const goToProduct = (productId: number) => {
  router.push(`/customer/product/${productId}`)
}

onMounted(() => {
  loadCart()
})
</script>

<style scoped>
.cart {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.cart h2 {
  margin: 0;
  font-size: 20px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-img {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  flex-shrink: 0;
}

.product-detail {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-sku {
  font-size: 12px;
  color: #909399;
}

.price {
  color: #f56c6c;
  font-size: 16px;
  font-weight: 500;
}

.subtotal {
  color: #f56c6c;
  font-size: 16px;
  font-weight: bold;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.total-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.total-info .count {
  color: #f56c6c;
  font-weight: bold;
}

.total {
  font-size: 16px;
  color: #606266;
}

.total-price {
  color: #f56c6c;
  font-size: 24px;
  font-weight: bold;
  margin-left: 8px;
}
</style>
