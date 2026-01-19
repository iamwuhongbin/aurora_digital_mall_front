<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>极光数码商城</h2>
          <el-segmented v-model="userType" :options="userTypes" size="large" />
        </div>
      </template>
      
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        
        <el-form-item label="验证码" prop="captchaCode">
          <div style="display: flex; gap: 10px;">
            <el-input v-model="loginForm.captchaCode" placeholder="请输入验证码" style="flex: 1" />
            <img 
              :src="captchaImage" 
              @click="refreshCaptcha" 
              style="height: 40px; cursor: pointer; border: 1px solid #dcdfe6; border-radius: 4px;"
              title="点击刷新验证码"
            />
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
        
        <el-form-item>
          <el-link type="primary" @click="$router.push('/register')">还没有账号？立即注册</el-link>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const userType = ref('customer')
const userTypes = [
  { label: '用户', value: 'customer' },
  { label: '商家', value: 'merchant' },
  { label: '管理员', value: 'admin' }
]

const loginForm = reactive({
  username: '',
  password: '',
  captchaId: '',
  captchaCode: ''
})

const captchaImage = ref('')

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

// 获取验证码
const refreshCaptcha = async () => {
  try {
    const res = await request.get('/captcha/generate')
    captchaImage.value = res.data.captchaImage
    loginForm.captchaId = res.data.captchaId
    loginForm.captchaCode = '' // 清空验证码输入
  } catch (error) {
    ElMessage.error('获取验证码失败')
  }
}

// 页面加载时获取验证码
onMounted(() => {
  refreshCaptcha()
})

const handleLogin = async () => {
  console.log('=== 开始登录 ===')
  console.log('表单数据:', loginForm)
  console.log('用户类型:', userType.value)
  
  if (!loginFormRef.value) {
    console.log('表单引用不存在')
    return
  }
  
  await loginFormRef.value.validate(async (valid) => {
    console.log('表单验证结果:', valid)
    
    if (valid) {
      loading.value = true
      try {
        const endpoint = `/auth/${userType.value}/login`
        console.log('请求端点:', endpoint)
        console.log('准备发送请求...')
        
        const res = await request.post(endpoint, loginForm)
        console.log('请求成功，响应:', res)
        
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('userType', userType.value)
        
        // 根据用户类型保存到不同的localStorage key
        if (userType.value === 'customer') {
          localStorage.setItem('userInfo', JSON.stringify(res.data))
        } else if (userType.value === 'merchant') {
          localStorage.setItem('merchantInfo', JSON.stringify(res.data))
        } else {
          localStorage.setItem('adminInfo', JSON.stringify(res.data))
        }
        
        ElMessage.success('登录成功')
        
        // 根据用户类型跳转
        if (userType.value === 'customer') {
          router.push('/customer/home')
        } else if (userType.value === 'merchant') {
          router.push('/merchant/dashboard')
        } else {
          router.push('/admin/dashboard')
        }
      } catch (error: any) {
        console.error('登录失败:', error)
        console.error('错误详情:', error.response)
        // 登录失败后刷新验证码
        refreshCaptcha()
      } finally {
        loading.value = false
      }
    } else {
      console.log('表单验证失败')
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 450px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin-bottom: 20px;
  color: #303133;
}
</style>
