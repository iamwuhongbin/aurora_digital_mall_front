<template>
  <div class="chat-container">
    <el-row :gutter="0" style="height: 100%;">
      <!-- 左侧商家列表 -->
      <el-col :span="6" class="session-list">
        <div class="session-header">
          <h3>我的客服</h3>
        </div>
        <div class="session-items">
          <div v-if="sessions.length === 0" class="empty-sessions">
            <el-empty description="暂无会话" />
          </div>
          <div 
            v-for="session in sessions" 
            :key="session.id"
            class="session-item"
            :class="{ active: currentSession?.id === session.id }"
            @click="selectSession(session)"
          >
            <el-avatar :src="session.merchantAvatar || '/default-avatar.png'" :size="45" />
            <div class="session-info">
              <div class="merchant-name">{{ session.merchantName }}</div>
              <div class="last-message">{{ session.lastMessage || '开始聊天...' }}</div>
            </div>
            <div class="session-meta">
              <div class="message-time">{{ formatSessionTime(session.lastMessageTime) }}</div>
              <el-badge v-if="session.unreadCount > 0" :value="session.unreadCount" class="unread-badge" />
            </div>
          </div>
        </div>
      </el-col>
      
      <!-- 右侧聊天窗口 -->
      <el-col :span="18" class="chat-window">
        <div v-if="currentSession" class="chat-content">
          <div class="chat-header">
            <div class="header-info">
              <el-avatar :src="currentSession.merchantAvatar || '/default-avatar.png'" :size="40" />
              <h3>{{ currentSession.merchantName }}</h3>
            </div>
          </div>
          
          <div class="message-list" ref="messageContainer" v-loading="messageLoading">
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
        
        <div v-else class="empty-chat">
          <el-empty description="选择一个商家开始聊天" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const sessions = ref<any[]>([])
const currentSession = ref<any>(null)
const messages = ref<any[]>([])
const inputMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const pollingTimer = ref<number | null>(null)
const messageLoading = ref(false)
const sending = ref(false)

const loadSessions = async () => {
  try {
    const res = await request.get('/chat/sessions')
    sessions.value = res.data || []
    
    if (route.params.merchantId && sessions.value.length === 0) {
      await createSession(Number(route.params.merchantId))
    } else if (route.params.merchantId) {
      const existingSession = sessions.value.find(s => s.merchantId === Number(route.params.merchantId))
      if (existingSession) {
        selectSession(existingSession)
      } else {
        await createSession(Number(route.params.merchantId))
      }
    }
  } catch (error: any) {
    console.error('加载会话列表失败', error)
    ElMessage.error(error.message || '加载会话列表失败')
  }
}

const createSession = async (merchantId: number) => {
  try {
    const res = await request.post(`/chat/session/${merchantId}`)
    sessions.value.unshift(res.data)
    selectSession(res.data)
  } catch (error: any) {
    console.error('创建会话失败', error)
    ElMessage.error(error.message || '创建会话失败')
  }
}

const selectSession = async (session: any) => {
  currentSession.value = session
  await loadMessages()
  startPolling()
  markAsRead()
}

const loadMessages = async () => {
  if (!currentSession.value) return
  
  messageLoading.value = true
  try {
    const res = await request.get(`/chat/messages/${currentSession.value.id}`, {
      params: { page: 1, size: 50 }
    })
    messages.value = res.data?.list || []
    scrollToBottom()
  } catch (error: any) {
    console.error('加载消息失败', error)
    ElMessage.error(error.message || '加载消息失败')
  } finally {
    messageLoading.value = false
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  
  if (!currentSession.value) {
    ElMessage.warning('请先选择会话')
    return
  }
  
  sending.value = true
  try {
    const res = await request.post('/chat/send', {
      sessionId: currentSession.value.id,
      content: inputMessage.value.trim(),
      messageType: 1
    })
    
    messages.value.push(res.data)
    inputMessage.value = ''
    scrollToBottom()
    
    const sessionIndex = sessions.value.findIndex(s => s.id === currentSession.value.id)
    if (sessionIndex > -1) {
      sessions.value[sessionIndex].lastMessage = res.data.content
      sessions.value[sessionIndex].lastMessageTime = res.data.createdAt
    }
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
    if (!currentSession.value || messages.value.length === 0) return
    
    const lastMessageId = messages.value[messages.value.length - 1].id
    try {
      const res = await request.get(`/chat/new-messages/${currentSession.value.id}`, {
        params: { lastMessageId }
      })
      
      if (res.data && res.data.length > 0) {
        messages.value.push(...res.data)
        scrollToBottom()
        markAsRead()
        
        const sessionIndex = sessions.value.findIndex(s => s.id === currentSession.value.id)
        if (sessionIndex > -1) {
          const lastMsg = res.data[res.data.length - 1]
          sessions.value[sessionIndex].lastMessage = lastMsg.content
          sessions.value[sessionIndex].lastMessageTime = lastMsg.createdAt
        }
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
  if (!currentSession.value) return
  
  try {
    await request.put(`/chat/read/${currentSession.value.id}`)
    currentSession.value.unreadCount = 0
    
    const sessionIndex = sessions.value.findIndex(s => s.id === currentSession.value.id)
    if (sessionIndex > -1) {
      sessions.value[sessionIndex].unreadCount = 0
    }
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

const formatSessionTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

const formatMessageTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  loadSessions()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 60px);
  background: #f5f5f5;
}

.session-list {
  background: white;
  border-right: 1px solid #e0e0e0;
  height: 100%;
  overflow-y: auto;
}

.session-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.session-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.session-items {
  height: calc(100% - 70px);
  overflow-y: auto;
}

.empty-sessions {
  padding: 60px 20px;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
  position: relative;
}

.session-item:hover {
  background: #f5f5f5;
}

.session-item.active {
  background: #e3f2fd;
}

.session-info {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
  margin-right: 10px;
}

.merchant-name {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
  color: #303133;
}

.last-message {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.unread-badge {
  margin-top: 5px;
}

.chat-window {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.empty-chat {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.chat-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-info h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
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
  padding: 10px 15px;
  border-radius: 8px;
  background: white;
  word-wrap: break-word;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message-item.is-mine .message-text {
  background: #1890ff;
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
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 10px;
  background: white;
}

.message-input .el-textarea {
  flex: 1;
}

.message-input .el-button {
  align-self: flex-end;
}
</style>
