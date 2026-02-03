<template>
  <div class="chat-window">
    <div class="chat-header">
      <div class="chat-info">
        <el-avatar :src="chatPartner?.avatar" :size="40">
          {{ chatPartner?.name?.charAt(0) }}
        </el-avatar>
        <div class="chat-name">
          <span>{{ chatPartner?.name }}</span>
          <span class="online-status" :class="{ online: isPartnerOnline }">
            {{ isPartnerOnline ? '在线' : '离线' }}
          </span>
        </div>
      </div>
      <div class="connection-status">
        <el-tag v-if="wsConnected" type="success" size="small">已连接</el-tag>
        <el-tag v-else type="danger" size="small">未连接</el-tag>
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-item"
        :class="{ 'is-mine': msg.senderId === currentUserId }"
      >
        <el-avatar :src="msg.senderAvatar" :size="36">
          {{ msg.senderName?.charAt(0) }}
        </el-avatar>
        <div class="message-content">
          <div class="message-info">
            <span class="sender-name">{{ msg.senderName }}</span>
            <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
          </div>
          <div class="message-text">{{ msg.content }}</div>
        </div>
      </div>
      <div v-if="messages.length === 0" class="empty-messages">
        暂无消息，开始聊天吧~
      </div>
    </div>

    <div class="chat-input">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="3"
        placeholder="输入消息..."
        @keydown.enter.exact="handleSend"
      />
      <div class="input-actions">
        <el-button type="primary" @click="handleSend" :loading="sending">
          发送 (Enter)
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatWebSocket } from '@/utils/websocket'
import request from '@/utils/request'

interface Props {
  sessionId: number
  currentUserId: number
  currentUserType: string
  chatPartner?: {
    name: string
    avatar: string
  }
}

const props = defineProps<Props>()

const messages = ref<any[]>([])
const inputMessage = ref('')
const sending = ref(false)
const wsConnected = ref(false)
const isPartnerOnline = ref(false)
const messagesContainer = ref<HTMLElement>()

let chatWs: ChatWebSocket | null = null

onMounted(async () => {
  await loadMessages()
  await initWebSocket()
  scrollToBottom()
})

onUnmounted(() => {
  if (chatWs) {
    chatWs.close()
  }
})

watch(() => props.sessionId, async () => {
  await loadMessages()
  scrollToBottom()
})

const loadMessages = async () => {
  try {
    const res = await request.get(`/chat/messages/${props.sessionId}`, {
      params: { page: 1, size: 50 }
    })
    messages.value = res.data.list || []
  } catch (error) {
    console.error('加载消息失败', error)
    ElMessage.error('加载消息失败')
  }
}

const initWebSocket = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.error('未登录，无法连接聊天服务')
      return
    }

    chatWs = new ChatWebSocket(token)

    // 监听连接成功
    chatWs.on('connected', (message: any) => {
      console.log('WebSocket connected:', message)
      wsConnected.value = true
      ElMessage.success('聊天服务已连接')
    })

    // 监听新消息
    chatWs.on('new_message', (message: any) => {
      console.log('New message received:', message)
      if (message.data.sessionId === props.sessionId) {
        messages.value.push(message.data)
        nextTick(() => scrollToBottom())
        
        // 标记消息已读
        markAsRead()
      }
    })

    // 监听消息发送成功
    chatWs.on('message_sent', (message: any) => {
      console.log('Message sent:', message)
      // 消息已经在发送时添加到列表，这里可以更新状态
    })

    // 监听错误
    chatWs.on('error', (message: any) => {
      console.error('WebSocket error:', message)
      ElMessage.error(message.message || 'WebSocket 错误')
    })

    // 连接 WebSocket
    await chatWs.connect()
  } catch (error) {
    console.error('WebSocket 连接失败:', error)
    ElMessage.error('聊天服务连接失败')
    wsConnected.value = false
  }
}

const handleSend = async (event?: KeyboardEvent) => {
  if (event) {
    event.preventDefault()
  }

  if (!inputMessage.value.trim()) {
    return
  }

  if (!chatWs || !chatWs.isConnected()) {
    ElMessage.error('聊天服务未连接，请刷新页面重试')
    return
  }

  sending.value = true

  try {
    // 通过 WebSocket 发送消息
    chatWs.sendMessage(props.sessionId, inputMessage.value.trim())

    // 立即添加到消息列表（乐观更新）
    const tempMessage = {
      id: Date.now(),
      sessionId: props.sessionId,
      senderId: props.currentUserId,
      senderName: '我',
      senderAvatar: '',
      content: inputMessage.value.trim(),
      messageType: 1,
      createdAt: new Date().toISOString()
    }
    messages.value.push(tempMessage)

    inputMessage.value = ''
    nextTick(() => scrollToBottom())
  } catch (error) {
    console.error('发送消息失败', error)
    ElMessage.error('发送消息失败')
  } finally {
    sending.value = false
  }
}

const markAsRead = async () => {
  try {
    await request.put(`/chat/read/${props.sessionId}`)
  } catch (error) {
    console.error('标记已读失败', error)
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
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
  
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.chat-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-name > span:first-child {
  font-weight: 600;
  font-size: 16px;
}

.online-status {
  font-size: 12px;
  color: #6b7280;
}

.online-status.online {
  color: #10b981;
}

.connection-status {
  display: flex;
  align-items: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-item.is-mine {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 60%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-item.is-mine .message-content {
  align-items: flex-end;
}

.message-info {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

.message-item.is-mine .message-info {
  flex-direction: row-reverse;
}

.sender-name {
  font-weight: 500;
}

.message-text {
  padding: 10px 14px;
  background: #f3f4f6;
  border-radius: 12px;
  word-break: break-word;
  line-height: 1.5;
}

.message-item.is-mine .message-text {
  background: #8b5cf6;
  color: white;
}

.empty-messages {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}

.chat-input {
  border-top: 1px solid #e5e7eb;
  padding: 16px;
  background: #f9fafb;
}

.input-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
