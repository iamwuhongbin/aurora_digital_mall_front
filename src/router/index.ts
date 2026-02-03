import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/customer'
  },
  {
    path: '/customer',
    name: 'Customer',
    component: () => import('@/views/customer/Layout.vue'),
    children: [
      {
        path: '',
        redirect: '/customer/home'
      },
      {
        path: 'home',
        name: 'CustomerHome',
        component: () => import('@/views/customer/Home.vue')
      },
      {
        path: 'products',
        name: 'ProductList',
        component: () => import('@/views/customer/ProductList.vue')
      },
      {
        path: 'product/:id',
        name: 'ProductDetail',
        component: () => import('@/views/customer/ProductDetail.vue')
      },
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('@/views/customer/Cart.vue')
      },
      {
        path: 'checkout',
        name: 'Checkout',
        component: () => import('@/views/customer/Checkout.vue')
      },
      {
        path: 'favorites',
        name: 'Favorites',
        component: () => import('@/views/customer/Favorites.vue')
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/customer/Orders.vue')
      },
      {
        path: 'order/:id',
        name: 'OrderDetail',
        component: () => import('@/views/customer/OrderDetail.vue')
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('@/views/customer/Payment.vue')
      },
      {
        path: 'payment/return',
        name: 'PaymentReturn',
        component: () => import('@/views/customer/PaymentReturn.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/customer/Profile.vue')
      },
      {
        path: 'chat/:merchantId?',
        name: 'CustomerChat',
        component: () => import('@/views/customer/Chat.vue')
      },
      {
        path: 'points',
        name: 'PointsCenter',
        component: () => import('@/views/customer/PointsCenter.vue')
      },
      {
        path: 'coupons',
        name: 'CouponCenter',
        component: () => import('@/views/customer/CouponCenter.vue')
      },
      {
        path: 'refund/apply',
        name: 'ApplyRefund',
        component: () => import('@/views/customer/ApplyRefund.vue')
      },
      {
        path: 'refunds',
        name: 'CustomerRefundList',
        component: () => import('@/views/customer/RefundList.vue')
      },
      {
        path: 'refund/:id',
        name: 'CustomerRefundDetail',
        component: () => import('@/views/customer/RefundDetail.vue')
      }
    ]
  },
  {
    path: '/merchant',
    name: 'Merchant',
    component: () => import('@/views/merchant/Layout.vue'),
    children: [
      {
        path: '',
        redirect: '/merchant/dashboard'
      },
      {
        path: 'dashboard',
        name: 'MerchantDashboard',
        component: () => import('@/views/merchant/Dashboard.vue')
      },
      {
        path: 'products',
        name: 'MerchantProducts',
        component: () => import('@/views/merchant/Products.vue')
      },
      {
        path: 'categories',
        name: 'MerchantCategories',
        component: () => import('@/views/merchant/Categories.vue')
      },
      {
        path: 'orders',
        name: 'MerchantOrders',
        component: () => import('@/views/merchant/Orders.vue')
      },
      {
        path: 'order/:id',
        name: 'MerchantOrderDetail',
        component: () => import('@/views/merchant/OrderDetail.vue')
      },
      {
        path: 'customers',
        name: 'MerchantCustomers',
        component: () => import('@/views/merchant/CustomerManagement.vue')
      },
      {
        path: 'reviews',
        name: 'MerchantReviews',
        component: () => import('@/views/merchant/Reviews.vue')
      },
      {
        path: 'chat',
        name: 'MerchantChat',
        component: () => import('@/views/merchant/Chat.vue')
      },
      {
        path: 'coupons',
        name: 'MerchantCoupons',
        component: () => import('@/views/merchant/CouponManagement.vue')
      },
      {
        path: 'refunds',
        name: 'MerchantRefundList',
        component: () => import('@/views/merchant/RefundList.vue')
      },
      {
        path: 'refund/:id',
        name: 'MerchantRefundDetail',
        component: () => import('@/views/merchant/RefundDetail.vue')
      },
      {
        path: 'profile',
        name: 'MerchantProfile',
        component: () => import('@/views/merchant/Profile.vue')
      },
      {
        path: 'admin-chat',
        name: 'MerchantAdminChat',
        component: () => import('@/views/merchant/AdminChat.vue')
      }
    ]
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/Layout.vue'),
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'merchants',
        name: 'AdminMerchants',
        component: () => import('@/views/admin/Merchants.vue')
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('@/views/admin/Products.vue')
      },
      {
        path: 'product-management',
        name: 'AdminProductManagement',
        component: () => import('@/views/admin/ProductManagement.vue')
      },
      {
        path: 'banners',
        name: 'AdminBanners',
        component: () => import('@/views/admin/BannerManagement.vue')
      },
      {
        path: 'customers',
        name: 'AdminCustomers',
        component: () => import('@/views/admin/Customers.vue')
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('@/views/admin/Profile.vue')
      },
      {
        path: 'merchant-chat',
        name: 'AdminMerchantChat',
        component: () => import('@/views/admin/MerchantChat.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/api-test',
    name: 'ApiTest',
    component: () => import('@/views/ApiTest.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（例如通过浏览器后退按钮），返回到该位置
    if (savedPosition) {
      return savedPosition
    }
    // 如果是在同一个路由内导航（例如商品列表页切换分类），保持当前滚动位置
    if (to.path === from.path) {
      return false
    }
    // 其他情况滚动到顶部
    return { top: 0 }
  }
})

export default router
