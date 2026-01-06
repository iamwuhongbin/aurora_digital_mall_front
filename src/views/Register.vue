<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <h2>用户注册</h2>
          <el-segmented v-model="userType" :options="userTypes" size="large" />
        </div>
      </template>
      
      <el-form :model="registerForm" :rules="rules" ref="registerFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        
        <template v-if="userType === 'customer'">
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="registerForm.nickname" placeholder="请输入昵称" />
          </el-form-item>
          
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="registerForm.phone" placeholder="请输入手机号" />
          </el-form-item>
        </template>
        
        <template v-if="userType === 'merchant'">
          <el-form-item label="店铺名称" prop="shopName">
            <el-input v-model="registerForm.shopName" placeholder="请输入店铺名称" />
          </el-form-item>
          
          <el-form-item label="联系人" prop="contactPerson">
            <el-input v-model="registerForm.contactPerson" placeholder="请输入联系人姓名" />
          </el-form-item>
          
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="registerForm.contactPhone" placeholder="请输入联系电话" />
          </el-form-item>
          
          <el-form-item label="营业执照号" prop="businessLicense">
            <el-input v-model="registerForm.businessLicense" placeholder="请输入营业执照号" />
          </el-form-item>
          
          <el-form-item label="营业执照图片" prop="licenseImage">
            <el-upload
              class="license-uploader"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleLicenseSuccess"
              :before-upload="beforeLicenseUpload"
              accept="image/*"
            >
              <img v-if="registerForm.licenseImage" :src="registerForm.licenseImage" class="license-image" />
              <el-icon v-else class="license-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">请上传营业执照照片，支持jpg、png格式</div>
          </el-form-item>
        </template>
        
        <el-form-item>
          <el-button type="primary" @click="handleRegister" :loading="loading" style="width: 100%">
            注册
          </el-button>
        </el-form-item>
        
        <el-form-item>
          <el-link type="primary" @click="$router.push('/login')">已有账号？立即登录</el-link>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const registerFormRef = ref<FormInstance>()
const loading = ref(false)

const userType = ref('customer')
const userTypes = [
  { label: '用户', value: 'customer' },
  { label: '商家', value: 'merchant' }
]

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  phone: '',
  shopName: '',
  contactPerson: '',
  contactPhone: '',
  businessLicense: '',
  licenseImage: ''
})

// 图片上传配置
const uploadUrl = 'http://localhost:8080/api/upload/image'
const uploadHeaders = {
  Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
}

const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [{ validator: validatePass, trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  shopName: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  businessLicense: [{ required: true, message: '请输入营业执照号', trigger: 'blur' }],
  licenseImage: [{ required: true, message: '请上传营业执照图片', trigger: 'change' }]
}

// 图片上传成功回调
const handleLicenseSuccess = (response: any) => {
  if (response.code === 200) {
    registerForm.licenseImage = response.data
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 图片上传前校验
const beforeLicenseUpload = (file: any) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const endpoint = `/auth/${userType.value}/register`
        await request.post(endpoint, registerForm)
        
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (error: any) {
        ElMessage.error(error.message || '注册失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}

.register-card {
  width: 500px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin-bottom: 20px;
  color: #303133;
}

.license-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.license-uploader:hover {
  border-color: #409eff;
}

.license-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}

.license-image {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.5;
}
</style>
