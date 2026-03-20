import { initAuth } from '../features/auth/index.js';
import { getCurrentUser } from '../features/auth/api.js';
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  getStoredUserType,
  storeAuthSession,
} from '../shared/auth/session.js';
import {
  ROUTES,
  getChatRouteByUserType,
  getMenuRouteByUserType,
} from '../shared/constants/routes.js';
import { USER_TYPES } from '../shared/constants/userTypes.js';

const appContainer = document.querySelector('#app');
let mountedVueApp = null;
let hasAttemptedSessionRestore = false;
let sessionRestorePromise = null;
let restoredUser = null;

function cleanupParticles() {
  const authParticles = document.getElementById('particles-canvas');
  if (authParticles) {
    authParticles.remove();
  }
}

function clearMountedView() {
  if (mountedVueApp) {
    mountedVueApp.unmount();
    mountedVueApp = null;
  }

  appContainer.innerHTML = '';
}

function redirect(path) {
  if (window.location.pathname !== path) {
    window.history.replaceState(null, '', path);
  }
}

async function mountAuth() {
  clearMountedView();
  initAuth(appContainer);
}

async function restoreAuthSession() {
  if (hasAttemptedSessionRestore) {
    return restoredUser;
  }

  if (sessionRestorePromise) {
    return sessionRestorePromise;
  }

  const token = getStoredToken();
  if (!token) {
    hasAttemptedSessionRestore = true;
    restoredUser = null;
    return null;
  }

  sessionRestorePromise = (async () => {
    try {
      const response = await getCurrentUser();
      if (response.status !== 'success' || !response.user) {
        throw new Error(response.msg || 'Failed to restore auth session');
      }

      storeAuthSession({
        token,
        user: response.user,
      });
      restoredUser = response.user;
      return restoredUser;
    } catch (error) {
      console.error('Failed to restore auth session:', error);

      if (error?.isAuthFailure || error?.status === 404) {
        clearAuthSession();
        restoredUser = null;
        return null;
      }

      restoredUser = getStoredUser();
      return restoredUser;
    } finally {
      hasAttemptedSessionRestore = true;
      sessionRestorePromise = null;
    }
  })();

  return sessionRestorePromise;
}

async function mountRoleMenu(userType) {
  clearMountedView();
  cleanupParticles();

  const module =
    userType === USER_TYPES.TEACHER
      ? await import('../features/teacher/menu/index.js')
      : await import('../features/student/menu/index.js');

  mountedVueApp = module.mountMenu(appContainer);
}

async function mountRoleChat(userType) {
  clearMountedView();
  cleanupParticles();

  const module = await import('../features/student/chat/index.js');

  mountedVueApp = module.mountChat(appContainer);
}

async function handleRouting() {
  const path = window.location.pathname;
  const user = await restoreAuthSession();
  const authenticated = Boolean(getStoredToken() && user);
  const userType = getStoredUserType();
  const menuRoute = getMenuRouteByUserType(userType);
  const chatRoute = getChatRouteByUserType(userType);

  if (path === ROUTES.ROOT || path === ROUTES.INDEX) {
    redirect(ROUTES.AUTH);
    await handleRouting();
    return;
  }

  if (!authenticated) {
    if (path !== ROUTES.AUTH) {
      redirect(ROUTES.AUTH);
    }
    await mountAuth();
    return;
  }

  if (path === ROUTES.AUTH) {
    redirect(menuRoute);
    await handleRouting();
    return;
  }

  if (path === ROUTES.MENU) {
    redirect(menuRoute);
    await handleRouting();
    return;
  }

  if (path === ROUTES.CHAT) {
    redirect(chatRoute);
    await handleRouting();
    return;
  }

  if (path === ROUTES.STUDENT_MENU || path === ROUTES.TEACHER_MENU) {
    if (path !== menuRoute) {
      redirect(menuRoute);
      await handleRouting();
      return;
    }

    try {
      await mountRoleMenu(userType);
    } catch (error) {
      console.error('Failed to load menu:', error);
      appContainer.innerHTML = '<p>Error loading menu. Please check console.</p>';
    }
    return;
  }

  if (path === ROUTES.STUDENT_CHAT) {
    if (path !== chatRoute) {
      redirect(chatRoute);
      await handleRouting();
      return;
    }

    try {
      await mountRoleChat(userType);
    } catch (error) {
      console.error('Failed to load chat system:', error);
      appContainer.innerHTML = '<p>Error loading chat system. Please check console.</p>';
    }
    return;
  }

  redirect(menuRoute);
  await handleRouting();
}

handleRouting();
