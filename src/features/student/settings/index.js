import { createApp } from 'vue';
import StudentSettingsPage from './StudentSettingsPage.vue';

export function mountSettings(container) {
  const app = createApp(StudentSettingsPage, {
    userType: 'student',
  });

  app.mount(container);
  return app;
}
