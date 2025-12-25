<template>
  <div style="padding: 40px; max-width: 800px; margin: 0 auto;">
    <h1>API连接测试</h1>
    
    <el-card style="margin-bottom: 20px;">
      <h3>测试1: 直接测试后端（绕过代理）</h3>
      <el-button @click="testBackendDirect" type="primary">测试后端直连</el-button>
      <div v-if="result1" style="margin-top: 10px;">
        <el-tag :type="result1.success ? 'success' : 'danger'">
          {{ result1.success ? '成功' : '失败' }}
        </el-tag>
        <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 4px;">{{ result1.message }}</pre>
      </div>
    </el-card>

    <el-card style="margin-bottom: 20px;">
      <h3>测试2: 通过Vite代理测试</h3>
      <el-button @click="testViteProxy" type="primary">测试Vite代理</el-button>
      <div v-if="result2" style="margin-top: 10px;">
        <el-tag :type="result2.success ? 'success' : 'danger'">
          {{ result2.success ? '成功' : '失败' }}
        </el-tag>
        <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 4px;">{{ result2.message }}</pre>
      </div>
    </el-card>

    <el-card style="margin-bottom: 20px;">
      <h3>测试3: 使用request工具测试</h3>
      <el-button @click="testRequestUtil" type="primary">测试request工具</el-button>
      <div v-if="result3" style="margin-top: 10px;">
        <el-tag :type="result3.success ? 'success' : 'danger'">
          {{ result3.success ? '成功' : '失败' }}
        </el-tag>
        <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 4px;">{{ result3.message }}</pre>
      </div>
    </el-card>

    <el-card>
      <h3>测试4: 登录API测试</h3>
      <el-form :model="form" style="max-width: 400px;">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button @click="testLogin" type="primary">测试登录</el-button>
        </el-form-item>
      </el-form>
      <div v-if="result4" style="margin-top: 10px;">
        <el-tag :type="result4.success ? 'success' : 'danger'">
          {{ result4.success ? '成功' : '失败' }}
        </el-tag>
        <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 4px;">{{ result4.message }}</pre>
      </div>
    </el-card>

    <el-alert 
      style="margin-top: 20px;"
      title="提示" 
      type="info"
      :closable="false"
    >
      <p>1. 确保后端服务运行在 http://localhost:8080</p>
      <p>2. 确保前端服务运行在 http://localhost:3000</p>
      <p>3. 打开浏览器控制台（F12）查看Network标签</p>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import request from '@/utils/request'

const result1 = ref<any>(null)
const result2 = ref<any>(null)
const result3 = ref<any>(null)
const result4 = ref<any>(null)

const form = ref({
  username: 'admin',
  password: 'admin123'
})

// 测试1: 直接访问后端
const testBackendDirect = async () => {
  console.log('=== 测试1: 直接访问后端 ===')
  result1.value = null
  try {
    const response = await axios.get('http://localhost:8080/api/product/categories')
    console.log('后端直连成功:', response.data)
    result1.value = {
      success: true,
      message: JSON.stringify(response.data, null, 2)
    }
  } catch (error: any) {
    console.error('后端直连失败:', error)
    result1.value = {
      success: false,
      message: `错误: ${error.message}\n${error.response ? JSON.stringify(error.response.data, null, 2) : '无响应数据'}`
    }
  }
}

// 测试2: 通过Vite代理
const testViteProxy = async () => {
  console.log('=== 测试2: 通过Vite代理 ===')
  result2.value = null
  try {
    const response = await axios.get('/api/product/categories')
    console.log('Vite代理成功:', response.data)
    result2.value = {
      success: true,
      message: JSON.stringify(response.data, null, 2)
    }
  } catch (error: any) {
    console.error('Vite代理失败:', error)
    result2.value = {
      success: false,
      message: `错误: ${error.message}\n${error.response ? JSON.stringify(error.response.data, null, 2) : '无响应数据'}`
    }
  }
}

// 测试3: 使用request工具
const testRequestUtil = async () => {
  console.log('=== 测试3: 使用request工具 ===')
  result3.value = null
  try {
    const response = await request.get('/product/categories')
    console.log('request工具成功:', response)
    result3.value = {
      success: true,
      message: JSON.stringify(response, null, 2)
    }
  } catch (error: any) {
    console.error('request工具失败:', error)
    result3.value = {
      success: false,
      message: `错误: ${error.message}`
    }
  }
}

// 测试4: 登录API
const testLogin = async () => {
  console.log('=== 测试4: 登录API ===')
  console.log('登录数据:', form.value)
  result4.value = null
  try {
    const response = await request.post('/auth/admin/login', form.value)
    console.log('登录成功:', response)
    result4.value = {
      success: true,
      message: JSON.stringify(response, null, 2)
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    result4.value = {
      success: false,
      message: `错误: ${error.message}`
    }
  }
}
</script>
