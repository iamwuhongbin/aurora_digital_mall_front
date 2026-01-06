<template>
  <div class="reviews-container">
    <div class="page-header">
      <h2>评价管理</h2>
      <p class="subtitle">管理商品评价，及时回复用户反馈</p>
    </div>

    <el-card class="filter-card">
      <div class="filter-bar">
        <el-radio-group v-model="filterType" @change="loadReviews">
          <el-radio-button label="all">全部评价</el-radio-button>
          <el-radio-button label="unreplied">待回复</el-radio-button>
          <el-radio-button label="replied">已回复</el-radio-button>
        </el-radio-group>
        
        <div style="flex: 1"></div>
        
        <el-select v-model="ratingFilter" placeholder="评分筛选" style="width: 150px; margin-right: 10px;" @change="loadReviews" clearable>
          <el-option label="全部评分" :value="null" />
          <el-option label="5星" :value="5" />
          <el-option label="4星" :value="4" />
          <el-option label="3星" :value="3" />
          <el-option label="2星" :value="2" />
          <el-option label="1星" :value="1" />
        </el-select>
      </div>
    </el-card>

    <el-card class="reviews-card" v-loading="loading">
      <div v-if="reviews.length === 0" class="empty-state">
        <el-empty description="暂无评价" />
      </div>
      
      <div v-else class="reviews-list">
        <div v-for="review in reviews" :key="review.id" class="review-item">
          <div class="review-header">
            <div class="product-info">
              <el-image 
                :src="review.productImage" 
                class="product-image"
                fit="cover"
              />
              <div class="product-details">
                <div class="product-name">{{ review.productName }}</div>
                <div class="review-meta">
                  <span class="customer-name">{{ review.customerName }}</span>
                  <span class="review-time">{{ formatTime(review.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div class="rating-section">
              <el-rate :model-value="review.rating" disabled :colors="['#99A9BF', '#F7BA2A', '#FF9900']" />
            </div>
          </div>
          
          <div class="review-content">
            <p class="content-text">{{ review.content }}</p>
            <div v-if="review.images" class="review-images">
              <el-image 
                v-for="(img, index) in review.images.split(',')" 
                :key="index"
                :src="img" 
                class="review-image"
                fit="cover"
                :preview-src-list="review.images.split(',')"
              />
            </div>
          </div>
          
          <div v-if="review.replyContent" class="merchant-reply">
            <div class="reply-header">
              <el-icon class="reply-icon"><ChatDotRound /></el-icon>
              <span class="reply-label">商家回复</span>
              <span class="reply-time">{{ formatTime(review.replyTime) }}</span>
            </div>
            <p class="reply-content">{{ review.replyContent }}</p>
          </div>
          
          <div class="review-actions">
            <el-button 
              v-if="!review.replyContent" 
              type="primary" 
              size="small"
              @click="showReplyDialog(review)"
            >
              <el-icon><ChatDotRound /></el-icon>
              回复评价
            </el-button>
            <el-button 
              v-else
              type="default" 
              size="small"
              @click="showReplyDialog(review)"
            >
              <el-icon><Edit /></el-icon>
              修改回复
            </el-button>
          </div>
        </div>
      </div>
      
      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadReviews"
        @size-change="loadReviews"
        class="pagination"
      />
    </el-card>
    
    <!-- 回复对话框 -->
    <el-dialog 
      v-model="replyDialogVisible" 
      :title="currentReview?.replyContent ? '修改回复' : '回复评价'"
      width="600px"
    >
      <div class="reply-dialog-content">
        <div class="original-review">
          <div class="review-info">
            <span class="customer-name">{{ currentReview?.customerName }}</span>
            <el-rate :model-value="currentReview?.rating" disabled size="small" />
          </div>
          <p class="review-text">{{ currentReview?.content }}</p>
        </div>
        
        <el-divider />
        
        <el-form :model="replyForm" label-width="80px">
          <el-form-item label="回复内容">
            <el-input 
              v-model="replyForm.content" 
              type="textarea" 
              :rows="6"
              placeholder="请输入回复内容，友好、专业地回应用户的评价..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply" :loading="submitting">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Edit } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const reviews = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterType = ref('all')
const ratingFilter = ref<number | null>(null)

const replyDialogVisible = ref(false)
const currentReview = ref<any>(null)
const replyForm = ref({
  content: ''
})
const submitting = ref(false)

const loadReviews = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value
    }
    
    // 筛选条件
    if (filterType.value === 'unreplied') {
      params.hasReply = 0
    } else if (filterType.value === 'replied') {
      params.hasReply = 1
    }
    
    if (ratingFilter.value) {
      params.rating = ratingFilter.value
    }
    
    const res = await request.get('/review/merchant', { params })
    reviews.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error: any) {
    console.error('加载评价列表失败', error)
    ElMessage.error(error.message || '加载评价列表失败')
  } finally {
    loading.value = false
  }
}

const showReplyDialog = (review: any) => {
  currentReview.value = review
  replyForm.value.content = review.replyContent || ''
  replyDialogVisible.value = true
}

const submitReply = async () => {
  if (!replyForm.value.content.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  submitting.value = true
  try {
    await request.put(`/review/${currentReview.value.id}/reply`, null, {
      params: { reply: replyForm.value.content }
    })
    
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    loadReviews()
  } catch (error: any) {
    console.error('回复失败', error)
    ElMessage.error(error.message || '回复失败')
  } finally {
    submitting.value = false
  }
}

const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

onMounted(() => {
  loadReviews()
})
</script>

<style scoped>
.reviews-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 15px;
}

.reviews-card {
  min-height: 400px;
}

.empty-state {
  padding: 60px 0;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-item {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.review-item:hover {
  background: #ecf0f5;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.product-info {
  display: flex;
  gap: 12px;
  flex: 1;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.review-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #909399;
}

.customer-name {
  font-weight: 500;
  color: #606266;
}

.review-time {
  color: #909399;
}

.rating-section {
  display: flex;
  align-items: center;
}

.review-content {
  margin-bottom: 15px;
}

.content-text {
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.review-images {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.review-image {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.3s;
}

.review-image:hover {
  transform: scale(1.05);
}

.merchant-reply {
  background: white;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 3px solid #409eff;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.reply-icon {
  color: #409eff;
  font-size: 16px;
}

.reply-label {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.reply-time {
  color: #909399;
  font-size: 12px;
  margin-left: auto;
}

.reply-content {
  color: #606266;
  line-height: 1.6;
  margin: 0;
  font-size: 14px;
}

.review-actions {
  display: flex;
  justify-content: flex-end;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 回复对话框样式 */
.reply-dialog-content {
  padding: 10px 0;
}

.original-review {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
}

.review-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.review-info .customer-name {
  font-weight: 600;
  color: #303133;
}

.review-text {
  color: #606266;
  line-height: 1.6;
  margin: 0;
  font-size: 14px;
}
</style>
