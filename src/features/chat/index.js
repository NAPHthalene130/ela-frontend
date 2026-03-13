import { createApp } from 'vue';
import ChatInterface from './ChatInterface.vue';
import '../../shared/styles/app.css';

// 创建 Vue 应用实例
// Create Vue app instance
const app = createApp(ChatInterface);

// 挂载到 DOM
// Mount to DOM
export function mountChat(container) {
  app.mount(container);
}
