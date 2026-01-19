# 退款功能前端路由配置

## 需要添加的路由

请在前端路由配置文件中添加以下路由：

### 买家端路由 (customer)

```javascript
// 在 customer 路由组下添加
{
  path: '/customer/refund/apply',
  name: 'ApplyRefund',
  component: () => import('@/views/customer/ApplyRefund.vue'),
  meta: { title: '申请退款', requiresAuth: true }
},
{
  path: '/customer/refunds',
  name: 'RefundList',
  component: () => import('@/views/customer/RefundList.vue'),
  meta: { title: '我的退款', requiresAuth: true }
},
{
  path: '/customer/refund/:id',
  name: 'RefundDetail',
  component: () => import('@/views/customer/RefundDetail.vue'),
  meta: { title: '退款详情', requiresAuth: true }
}
```

### 商家端路由 (merchant)

```javascript
// 在 merchant 路由组下添加
{
  path: '/merchant/refunds',
  name: 'MerchantRefundList',
  component: () => import('@/views/merchant/RefundList.vue'),
  meta: { title: '退款管理', requiresAuth: true }
},
{
  path: '/merchant/refund/:id',
  name: 'MerchantRefundDetail',
  component: () => import('@/views/merchant/RefundDetail.vue'),
  meta: { title: '退款详情', requiresAuth: true }
}
```

## 在订单详情页添加退款入口

在订单详情页面添加"申请退款"按钮：

```vue
<!-- 在订单详情页的操作按钮区域添加 -->
<el-button 
  v-if="order.orderStatus === 2 || order.orderStatus === 3 || order.orderStatus === 4"
  type="warning"
  @click="applyRefund"
>
  申请退款
</el-button>

<script setup>
const applyRefund = () => {
  router.push(`/customer/refund/apply?orderId=${order.id}`)
}
</script>
```

## 在导航菜单中添加入口

### 买家端导航菜单
```javascript
{
  title: '我的退款',
  icon: 'RefundOutlined',
  path: '/customer/refunds'
}
```

### 商家端导航菜单
```javascript
{
  title: '退款管理',
  icon: 'RefundOutlined',
  path: '/merchant/refunds',
  badge: pendingRefundCount // 显示待审核数量
}
```

## 已创建的页面文件

### 买家端
- ✅ `ApplyRefund.vue` - 退款申请页面
- ✅ `RefundList.vue` - 退款列表页面
- ⏳ `RefundDetail.vue` - 退款详情页面（待创建）

### 商家端
- ✅ `RefundList.vue` - 退款列表页面
- ⏳ `RefundDetail.vue` - 退款详情页面（待创建）

## 功能说明

### 买家端功能
1. **申请退款** - 填写退款原因、说明、上传凭证
2. **退款列表** - 查看所有退款申请，按状态筛选
3. **填写物流** - 退货退款时填写退货物流信息
4. **查看详情** - 查看退款详细信息和处理进度

### 商家端功能
1. **退款列表** - 查看所有退款申请，显示待审核数量
2. **审核退款** - 同意或拒绝退款申请
3. **确认收货** - 确认收到买家退回的商品
4. **查看详情** - 查看退款详细信息

## API接口

### 买家端接口
- `POST /refund/apply` - 申请退款
- `POST /refund/{id}/return` - 填写退货物流
- `GET /refund/{id}` - 获取退款详情
- `GET /refund/list` - 获取退款列表

### 商家端接口
- `POST /merchant/refund/{id}/approve` - 审核退款
- `POST /merchant/refund/{id}/confirm-receive` - 确认收货
- `GET /merchant/refund/{id}` - 获取退款详情
- `GET /merchant/refund/list` - 获取退款列表

## 退款流程

### 仅退款流程（未发货）
1. 买家申请退款 → 待审核
2. 商家同意 → 自动退款 → 退款成功
3. 商家拒绝 → 已拒绝

### 退货退款流程（已发货/已收货）
1. 买家申请退款 → 待审核
2. 商家同意 → 已同意
3. 买家填写退货物流 → 退货中
4. 商家确认收货 → 退款中 → 退款成功

## 注意事项

1. 退款申请页面需要从订单详情页传入 `orderId` 参数
2. 图片上传功能需要配置实际的上传接口
3. 退款金额自动从订单中获取，不可修改
4. 退款成功后会自动恢复库存和优惠券
5. 所有操作都会记录日志，可追溯
