import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 标记是否正在跳转登录页，防止重复提示
let isRedirecting = false

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('请求拦截器 - Token:', token ? '存在' : '不存在')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('请求拦截器 - Authorization头:', config.headers.Authorization)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      
      // Token过期或未授权
      if (status === 401 || status === 403) {
        // 防止重复提示和跳转
        if (!isRedirecting) {
          isRedirecting = true
          ElMessage.error('登录已过期，请重新登录')
          
          // 清除所有本地存储
          localStorage.clear()
          
          // 延迟跳转，确保用户看到提示
          setTimeout(() => {
            window.location.href = '/login'
          }, 1000)
        }
        
        return Promise.reject(new Error('登录已过期'))
      }
      
      ElMessage.error(error.response.data.message || '请求失败')
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
