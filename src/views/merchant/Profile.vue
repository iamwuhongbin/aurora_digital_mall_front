<template>
  <div class="merchant-profile">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>商家信息</span>
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
            <el-avatar v-if="merchantInfo.avatar" :size="100" :src="merchantInfo.avatar" />
            <el-avatar v-else :size="100" :icon="UserFilled" />
            <div class="avatar-overlay">
              <el-icon><Camera /></el-icon>
              <span>更换头像</span>
            </div>
          </el-upload>
          <div class="shop-name">{{ merchantInfo.shopName || '未设置店铺名称' }}</div>
        </div>

        <!-- 信息展示 -->
        <div class="info-section">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户名">
              {{ merchantInfo.username || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="店铺名称">
              {{ merchantInfo.shopName || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="联系人">
              {{ merchantInfo.contactPerson || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ merchantInfo.contactPhone || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="营业执照号">
              {{ merchantInfo.businessLicense || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <el-tag v-if="merchantInfo.auditStatus === 1" type="warning">待审核</el-tag>
              <el-tag v-else-if="merchantInfo.auditStatus === 2" type="success">审核通过</el-tag>
              <el-tag v-else-if="merchantInfo.auditStatus === 3" type="danger">审核拒绝</el-tag>
              <el-tag v-else-if="merchantInfo.auditStatus === 4" type="info">已禁用</el-tag>
              <el-tag v-else type="info">未知</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间" :span="2">
              {{ merchantInfo.createdAt || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录时间" :span="2">
              {{ merchantInfo.lastLoginTime || '-' }}
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
        <el-form-item label="店铺名称">
          <el-input v-model="editForm.shopName" placeholder="请输入店铺名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="editForm.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="editForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMerchantInfo">保存</el-button>
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

const merchantInfo = ref<any>({})
const editDialogVisible = ref(false)
const passwordDialogVisible = ref(false)

// 头像上传相关
const uploadUrl = ref('http://localhost:8080/api/merchant/avatar')
const uploadHeaders = ref({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
})

const editForm = reactive({
  shopName: '',
  contactPerson: '',
  contactPhone: ''
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
    merchantInfo.value.avatar = response.data
    // 更新本地存储
    localStorage.setItem('merchantInfo', JSON.stringify(merchantInfo.value))
    // 触发页面刷新以更新顶部导航栏头像
    window.location.reload()
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 加载商家信息
const loadMerchantInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:8080/api/merchant/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.data.code === 200) {
      merchantInfo.value = response.data.data
      editForm.shopName = merchantInfo.value.shopName
      editForm.contactPerson = merchantInfo.value.contactPerson
      editForm.contactPhone = merchantInfo.value.contactPhone
      localStorage.setItem('merchantInfo', JSON.stringify(merchantInfo.value))
    }
  } catch (error: any) {
    console.error('加载商家信息失败', error)
    // 如果请求失败，尝试从本地存储获取
    const localInfo = localStorage.getItem('merchantInfo')
    if (localInfo) {
      merchantInfo.value = JSON.parse(localInfo)
      editForm.shopName = merchantInfo.value.shopName
      editForm.contactPerson = merchantInfo.value.contactPerson
      editForm.contactPhone = merchantInfo.value.contactPhone
    }
  }
}

// 保存商家信息
const saveMerchantInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    await axios.put('http://localhost:8080/api/merchant/profile', editForm, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadMerchantInfo()
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
    await axios.put('http://localhost:8080/api/merchant/password', {
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
      window.location.href = '/merchant/login'
    }, 1500)
  } catch (error) {
    console.error('修改密码失败', error)
    ElMessage.error('修改密码失败')
  }
}

onMounted(() => {
  loadMerchantInfo()
})
</script>

<style scoped>
.merchant-profile {
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

.shop-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  text-align: center;
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
