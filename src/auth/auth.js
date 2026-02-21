import './auth.css';
import { ParticleSystem } from './particles.js';

export function initAuth(appContainer) {
  // Clear container first to prevent duplicates on re-init
  appContainer.innerHTML = '';
  
  // 1. Setup Particles Canvas (only if not exists)
  if (!document.getElementById('particles-canvas')) {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    new ParticleSystem(canvas);
  }

  // 2. Create Auth Container
  const authContainer = document.createElement('div');
  authContainer.className = 'auth-container';

  // 3. Login Form
  const loginForm = document.createElement('form');
  loginForm.className = 'auth-form';
  loginForm.id = 'login-form';
  loginForm.innerHTML = `
    <h2 class="auth-title">登录</h2>
    <div class="input-group">
      <input type="text" placeholder="账号" required>
    </div>
    <div class="input-group">
      <input type="password" placeholder="密码" required>
    </div>
    <button type="submit" class="submit-btn">登录</button>
    <div class="toggle-text">
      还没有账号？ <span class="toggle-link" id="to-register">去注册</span>
    </div>
  `;

  // 4. Register Form
  const registerForm = document.createElement('form');
  registerForm.className = 'auth-form hidden';
  registerForm.id = 'register-form';
  registerForm.innerHTML = `
    <h2 class="auth-title">注册</h2>
    <div class="input-group">
      <input type="text" placeholder="账号" required>
    </div>
    <div class="input-group">
      <input type="password" placeholder="密码" required>
    </div>
    <div class="input-group">
      <input type="password" placeholder="确认密码" required>
    </div>
    <div class="input-group">
      <input type="email" id="reg-email" placeholder="邮箱" required>
    </div>
    <div class="input-group verify-group">
      <input type="text" placeholder="验证码" required>
      <button type="button" id="send-code-btn" class="code-btn">发送验证码</button>
    </div>
    <button type="submit" class="submit-btn">注册</button>
    <div class="toggle-text">
      已有账号？ <span class="toggle-link" id="to-login">去登录</span>
    </div>
    <div id="error-message" class="error-message hidden"></div>
  `;

  authContainer.appendChild(loginForm);
  authContainer.appendChild(registerForm);
  appContainer.appendChild(authContainer);

  // 5. Logic
  const toRegisterBtn = loginForm.querySelector('#to-register');
  const toLoginBtn = registerForm.querySelector('#to-login');
  const sendCodeBtn = registerForm.querySelector('#send-code-btn');
  const emailInput = registerForm.querySelector('#reg-email');
  const errorMessage = registerForm.querySelector('#error-message');

  toRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    errorMessage.classList.add('hidden'); // Clear error on switch
  });

  toLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  // Email Validation Logic
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  // Send Code Logic
  sendCodeBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    
    if (validateEmail(email)) {
      errorMessage.classList.add('hidden');
      errorMessage.textContent = '';
      
      // Simulate sending code
      sendCodeBtn.disabled = true;
      let countdown = 60;
      sendCodeBtn.textContent = `${countdown}s`;
      
      const timer = setInterval(() => {
        countdown--;
        sendCodeBtn.textContent = `${countdown}s`;
        if (countdown <= 0) {
          clearInterval(timer);
          sendCodeBtn.disabled = false;
          sendCodeBtn.textContent = '发送验证码';
        }
      }, 1000);

      console.log(`Sending code to ${email}`);
      // API call would go here
    } else {
      errorMessage.textContent = '邮箱格式不正确';
      errorMessage.classList.remove('hidden');
    }
  });

  // Prevent default submission for now
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Login submitted');
    // Add actual login logic here
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Register submitted');
    // Add actual register logic here
  });
}
