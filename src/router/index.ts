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
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/customer/Orders.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/customer/Profile.vue')
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
        path: 'reviews',
        name: 'MerchantReviews',
        component: () => import('@/views/merchant/Reviews.vue')
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
        path: 'customers',
        name: 'AdminCustomers',
        component: () => import('@/views/admin/Customers.vue')
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
  routes
})

export default router
