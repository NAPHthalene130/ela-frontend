import { createApp } from 'vue';
import Dashboard from './Dashboard.vue';

// 创建 Vue 应用实例
// Create Vue app instance
const app = createApp(Dashboard);

// 挂载到 DOM
// Mount to DOM
// 注意：这里假设 index.html 中有一个 id 为 "app" 的容器
// Note: Assumes there is a container with id "app" in index.html
// 由于主要入口 main.js 会处理挂载逻辑，这里我们导出 app 实例或提供一个挂载函数
// Since main.js handles mounting, we export the app instance or provide a mount function

export function mountDashboard(container) {
  app.mount(container);
}
