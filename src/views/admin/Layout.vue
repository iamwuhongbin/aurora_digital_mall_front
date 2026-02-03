<template>
  <el-container class="admin-layout">
    <el-aside width="200px" class="sidebar">
      <div class="logo">管理后台</div>
      <el-menu :default-active="activeMenu" router>
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/admin/merchants">
          <el-icon><Shop /></el-icon>
          <span>商家管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/products">
          <el-icon><Goods /></el-icon>
          <span>商品审核</span>
        </el-menu-item>
        <el-menu-item index="/admin/product-management">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/banners">
          <el-icon><Picture /></el-icon>
          <span>轮播图管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/customers">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/merchant-chat">
          <el-icon><ChatDotRound /></el-icon>
          <span>联系商家</span>
        </el-menu-item>
        <el-menu-item index="/admin/profile">
          <el-icon><UserFilled /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <span>极光数码商城 - 管理后台</span>
          <el-dropdown>
            <span class="user-info">
              <el-avatar v-if="adminInfo.avatar" :size="32" :src="adminInfo.avatar" />
              <el-avatar v-else :size="32" :icon="UserFilled" />
              <span style="margin-left: 8px">{{ adminInfo.realName || '管理员' }}</span>
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
        <router-view v-slot="{ Component, route }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Shop, Goods, User, UserFilled, Picture, ChatDotRound } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const adminInfo = ref<any>({})
const activeMenu = computed(() => route.path)

onMounted(async () => {
  // 先尝试从 adminInfo 加载
  let info = localStorage.getItem('adminInfo')
  if (info) {
    adminInfo.value = JSON.parse(info)
  } else {
    // 如果没有 adminInfo，尝试从 userInfo 加载
    info = localStorage.getItem('userInfo')
    if (info) {
      adminInfo.value = JSON.parse(info)
    }
  }
  
  // 如果有 token，尝试从服务器获取最新信息
  const token = localStorage.getItem('token')
  if (token && !adminInfo.value.avatar) {
    try {
      const axios = (await import('axios')).default
      const response = await axios.get('http://localhost:8080/api/admin/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.data.code === 200) {
        adminInfo.value = response.data.data
        localStorage.setItem('adminInfo', JSON.stringify(response.data.data))
      }
    } catch (error) {
      console.error('加载管理员信息失败', error)
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
.admin-layout {
  min-height: 100vh;
}

.sidebar {
  background: #001529;
  color: #fff;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  background: #002140;
}

.el-menu {
  border: none;
  background: #001529;
}

:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.65);
}

:deep(.el-menu-item:hover),
:deep(.el-menu-item.is-active) {
  background: #000c17 !important;
  color: #1890ff !important;
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

/* 页面切换过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
