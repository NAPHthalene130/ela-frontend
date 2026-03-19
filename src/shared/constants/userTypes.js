export const USER_TYPES = Object.freeze({
  STUDENT: 'student',
  TEACHER: 'teacher',
});

export function normalizeUserType(userType) {
  return userType === USER_TYPES.TEACHER
    ? USER_TYPES.TEACHER
    : USER_TYPES.STUDENT;
}

export function getUserTypeLabel(userType) {
  return normalizeUserType(userType) === USER_TYPES.TEACHER ? '老师' : '学生';
}
