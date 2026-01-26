<template>
  <div class="merchant-chat-container">
    <el-card class="chat-card">
      <div class="chat-layout">
        <!-- 左侧聊天列表 -->
        <div class="chat-list">
          <div class="chat-list-header">
            <h3>商家列表</h3>
          </div>
          <div class="chat-list-content">
            <div
              v-for="chat in chatList"
              :key="chat.merchantId"
              class="chat-item"
              :class="{ active: currentMerchantId === chat.merchantId }"
              @click="selectMerchant(chat.merchantId)"
            >
              <el-avatar :src="chat.merchantAvatar" :size="50">
                {{ chat.merchantName?.charAt(0) }}
              </el-avatar>
              <div class="chat-item-info">
                <div class="chat-item-header">
                  <span class="merchant-name">{{ chat.merchantName }}</span>
                  <span class="chat-time">{{ formatTime(chat.lastMessageTime) }}</span>
                </div>
                <div class="chat-item-footer">
                  <span class="last-message">{{ chat.lastMessage }}</span>
                  <el-badge v-if="chat.unreadCount > 0" :value="chat.unreadCount" class="unread-badge" />
                </div>
              </div>
            </div>
            <el-empty v-if="chatList.length === 0" description="暂无聊天记录" />
          </div>
        </div>

        <!-- 右侧聊天窗口 -->
        <div class="chat-window">
          <div v-if="currentMerchantId" class="chat-content">
            <div class="chat-header">
              <h3>{{ currentMerchantName }}</h3>
            </div>
            <div class="message-list" ref="messageList">
              <div
                v-for="message in messages"
                :key="message.id"
                class="message-item"
                :class="{ 'is-self': message.senderType === 'ADMIN' }"
              >
                <div class="message-avatar">
                  <el-avatar :size="40" :src="message.senderType === 'ADMIN' ? message.adminAvatar : message.merchantAvatar">
                    {{ message.senderType === 'ADMIN' ? 'A' : 'M' }}
                  </el-avatar>
                </div>
                <div class="message-content">
                  <div class="message-info">
                    <span class="sender-name">
                      {{ message.senderType === 'ADMIN' ? message.adminName : message.merchantName }}
                    </span>
                    <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                  </div>
                  <div class="message-bubble">
                    <img v-if="message.messageType === 'IMAGE'" :src="message.content" class="message-image" />
                    <span v-else>{{ message.content }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="message-input">
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="3"
                placeholder="输入消息..."
                @keydown.enter.prevent="sendMessage"
              />
              <div class="input-actions">
                <el-button type="primary" @click="sendMessage" :disabled="!inputMessage.trim()">
                  发送
                </el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="请选择一个商家开始聊天" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const chatList = ref<any[]>([])
const messages = ref<any[]>([])
const currentMerchantId = ref<number | null>(null)
const currentMerchantName = ref('')
const inputMessage = ref('')
const messageList = ref<HTMLElement>()

let ws: WebSocket | null = null

onMounted(() => {
  loadChatList()
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})

const loadChatList = async () => {
  try {
    const res = await request.get('/admin-merchant-chat/admin/chat-list')
    chatList.value = res.data || []
  } catch (error) {
    console.error('加载聊天列表失败', error)
  }
}

const selectMerchant = async (merchantId: number) => {
  currentMerchantId.value = merchantId
  const chat = chatList.value.find(c => c.merchantId === merchantId)
  currentMerchantName.value = chat?.merchantName || ''
  
  await loadChatHistory(merchantId)
  await markAsRead(merchantId)
  
  // 更新未读数
  if (chat) {
    chat.unreadCount = 0
  }
}

const loadChatHistory = async (merchantId: number) => {
  try {
    const adminId = localStorage.getItem('userId')
    const res = await request.get('/admin-merchant-chat/history', {
      params: { adminId, merchantId, page: 1, size: 50 }
    })
    messages.value = (res.data?.list || res.data?.records || []).reverse()
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('加载聊天历史失败', error)
  }
}

const markAsRead = async (merchantId: number) => {
  try {
    const adminId = localStorage.getItem('userId')
    await request.put('/admin-merchant-chat/mark-read', null, {
      params: { adminId, merchantId }
    })
  } catch (error) {
    console.error('标记已读失败', error)
  }
}

const connectWebSocket = () => {
  const token = localStorage.getItem('token')
  const wsUrl = `ws://localhost:8080/api/ws/admin-merchant-chat?token=${token}`
  
  ws = new WebSocket(wsUrl)
  
  ws.onopen = () => {
    console.log('WebSocket 连接成功')
  }
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'NEW_MESSAGE') {
      const message = data.data
      
      // 如果是当前聊天窗口的消息，添加到消息列表
      if (message.merchantId === currentMerchantId.value) {
        messages.value.push(message)
        nextTick(() => scrollToBottom())
        
        // 如果是对方发送的消息，标记为已读
        if (message.senderType === 'MERCHANT') {
          markAsRead(message.merchantId)
        }
      } else {
        // 更新聊天列表
        loadChatList()
      }
    }
  }
  
  ws.onerror = (error) => {
    console.error('WebSocket 错误', error)
    ElMessage.error('连接失败，请刷新页面重试')
  }
  
  ws.onclose = () => {
    console.log('WebSocket 连接关闭')
    // 5秒后重连
    setTimeout(() => {
      connectWebSocket()
    }, 5000)
  }
}

const sendMessage = () => {
  if (!inputMessage.value.trim() || !currentMerchantId.value) return
  
  const message = {
    type: 'SEND_MESSAGE',
    merchantId: currentMerchantId.value,
    content: inputMessage.value.trim(),
    messageType: 'TEXT'
  }
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
    inputMessage.value = ''
  } else {
    ElMessage.error('连接已断开，请刷新页面重试')
  }
}

const scrollToBottom = () => {
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
}

const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.merchant-chat-container {
  padding: 20px;
}

.chat-card {
  height: calc(100vh - 160px);
}

.chat-layout {
  display: flex;
  height: 100%;
}

.chat-list {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.chat-list-header {
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.chat-list-header h3 {
  margin: 0;
  font-size: 16px;
}

.chat-list-content {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  border-bottom: 1px solid #f5f7fa;
  transition: background-color 0.3s;
}

.chat-item:hover {
  background-color: #f5f7fa;
}

.chat-item.active {
  background-color: #ecf5ff;
}

.chat-item-info {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
}

.chat-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.merchant-name {
  font-weight: 500;
  font-size: 14px;
}

.chat-time {
  font-size: 12px;
  color: #909399;
}

.chat-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  flex: 1;
  font-size: 13px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
}

.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
}

.message-item.is-self {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 10px;
}

.message-content {
  max-width: 60%;
}

.message-item.is-self .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-info {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 12px;
  color: #909399;
}

.message-item.is-self .message-info {
  flex-direction: row-reverse;
}

.sender-name {
  margin-right: 10px;
}

.message-item.is-self .sender-name {
  margin-right: 0;
  margin-left: 10px;
}

.message-bubble {
  padding: 10px 15px;
  border-radius: 8px;
  background-color: #fff;
  word-break: break-word;
}

.message-item.is-self .message-bubble {
  background-color: #409eff;
  color: #fff;
}

.message-image {
  max-width: 200px;
  border-radius: 4px;
}

.message-input {
  padding: 15px 20px;
  border-top: 1px solid #e4e7ed;
  background-color: #fff;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
