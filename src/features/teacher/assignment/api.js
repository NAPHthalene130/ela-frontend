import { get, post } from '../../../shared/api/httpClient.js';

export async function getTeacherAssignments(teacherID) {
  return get('/assignment/list', { teacherID });
}

export async function createTeacherAssignment(payload) {
  return post('/assignment/create', payload);
}

export async function getAssignmentStudentAnswers(assignmentID, studentID) {
  return get('/assignment/student-answers', { assignmentID, studentID });
}
