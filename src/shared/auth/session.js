import { STORAGE_KEYS } from '../constants/storageKeys.js';
import { normalizeUserType } from '../constants/userTypes.js';

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
  return Boolean(localStorage.getItem(STORAGE_KEYS.TOKEN));
}
