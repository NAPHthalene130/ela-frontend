import { createApp } from 'vue';
import ChatInterface from './ChatInterface.vue';
import '../../../shared/styles/app.css';

export function mountChat(container) {
  const app = createApp(ChatInterface, {
    userType: 'student',
  });

  app.mount(container);
  return app;
}
