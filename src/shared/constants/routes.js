import { USER_TYPES, normalizeUserType } from './userTypes.js';

export const ROUTES = {
  ROOT: '/',
  INDEX: '/index.html',
  AUTH: '/auth',
  MENU: '/menu',
  CHAT: '/chat',
  STUDENT_MENU: '/student/menu',
  STUDENT_CHAT: '/student/chat',
  TEACHER_MENU: '/teacher/menu',
  TEACHER_CHAT: '/teacher/chat',
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
