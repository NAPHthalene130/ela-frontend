import { USER_TYPES, normalizeUserType } from './userTypes.js';

export const ROUTES = {
  ROOT: '/',
  INDEX: '/index.html',
  AUTH: '/auth',
  MENU: '/menu',
  CHAT: '/chat',
  STUDENT_MENU: '/student/menu',
  STUDENT_CHAT: '/student/chat',
  STUDENT_PRACTICE: '/student/practice',
  STUDENT_EXERCISE: '/student/exercise',
  STUDENT_SETTINGS: '/student/settings',
  STUDENT_EXAM_LIST: '/student/exam-list',
  STUDENT_EXAM_DETAIL: '/student/exam-detail',
  TEACHER_MENU: '/teacher/menu',
  TEACHER_GROUP: '/teacher/group',
  TEACHER_QUESTION: '/teacher/question',
  TEACHER_ASSIGNMENT: '/teacher/assignment',
};

export function getMenuRouteByUserType(userType) {
  return normalizeUserType(userType) === USER_TYPES.TEACHER
    ? ROUTES.TEACHER_MENU
    : ROUTES.STUDENT_MENU;
}

export function getChatRouteByUserType(userType) {
  return normalizeUserType(userType) === USER_TYPES.TEACHER
    ? ROUTES.TEACHER_MENU
    : ROUTES.STUDENT_CHAT;
}
