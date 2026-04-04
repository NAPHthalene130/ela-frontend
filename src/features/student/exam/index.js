import { createApp } from 'vue';
import StudentExamList from './StudentExamList.vue';
import StudentExamDetail from './StudentExamDetail.vue';

export function mountStudentExamList(container) {
  const app = createApp(StudentExamList, {
    userType: 'student',
  });

  app.mount(container);
  return app;
}

export function mountStudentExamDetail(container) {
  const app = createApp(StudentExamDetail, {
    userType: 'student',
  });

  app.mount(container);
  return app;
}
