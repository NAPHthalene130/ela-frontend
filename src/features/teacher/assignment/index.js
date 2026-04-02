import { createApp } from 'vue';
import TeacherAssignmentPage from './TeacherAssignmentPage.vue';

export function mountAssignment(container) {
  const app = createApp(TeacherAssignmentPage, {
    userType: 'teacher',
  });

  app.mount(container);
  return app;
}
