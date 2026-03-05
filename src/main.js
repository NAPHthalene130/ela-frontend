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
  } else if (path === '/dashboard') {
    // 动态导入 Vue 模块，避免影响登录页加载速度
    // Dynamically import Vue module to avoid affecting login page load speed
    import('./MainMenu/main.js').then(({ mountDashboard }) => {
      // 清空容器内容
      // Clear container content
      app.innerHTML = '';
      mountDashboard(app);
    }).catch(err => {
      console.error('Failed to load Dashboard:', err);
      app.innerHTML = '<p>Error loading dashboard. Please check console.</p>';
    });
  } else {
    // Handle 404 or other routes if necessary
    // For now, redirect to auth as well
    window.history.replaceState(null, '', '/auth');
    initAuth(app);
  }
}

handleRouting();
