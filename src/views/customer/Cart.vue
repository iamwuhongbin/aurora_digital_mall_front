<template>
  <div class="cart">
    <h2>购物车</h2>
    <el-card>
      <el-table :data="cartItems" style="width: 100%">
        <el-table-column type="selection" width="55" />
        <el-table-column label="商品" width="300">
          <template #default="{ row }">
            <div class="product-info">
              <img :src="row.productImage" class="product-img" />
              <span>{{ row.productName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column label="小计">
          <template #default="{ row }">
            ¥{{ (row.price * row.quantity).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="removeItem(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="cart-footer">
        <div class="total">
          总计: <span class="total-price">¥{{ totalPrice }}</span>
        </div>
        <el-button type="primary" size="large" @click="checkout">结算</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const cartItems = ref<any[]>([])

const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
})

const removeItem = (id: number) => {
  ElMessage.success('已删除')
}

const checkout = () => {
  ElMessage.success('正在跳转到结算页面')
}
</script>

<style scoped>
.cart h2 {
  margin-bottom: 20px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.total {
  font-size: 18px;
}

.total-price {
  color: #f56c6c;
  font-size: 24px;
  font-weight: bold;
  margin-left: 8px;
}
</style>
