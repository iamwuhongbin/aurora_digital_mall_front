# 极光数码商城 - 前端项目

## 📋 项目说明

这是极光数码商城的前端项目，采用 Vue 3 + TypeScript + Vite + Element Plus 构建。

## 🚀 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
frontend/
├── src/
│   ├── api/              # API接口
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia状态管理
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   │   ├── customer/     # 用户端页面
│   │   ├── merchant/     # 商家端页面
│   │   └── admin/        # 管理端页面
│   ├── App.vue           # 根组件
│   ├── main.ts           # 入口文件
│   └── style.css         # 全局样式
├── index.html            # HTML模板
├── package.json          # 依赖配置
├── tsconfig.json         # TypeScript配置
└── vite.config.ts        # Vite配置
```

## 🎯 三端系统

### 用户端 (Customer)
- 首页
- 商品列表
- 商品详情
- 购物车
- 订单管理
- 个人中心

### 商家端 (Merchant)
- 数据看板
- 商品管理
- 订单管理
- 评价管理

### 管理端 (Admin)
- 数据看板
- 商家管理
- 商品审核
- 用户管理

## 🔧 技术栈

- **框架**: Vue 3.4
- **语言**: TypeScript 5.3
- **构建工具**: Vite 5.0
- **UI组件库**: Element Plus 2.5
- **路由**: Vue Router 4.2
- **状态管理**: Pinia 2.1
- **HTTP客户端**: Axios 1.6

## 📝 开发规范

### 组件命名
- 使用 PascalCase
- 文件名与组件名一致

### API调用
- 统一使用 `src/api` 目录下的接口
- 使用 `src/utils/request.ts` 封装的axios实例

### 状态管理
- 使用 Pinia 进行状态管理
- Store 文件放在 `src/stores` 目录

### 路由配置
- 路由配置在 `src/router/index.ts`
- 使用懒加载优化性能

## 🔑 环境变量

创建 `.env.development` 文件：

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## 📞 后端API

后端API地址：http://localhost:8080/api
API文档：http://localhost:8080/api/doc.html

## 🎨 UI设计

- 使用 Element Plus 组件库
- 响应式设计，支持移动端
- 统一的色彩方案和间距

## ⚠️ 注意事项

1. **TypeScript错误**: 在安装依赖前会有很多TypeScript错误，这是正常的
2. **先安装依赖**: 运行 `npm install` 安装所有依赖包
3. **后端服务**: 确保后端服务已启动（端口8080）
4. **跨域配置**: Vite已配置代理，开发时无需担心跨域问题

## 📦 下一步

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`
3. 开始开发页面组件

---

**开发状态**: 项目结构已创建，等待安装依赖后开始页面开发
