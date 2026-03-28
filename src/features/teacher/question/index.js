import { createApp } from 'vue';
import TeacherQuestionPage from './TeacherQuestionPage.vue';

export function mountQuestion(container) {
  const app = createApp(TeacherQuestionPage, {
    userType: 'teacher',
  });

  app.mount(container);
  return app;
}
