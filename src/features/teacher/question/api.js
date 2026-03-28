import { get, post } from '../../../shared/api/httpClient.js';

export async function getTeacherQuestionSets(teacherID) {
  return get('/question/set/list', { teacherID });
}

export async function createQuestionSet(name) {
  return post('/question/set/create', { name });
}

export async function renameQuestionSet(setID, name) {
  return post('/question/set/rename', { setID, name });
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

export async function createQuestion(payload) {
  return post('/question/create', payload);
}

export async function addQuestionToSet(setID, questionID) {
  return post('/question/set/add-question', { setID, questionID });
}

export async function removeQuestionFromSet(setID, questionID) {
  return post('/question/set/remove-question', { setID, questionID });
}

export async function deleteQuestionSet(setID) {
  return post('/question/set/delete', { setID });
}
