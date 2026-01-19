<template>
  <div class="customer-layout">
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <div class="logo" @click="$router.push('/customer/home')">
            <el-icon :size="24"><ShoppingBag /></el-icon>
            <span>极光数码商城</span>
          </div>
          
          <el-menu mode="horizontal" :default-active="activeMenu" router>
            <el-menu-item index="/customer/home">首页</el-menu-item>
            <el-menu-item index="/customer/products">商品</el-menu-item>
            <el-menu-item index="/customer/cart">
              <el-badge :value="cartCount" :hidden="cartCount === 0">
                购物车
              </el-badge>
            </el-menu-item>
            <el-menu-item index="/customer/favorites">收藏</el-menu-item>
            <el-menu-item index="/customer/orders">订单</el-menu-item>
            <el-menu-item index="/customer/profile">个人中心</el-menu-item>
          </el-menu>
          
          <div class="user-info">
            <el-dropdown>
              <span class="el-dropdown-link">
                <el-avatar v-if="userInfo.avatar" :size="32" :src="userInfo.avatar" />
                <el-avatar v-else :size="32" :icon="UserFilled" />
                <span style="margin-left: 8px">{{ userInfo.nickname || '用户' }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
      
      <el-footer class="footer">
        <p>© 2024 极光数码商城 All Rights Reserved</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingBag, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const cartCount = ref(0)
const userInfo = ref<any>({})

const activeMenu = computed(() => route.path)

onMounted(() => {
  const info = localStorage.getItem('userInfo')
  if (info) {
    userInfo.value = JSON.parse(info)
  }
})

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userType')
  localStorage.removeItem('userInfo')
  ElMessage.success('退出成功')
  router.push('/login')
}
</script>

<style scoped>
.customer-layout {
  min-height: 100vh;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
}

.el-menu {
  flex: 1;
  margin: 0 40px;
  border: none;
}

.user-info {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.main {
  width: 100%;
  padding: 0;
  min-height: calc(100vh - 120px);
}

.footer {
  background: #f5f7fa;
  text-align: center;
  color: #909399;
}
</style>
