import { get } from '../../../shared/api/httpClient.js';

export async function getTeacherGroups(teacherID) {
  return get('/group/list', { teacherID });
}
