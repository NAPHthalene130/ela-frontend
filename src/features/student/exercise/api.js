import { get, post } from '../../../shared/api/httpClient.js';

export async function getPracticeCourses() {
  return get('/practice/courses');
}

export async function getPracticeQuestionPool(course, type) {
  return get('/practice/pool', { course, type });
}

export async function getPracticeQuestionDetail(questionID) {
  return get('/practice/detail', { questionID });
}

export async function getPracticeRecommendation(payload) {
  return post('/practice/recommend', payload);
}

export async function getPracticeSets() {
  return get('/practice/sets');
}

export async function createPracticeSet(payload) {
  return post('/practice/sets/create', payload);
}

export async function deletePracticeSet(payload) {
  return post('/practice/sets/delete', payload);
}

export async function addQuestionToPracticeSet(payload) {
  return post('/practice/sets/add-question', payload);
}

export async function removeQuestionFromPracticeSet(payload) {
  return post('/practice/sets/remove-question', payload);
}

export async function getPracticeSession(setID) {
  return get('/practice/sets/session', { setID });
}
