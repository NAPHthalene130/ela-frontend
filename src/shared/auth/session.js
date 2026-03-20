import { STORAGE_KEYS } from '../constants/storageKeys.js';
import { ROUTES } from '../constants/routes.js';
import { normalizeUserType } from '../constants/userTypes.js';

const AUTH_FAILURE_STATUSES = new Set([401, 422]);

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (!rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser);
    return {
      ...user,
      type: normalizeUserType(user?.type),
    };
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    return null;
  }
}

export function getStoredUserType() {
  const explicitType = localStorage.getItem(STORAGE_KEYS.USER_TYPE);
  if (explicitType) {
    return normalizeUserType(explicitType);
  }

  return normalizeUserType(getStoredUser()?.type);
}

export function getStoredUserId() {
  const user = getStoredUser();
  return user?.id || user?.userId || user?.username || null;
}

export function storeAuthSession({ token, user }) {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  if (!user) {
    return;
  }

  const normalizedUser = {
    ...user,
    type: normalizeUserType(user.type),
  };

  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser));
  localStorage.setItem(STORAGE_KEYS.USER_TYPE, normalizedUser.type);
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.USER_TYPE);
}

export function hasAuthToken() {
  return Boolean(getStoredToken());
}

export function isAuthFailureStatus(status) {
  return AUTH_FAILURE_STATUSES.has(status);
}

export function expireAuthSession(message = '登录状态已失效，请重新登录') {
  clearAuthSession();

  if (
    typeof window !== 'undefined' &&
    window.location.pathname !== ROUTES.AUTH
  ) {
    window.location.href = ROUTES.AUTH;
  }

  return message;
}
