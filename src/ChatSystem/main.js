import { createApp } from 'vue';
import ChatInterface from './ChatInterface.vue';
import '../style.css'; // Import Tailwind styles

// 创建 Vue 应用实例
// Create Vue app instance
const app = createApp(ChatInterface);

// 挂载到 DOM
// Mount to DOM
export function mountChatSystem(container) {
  app.mount(container);
}
