import { createApp } from 'vue';
import DashboardPage from '../dashboard/DashboardPage.vue';

export function mountMenu(container) {
  const app = createApp(DashboardPage, {
    userType: 'student',
  });

  app.mount(container);
  return app;
}
