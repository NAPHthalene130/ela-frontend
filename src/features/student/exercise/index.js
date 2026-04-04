import { createApp } from 'vue';
import StudentPracticeDashboard from './StudentPracticeDashboard.vue';

export function mountPracticeDashboard(container) {
  const app = createApp(StudentPracticeDashboard, {
    userType: 'student',
  });

  app.mount(container);
  return app;
}
