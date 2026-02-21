import { initAuth } from './auth/auth.js';

const app = document.querySelector('#app');

// Simple routing logic
function handleRouting() {
  const path = window.location.pathname;
  
  if (path === '/' || path === '/index.html') {
    window.history.replaceState(null, '', '/auth');
    initAuth(app);
  } else if (path === '/auth') {
    initAuth(app);
  } else {
    // Handle 404 or other routes if necessary
    // For now, redirect to auth as well
    window.history.replaceState(null, '', '/auth');
    initAuth(app);
  }
}

handleRouting();
