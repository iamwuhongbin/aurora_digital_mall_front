<template>
  <div class="customer-service-container">
    <div class="page-header">
      <h2>在线客服</h2>
      <p class="subtitle">有任何问题，我们随时为您服务</p>
    </div>

    <div class="chat-wrapper">
      <div class="chat-box">
        <!-- 聊天头部 -->
        <div class="chat-header">
          <div class="merchant-info">
            <el-avatar :src="merchantAvatar || '/default-avatar.png'" :size="40" />
            <div>
              <h3>{{ merchantName || '客服' }}</h3>
              <p class="status">在线</p>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="message-list" ref="messageContainer" v-loading="loading">
          <div v-if="messages.length === 0" class="empty-messages">
            <el-empty description="暂无消息，开始聊天吧！" />
          </div>
          <div 
            v-for="msg in messages" 
            :key="msg.id"
            class="message-item"
            :class="{ 'is-mine': msg.senderType === 1 }"
          >
            <el-avatar 
              :src="msg.senderAvatar || '/default-avatar.png'" 
              :size="36"
              class="message-avatar"
            />
            <div class="message-content">
              <div class="message-text">{{ msg.content }}</div>
              <div class="message-time">{{ formatMessageTime(msg.createdAt) }}</div>
            </div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="message-input">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入消息，按Enter发送，Shift+Enter换行..."
            @keydown.enter.exact.prevent="sendMessage"
            maxlength="500"
            show-word-limit
          />
          <el-button type="primary" @click="sendMessage" :loading="sending">
            <el-icon><Promotion /></el-icon>
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'
import request from '@/utils/request'

const messages = ref<any[]>([])
const inputMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const loading = ref(false)
const sending = ref(false)
const sessionId = ref<number | null>(null)
const merchantId = ref<number | null>(null)
const merchantName = ref('')
const merchantAvatar = ref('')
const pollingTimer = ref<number | null>(null)

onMounted(async () => {
  await initChat()
})

onUnmounted(() => {
  stopPolling()
})

const initChat = async () => {
  // 这里需要获取一个商家ID，可以从商品详情页传入，或者默认选择一个
  // 暂时使用固定的商家ID，实际应该从路由参数或者选择商家
  const queryMerchantId = new URLSearchParams(window.location.search).get('merchantId')
  merchantId.value = queryMerchantId ? parseInt(queryMerchantId) : 1
  
  await createOrGetSession()
  await loadMessages()
  startPolling()
}

const createOrGetSession = async () => {
  try {
    const res = await request.post(`/chat/session/${merchantId.value}`)
    sessionId.value = res.data.id
    merchantName.value = res.data.merchantName
    merchantAvatar.value = res.data.merchantAvatar
  } catch (error: any) {
    console.error('创建会话失败', error)
    ElMessage.error(error.message || '创建会话失败')
  }
}

const loadMessages = async () => {
  if (!sessionId.value) return
  
  loading.value = true
  try {
    const res = await request.get(`/chat/messages/${sessionId.value}`, {
      params: { page: 1, size: 50 }
    })
    messages.value = res.data?.list || []
    scrollToBottom()
    markAsRead()
  } catch (error: any) {
    console.error('加载消息失败', error)
    ElMessage.error(error.message || '加载消息失败')
  } finally {
    loading.value = false
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  
  if (!sessionId.value) {
    ElMessage.warning('会话未建立，请刷新页面重试')
    return
  }
  
  sending.value = true
  try {
    const res = await request.post('/chat/send', {
      sessionId: sessionId.value,
      content: inputMessage.value.trim(),
      messageType: 1
    })
    
    messages.value.push(res.data)
    inputMessage.value = ''
    scrollToBottom()
  } catch (error: any) {
    console.error('发送消息失败', error)
    ElMessage.error(error.message || '发送消息失败')
  } finally {
    sending.value = false
  }
}

const startPolling = () => {
  stopPolling()
  pollingTimer.value = window.setInterval(async () => {
    if (!sessionId.value || messages.value.length === 0) return
    
    const lastMessageId = messages.value[messages.value.length - 1].id
    try {
      const res = await request.get(`/chat/new-messages/${sessionId.value}`, {
        params: { lastMessageId }
      })
      
      if (res.data && res.data.length > 0) {
        messages.value.push(...res.data)
        scrollToBottom()
        markAsRead()
      }
    } catch (error) {
      console.error('获取新消息失败', error)
    }
  }, 3000)
}

const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

const markAsRead = async () => {
  if (!sessionId.value) return
  
  try {
    await request.put(`/chat/read/${sessionId.value}`)
  } catch (error) {
    console.error('标记已读失败', error)
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

const formatMessageTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.customer-service-container {
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h2 {
  font-size: 28px;
  color: #303133;
  margin: 0 0 10px 0;
}

.subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.chat-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.chat-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.merchant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.merchant-info h3 {
  margin: 0;
  font-size: 16px;
  color: white;
}

.status {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
}

.empty-messages {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-item {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.message-item.is-mine {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 60%;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  background: white;
  word-wrap: break-word;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message-item.is-mine .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  padding: 0 5px;
}

.message-item.is-mine .message-time {
  text-align: right;
}

.message-input {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: white;
}

.message-input .el-textarea {
  flex: 1;
}

.message-input > .el-button {
  align-self: flex-end;
}
</style>
