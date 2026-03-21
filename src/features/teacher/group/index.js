import { createApp } from 'vue';
import TeacherGroupPage from './TeacherGroupPage.vue';

export function mountGroup(container) {
  const app = createApp(TeacherGroupPage, {
    userType: 'teacher',
  });

  app.mount(container);
  return app;
}
