# ELA 前端开发维护文档

## 1. 项目概览

- 项目名称：`learning-assistant-frontend`
- 技术栈：Vue 3 + Vite 5
- 主要目标：提供认证、仪表盘和聊天功能的前端界面
- 入口文件：`index.html` -> `src/app/bootstrap.js`

## 2. 目录结构说明

```text
src/
  app/
    bootstrap.js            # 应用入口与路由分发
  features/
    auth/                   # 登录/注册
    dashboard/              # 菜单与仪表盘
    chat/                   # 聊天主界面与聊天接口
  shared/
    api/httpClient.js       # 通用请求封装
    constants/routes.js     # 路由常量
    constants/storageKeys.js# 本地存储键常量
    styles/app.css          # 全局样式
```

## 3. 运行与构建

### 3.1 安装依赖

```bash
npm install
```

### 3.2 本地开发

```bash
npm run dev
```

默认前端地址：

```text
http://127.0.0.1:5173/
```

### 3.3 生产构建

```bash
npm run build
```

### 3.4 本地预览构建产物

```bash
npm run preview
```

## 4. 前后端联调配置

### 4.1 当前联调策略

- 前端请求基础路径默认使用 `/api`
- 开发环境通过 Vite 代理转发到后端 Flask 服务

`vite.config.js` 关键配置：

```js
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
    },
  },
}
```

### 4.2 API 基地址规则

`src/shared/api/httpClient.js`：

- 优先读取 `VITE_API_BASE_URL`
- 未配置时默认 `/api`
- 自动去掉末尾 `/`
- 相对地址自动拼接到 `API_BASE_URL`

可选环境变量示例（按需）：

```text
VITE_API_BASE_URL=/api
```

## 5. 路由与鉴权机制

路由常量定义于 `src/shared/constants/routes.js`：

- `/auth`：认证页
- `/menu`：仪表盘页
- `/chat`：聊天页

在 `src/app/bootstrap.js` 中：

- 无 token 时访问受保护页面会跳转到 `/auth`
- 有 token 访问 `/auth` 会跳转到 `/menu`
- token 存储键由 `STORAGE_KEYS.TOKEN` 统一管理

## 6. 核心模块说明

### 6.1 auth 模块

- 文件：`src/features/auth/index.js`
- 功能：登录、注册、邮箱验证码发送、登录成功后写入 token 与用户信息

### 6.2 dashboard 模块

- 文件：`src/features/dashboard/DashboardPage.vue`
- 功能：显示用户信息、模块入口与通知状态

### 6.3 chat 模块

- 文件：`src/features/chat/ChatInterface.vue`
- API：`src/features/chat/api.js`
- 功能：历史会话加载、创建会话、删除会话、流式聊天响应

## 7. 常见问题排查

### 7.1 前端请求后端无响应

按以下顺序检查：

1. 后端是否启动在 `127.0.0.1:5000`
2. 前端是否通过 `npm run dev` 启动
3. `vite.config.js` 是否包含 `/api` 代理
4. 浏览器 Network 中请求是否命中 `/api/...`
5. 请求头是否包含 `Authorization: Bearer <token>`

### 7.2 接口返回 401

- 通常表示 token 缺失、过期或无效
- 重新登录并确认 `localStorage` 中存在 `token`

### 7.3 聊天流式失败

- 检查后端 `/api/chat/stream` 是否可访问
- 检查后端模型配置与相关依赖是否可用

## 8. 开发维护建议

- 新增页面优先放入 `src/features/<feature-name>/`
- 通用常量统一放到 `src/shared/constants/`
- 新增接口优先复用 `src/shared/api/httpClient.js`
- 避免在业务代码中硬编码路由和 localStorage key
- 提交前至少执行一次 `npm run build`

## 9. 后续可优化方向

- 增加 lint 与 typecheck 脚本，统一质量门禁
- 增加 `.env.development` 与 `.env.production` 环境配置
- 为关键 API 增加统一错误码映射与重试策略
