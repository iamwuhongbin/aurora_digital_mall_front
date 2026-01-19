<template>
  <div class="admin-profile">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>管理员信息</span>
        </div>
      </template>

      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <el-upload
            class="avatar-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <el-avatar v-if="adminInfo.avatar" :size="100" :src="adminInfo.avatar" />
            <el-avatar v-else :size="100" :icon="UserFilled" />
            <div class="avatar-overlay">
              <el-icon><Camera /></el-icon>
              <span>更换头像</span>
            </div>
          </el-upload>
          <div class="admin-name">{{ adminInfo.realName || adminInfo.username }}</div>
          <el-tag type="danger" size="small">超级管理员</el-tag>
        </div>

        <!-- 信息展示 -->
        <div class="info-section">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户名">
              {{ adminInfo.username || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="真实姓名">
              {{ adminInfo.realName || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号">
              {{ adminInfo.phone || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ adminInfo.email || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间" :span="2">
              {{ adminInfo.createdAt || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录时间" :span="2">
              {{ adminInfo.lastLoginTime || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录IP" :span="2">
              {{ adminInfo.lastLoginIp || '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="action-buttons">
            <el-button type="primary" @click="editDialogVisible = true">编辑资料</el-button>
            <el-button @click="passwordDialogVisible = true">修改密码</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑资料" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="真实姓名">
          <el-input v-model="editForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAdminInfo">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="500px">
      <el-form :model="passwordForm" label-width="100px">
        <el-form-item label="原密码">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Camera } from '@element-plus/icons-vue'
import axios from 'axios'

const adminInfo = ref<any>({})
const editDialogVisible = ref(false)
const passwordDialogVisible = ref(false)

// 头像上传相关
const uploadUrl = ref('http://localhost:8080/api/admin/avatar')
const uploadHeaders = ref({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
})

const editForm = reactive({
  realName: '',
  phone: '',
  email: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 头像上传相关方法
const beforeAvatarUpload = (file: any) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleAvatarSuccess = (response: any) => {
  if (response.code === 200) {
    ElMessage.success('头像上传成功')
    adminInfo.value.avatar = response.data
    // 更新本地存储
    localStorage.setItem('adminInfo', JSON.stringify(adminInfo.value))
    // 触发页面刷新以更新顶部导航栏头像
    window.location.reload()
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 加载管理员信息
const loadAdminInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:8080/api/admin/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data.code === 200) {
      adminInfo.value = response.data.data
      editForm.realName = adminInfo.value.realName
      editForm.phone = adminInfo.value.phone
      editForm.email = adminInfo.value.email
      localStorage.setItem('adminInfo', JSON.stringify(adminInfo.value))
    }
  } catch (error: any) {
    console.error('加载管理员信息失败', error)
    // 如果请求失败，尝试从本地存储获取
    const localInfo = localStorage.getItem('adminInfo')
    if (localInfo) {
      adminInfo.value = JSON.parse(localInfo)
      editForm.realName = adminInfo.value.realName
      editForm.phone = adminInfo.value.phone
      editForm.email = adminInfo.value.email
    }
  }
}

// 保存管理员信息
const saveAdminInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    await axios.put('http://localhost:8080/api/admin/profile', editForm, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadAdminInfo()
  } catch (error) {
    console.error('保存失败', error)
    ElMessage.error('保存失败')
  }
}

// 修改密码
const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  try {
    const token = localStorage.getItem('token')
    await axios.put('http://localhost:8080/api/admin/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordDialogVisible.value = false
    setTimeout(() => {
      localStorage.clear()
      window.location.href = '/admin/login'
    }, 1500)
  } catch (error) {
    console.error('修改密码失败', error)
    ElMessage.error('修改密码失败')
  }
}

onMounted(() => {
  loadAdminInfo()
})
</script>

<style scoped>
.admin-profile {
  padding: 20px;
}

.profile-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
}

.profile-content {
  display: flex;
  gap: 40px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.avatar-uploader {
  position: relative;
  display: inline-block;
  cursor: pointer;
  margin-bottom: 20px;
}

.avatar-uploader:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: #fff;
  font-size: 12px;
}

.avatar-overlay .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.admin-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  text-align: center;
  margin-bottom: 10px;
}

.info-section {
  flex: 1;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>
