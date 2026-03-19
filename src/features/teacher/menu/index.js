import { createApp } from 'vue';
import TeacherMenuPage from './TeacherMenuPage.vue';

export function mountMenu(container) {
  const app = createApp(TeacherMenuPage, {
    userType: 'teacher',
  });

  app.mount(container);
  return app;
}
