<template>
  <el-container class="merchant-layout">
    <el-aside width="200px" class="sidebar">
      <div class="logo">商家管理</div>
      <el-menu :default-active="activeMenu" router>
        <el-menu-item index="/merchant/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/merchant/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/merchant/categories">
          <el-icon><Menu /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/merchant/orders">
          <el-icon><ShoppingCart /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/merchant/reviews">
          <el-icon><ChatDotRound /></el-icon>
          <span>评价管理</span>
        </el-menu-item>
        <el-menu-item index="/merchant/chat">
          <el-icon><ChatLineSquare /></el-icon>
          <span>客服管理</span>
        </el-menu-item>
        <el-menu-item index="/merchant/coupons">
          <el-icon><Ticket /></el-icon>
          <span>优惠券管理</span>
        </el-menu-item>
        <el-menu-item index="/merchant/refunds">
          <el-icon><Wallet /></el-icon>
          <span>退款管理</span>
        </el-menu-item>
        <el-menu-item index="/merchant/profile">
          <el-icon><UserFilled /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <span>极光数码商城 - 商家端</span>
          <el-dropdown>
            <span class="user-info">
              <el-avatar v-if="merchantInfo.avatar" :size="32" :src="merchantInfo.avatar" />
              <el-avatar v-else :size="32" :icon="UserFilled" />
              <span style="margin-left: 8px">{{ merchantInfo.username || '商家' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Goods, ShoppingCart, ChatDotRound, ChatLineSquare, Ticket, UserFilled, Menu, Wallet } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const merchantInfo = ref<any>({})
const activeMenu = computed(() => route.path)

onMounted(async () => {
  // 先尝试从 merchantInfo 加载
  let info = localStorage.getItem('merchantInfo')
  if (info) {
    merchantInfo.value = JSON.parse(info)
  } else {
    // 如果没有 merchantInfo，尝试从 userInfo 加载
    info = localStorage.getItem('userInfo')
    if (info) {
      merchantInfo.value = JSON.parse(info)
    }
  }
  
  // 如果有 token，尝试从服务器获取最新信息
  const token = localStorage.getItem('token')
  if (token && !merchantInfo.value.avatar) {
    try {
      const axios = (await import('axios')).default
      const response = await axios.get('http://localhost:8080/api/merchant/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.data.code === 200) {
        merchantInfo.value = response.data.data
        localStorage.setItem('merchantInfo', JSON.stringify(response.data.data))
      }
    } catch (error) {
      console.error('加载商家信息失败', error)
    }
  }
})

const handleLogout = () => {
  localStorage.clear()
  ElMessage.success('退出成功')
  router.push('/login')
}
</script>

<style scoped>
.merchant-layout {
  min-height: 100vh;
}

.sidebar {
  background: #304156;
  color: #fff;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  background: #1f2d3d;
}

.el-menu {
  border: none;
  background: #304156;
}

:deep(.el-menu-item) {
  color: #bfcbd9;
}

:deep(.el-menu-item:hover),
:deep(.el-menu-item.is-active) {
  background: #263445 !important;
  color: #409eff !important;
}

.header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.main {
  background: #f0f2f5;
  padding: 20px;
}
</style>
