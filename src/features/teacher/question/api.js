import { get } from '../../../shared/api/httpClient.js';

export async function getTeacherQuestionSets(teacherID) {
  return get('/question/set/list', { teacherID });
}

export async function getQuestionSetQuestions(setID) {
  return get('/question/set/questions', { setID });
}
