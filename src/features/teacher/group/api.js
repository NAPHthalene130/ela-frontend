import { get, post } from '../../../shared/api/httpClient.js';

export async function getTeacherGroups(teacherID) {
  return get('/group/list', { teacherID });
}

export async function createTeacherGroup(name) {
  return post('/group/create', { name });
}

export async function getGroupStudents(groupID) {
  return get('/group/students', { groupID });
}

export async function addGroupStudent(groupID, studentID) {
  return post('/group/add-student', { groupID, studentID });
}
