import { get } from '../../../shared/api/httpClient.js';

export async function getTeacherQuestionSets(teacherID) {
  return get('/question/set/list', { teacherID });
}

export async function getQuestionSetQuestions(setID) {
  return get('/question/set/questions', { setID });
}

export async function getCourseOptions() {
  return get('/chat/courses');
}

export async function getQuestionPool(course, type) {
  return get('/question/pool', { course, type });
}

export async function getQuestionDetail(questionID) {
  return get('/question/detail', { questionID });
}
