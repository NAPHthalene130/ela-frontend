import { createApp } from 'vue';
import StudentPracticeDashboard from './StudentPracticeDashboard.vue';
import StudentIntensivePracticePage from './StudentIntensivePracticePage.vue';
import StudentPracticeSetPage from './StudentPracticeSetPage.vue';

export function mountPracticeDashboard(container) {
  const app = createApp(StudentPracticeDashboard, {
    userType: 'student',
  });

  app.mount(container);
  return app;
}

export function mountIntensivePracticePage(container) {
  const app = createApp(StudentIntensivePracticePage, {
    userType: 'student',
  });

  app.mount(container);
  return app;
}

export function mountPracticeSetPage(container) {
  const app = createApp(StudentPracticeSetPage, {
    userType: 'student',
  });

  app.mount(container);
  return app;
}
