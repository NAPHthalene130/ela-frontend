import { initAuth } from './auth/auth.js';

const app = document.querySelector('#app');

// Simple routing logic
function handleRouting() {
  const path = window.location.pathname;
  
  if (path === '/' || path === '/index.html') {
    window.history.replaceState(null, '', '/auth');
    handleRouting(); // Re-run routing logic for /auth
  } else if (path === '/auth') {
    // 如果已登录，跳转到 Dashboard
    const token = localStorage.getItem('token');
    if (token) {
      window.history.replaceState(null, '', '/menu');
      handleRouting();
      return;
    }
    initAuth(app);
  } else if (path === '/menu') {
    // 检查是否已登录
    const token = localStorage.getItem('token');
    if (!token) {
      window.history.replaceState(null, '', '/auth');
      initAuth(app);
      return;
    }

    // 动态导入 Vue 模块，避免影响登录页加载速度
    // Dynamically import Vue module to avoid affecting login page load speed
    import('./menu/main.js').then(({ mountDashboard }) => {
      // Clear container content
      app.innerHTML = '';
      
      // Remove auth particles if they exist
      const authParticles = document.getElementById('particles-canvas');
      if (authParticles) authParticles.remove();
      
      mountDashboard(app);
    }).catch(err => {
      console.error('Failed to load Menu:', err);
      app.innerHTML = '<p>Error loading menu. Please check console.</p>';
    });
  } else {
    // Handle 404 or other routes if necessary
    // For now, redirect to auth as well
    window.history.replaceState(null, '', '/auth');
    initAuth(app);
  }
}

handleRouting();
