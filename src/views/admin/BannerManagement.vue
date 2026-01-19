<template>
  <div class="banner-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>轮播图管理</h2>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加轮播图
          </el-button>
        </div>
      </template>

      <!-- 轮播图列表 -->
      <el-table :data="banners" v-loading="loading" style="width: 100%;">
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column label="图片预览" width="200">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl"
              style="width: 160px; height: 60px; border-radius: 4px;"
              fit="cover"
              :preview-src-list="[row.imageUrl]"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="title" label="标题" min-width="150" />
        
        <el-table-column label="关联商品" min-width="200">
          <template #default="{ row }">
            <span v-if="row.productName">{{ row.productName }}</span>
            <span v-else style="color: #999;">未关联</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="sortOrder" label="排序" width="80" />
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="toggleStatus(row)"
              active-text="启用"
              inactive-text="禁用"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showEditDialog(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="deleteBanner(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadBanners"
        @current-change="loadBanners"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 添加/编辑轮播图对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="bannerForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="bannerForm.title" placeholder="请输入轮播图标题" />
        </el-form-item>
        
        <el-form-item label="轮播图图片" required>
          <el-upload
            class="banner-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            accept="image/*"
          >
            <img v-if="bannerForm.imageUrl" :src="bannerForm.imageUrl" class="banner-image" />
            <el-icon v-else class="banner-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div style="color: #999; font-size: 12px; margin-top: 8px;">
            建议尺寸：1200x400像素，支持 JPG、PNG 格式，大小不超过 2MB
          </div>
        </el-form-item>
        
        <el-form-item label="关联商品">
          <el-select
            v-model="bannerForm.productId"
            placeholder="输入商品名称进行搜索..."
            filterable
            remote
            :remote-method="searchProducts"
            :loading="searchLoading"
            clearable
            style="width: 100%;"
          >
            <el-option
              v-for="product in productOptions"
              :key="product.id"
              :label="product.productName"
              :value="product.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="跳转链接">
          <el-input
            v-model="bannerForm.linkUrl"
            placeholder="自定义跳转链接（可选，优先级高于关联商品）"
          />
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number v-model="bannerForm.sortOrder" :min="0" :max="999" />
          <span style="margin-left: 10px; color: #999; font-size: 12px;">数字越小越靠前</span>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="bannerForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const banners = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('添加轮播图')
const searchLoading = ref(false)
const productOptions = ref<any[]>([])

const bannerForm = ref({
  id: null as number | null,
  title: '',
  imageUrl: '',
  productId: null as number | null,
  linkUrl: '',
  sortOrder: 0,
  status: 1
})

// 上传配置
const uploadUrl = ref('http://localhost:8080/api/upload/image')
const uploadHeaders = ref({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
})

onMounted(() => {
  loadBanners()
})

const loadBanners = async () => {
  loading.value = true
  try {
    const res = await request.get('/banner/list', {
      params: {
        page: currentPage.value,
        size: pageSize.value
      }
    })
    banners.value = res.data?.list || res.data?.records || []
    total.value = res.data?.total || 0
  } catch (error: any) {
    console.error('加载轮播图列表失败', error)
    ElMessage.error(error.message || '加载轮播图列表失败')
  } finally {
    loading.value = false
  }
}

const searchProducts = async (query: string) => {
  if (!query) {
    productOptions.value = []
    return
  }
  
  searchLoading.value = true
  try {
    const res = await request.get('/product/list', {
      params: {
        keyword: query,
        page: 1,
        size: 20
      }
    })
    productOptions.value = res.data?.list || res.data?.records || []
  } catch (error) {
    console.error('搜索商品失败', error)
  } finally {
    searchLoading.value = false
  }
}

const showAddDialog = () => {
  dialogTitle.value = '添加轮播图'
  resetForm()
  dialogVisible.value = true
}

const showEditDialog = (banner: any) => {
  dialogTitle.value = '编辑轮播图'
  bannerForm.value = {
    id: banner.id,
    title: banner.title,
    imageUrl: banner.imageUrl,
    productId: banner.productId,
    linkUrl: banner.linkUrl || '',
    sortOrder: banner.sortOrder,
    status: banner.status
  }
  
  if (banner.productId && banner.productName) {
    productOptions.value = [{
      id: banner.productId,
      productName: banner.productName
    }]
  }
  
  dialogVisible.value = true
}

const resetForm = () => {
  bannerForm.value = {
    id: null,
    title: '',
    imageUrl: '',
    productId: null,
    linkUrl: '',
    sortOrder: 0,
    status: 1
  }
  productOptions.value = []
}

// 上传前验证
const beforeUpload = (file: any) => {
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

// 上传成功
const handleUploadSuccess = (response: any) => {
  if (response.code === 200) {
    bannerForm.value.imageUrl = response.data
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.message || '图片上传失败')
  }
}

// 上传失败
const handleUploadError = () => {
  ElMessage.error('图片上传失败，请重试')
}

const submitForm = async () => {
  if (!bannerForm.value.title) {
    ElMessage.warning('请输入标题')
    return
  }
  
  if (!bannerForm.value.imageUrl) {
    ElMessage.warning('请上传轮播图图片')
    return
  }
  
  try {
    if (bannerForm.value.id) {
      await request.put(`/banner/${bannerForm.value.id}`, bannerForm.value)
      ElMessage.success('更新成功')
    } else {
      await request.post('/banner', bannerForm.value)
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
    loadBanners()
  } catch (error: any) {
    console.error('操作失败', error)
    ElMessage.error(error.message || '操作失败')
  }
}

const toggleStatus = async (banner: any) => {
  const newStatus = banner.status === 1 ? 0 : 1
  try {
    await request.put(`/banner/${banner.id}/status`, null, {
      params: { status: newStatus }
    })
    ElMessage.success('状态更新成功')
    loadBanners()
  } catch (error: any) {
    console.error('状态更新失败', error)
    ElMessage.error(error.message || '状态更新失败')
  }
}

const deleteBanner = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个轮播图吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/banner/${id}`)
    ElMessage.success('删除成功')
    loadBanners()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style scoped>
.banner-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
}

.banner-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.banner-uploader:hover {
  border-color: #409eff;
}

.banner-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 400px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-image {
  width: 400px;
  height: 150px;
  display: block;
  object-fit: cover;
}
</style>
