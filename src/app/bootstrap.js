import { initAuth } from '../features/auth/index.js';
import { ROUTES } from '../shared/constants/routes.js';
import { STORAGE_KEYS } from '../shared/constants/storageKeys.js';

const appContainer = document.querySelector('#app');

// Simple routing logic
async function mountDashboard() {
  const { mountDashboard } = await import('../features/dashboard/index.js');
  appContainer.innerHTML = '';
  const authParticles = document.getElementById('particles-canvas');
  if (authParticles) {
    authParticles.remove();
  }
  mountDashboard(appContainer);
}

async function mountChat() {
  const { mountChat } = await import('../features/chat/index.js');
  appContainer.innerHTML = '';
  const authParticles = document.getElementById('particles-canvas');
  if (authParticles) {
    authParticles.remove();
  }
  mountChat(appContainer);
}

function redirect(path) {
  window.history.replaceState(null, '', path);
}

async function handleRouting() {
  const path = window.location.pathname;

  if (path === ROUTES.ROOT || path === ROUTES.INDEX) {
    redirect(ROUTES.AUTH);
    await handleRouting();
  } else if (path === ROUTES.AUTH) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      redirect(ROUTES.MENU);
      await handleRouting();
      return;
    }
    initAuth(appContainer);
  } else if (path === ROUTES.MENU) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      redirect(ROUTES.AUTH);
      initAuth(appContainer);
      return;
    }
    try {
      await mountDashboard();
    } catch (error) {
      console.error('Failed to load menu:', error);
      appContainer.innerHTML = '<p>Error loading menu. Please check console.</p>';
    }
  } else if (path === ROUTES.CHAT) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      redirect(ROUTES.AUTH);
      initAuth(appContainer);
      return;
    }
    try {
      await mountChat();
    } catch (error) {
      console.error('Failed to load chat system:', error);
      appContainer.innerHTML = '<p>Error loading chat system. Please check console.</p>';
    }
  } else {
    redirect(ROUTES.AUTH);
    initAuth(appContainer);
  }
}

handleRouting();
