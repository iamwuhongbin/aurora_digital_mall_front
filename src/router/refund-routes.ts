// 退款功能路由配置
// 请将这些路由添加到你的主路由配置文件中

export const refundRoutes = [
  // 买家端退款路由
  {
    path: '/customer/refund/apply',
    name: 'ApplyRefund',
    component: () => import('@/views/customer/ApplyRefund.vue'),
    meta: { 
      title: '申请退款', 
      requiresAuth: true,
      role: 'customer'
    }
  },
  {
    path: '/customer/refunds',
    name: 'CustomerRefundList',
    component: () => import('@/views/customer/RefundList.vue'),
    meta: { 
      title: '我的退款', 
      requiresAuth: true,
      role: 'customer'
    }
  },
  
  // 商家端退款路由
  {
    path: '/merchant/refunds',
    name: 'MerchantRefundList',
    component: () => import('@/views/merchant/RefundList.vue'),
    meta: { 
      title: '退款管理', 
      requiresAuth: true,
      role: 'merchant'
    }
  }
]
