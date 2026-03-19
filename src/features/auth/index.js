import './auth.css';
import { login, register, sendVerifyCode } from './api.js';
import { ParticleSystem } from './particles.js';
import { storeAuthSession } from '../../shared/auth/session.js';
import { getMenuRouteByUserType } from '../../shared/constants/routes.js';
import { USER_TYPES } from '../../shared/constants/userTypes.js';

function hideMessage(messageNode) {
  messageNode.textContent = '';
  messageNode.classList.add('hidden');
}

function showMessage(messageNode, message) {
  messageNode.textContent = message;
  messageNode.classList.remove('hidden');
}

function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(String(email).toLowerCase());
}

export function initAuth(appContainer) {
  appContainer.innerHTML = '';

  if (!document.getElementById('particles-canvas')) {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    new ParticleSystem(canvas);
  }

  const authWrapper = document.createElement('div');
  authWrapper.className = 'auth-wrapper';

  const authContainer = document.createElement('div');
  authContainer.className = 'auth-container';

  const loginForm = document.createElement('form');
  loginForm.className = 'auth-form';
  loginForm.id = 'login-form';
  loginForm.innerHTML = `
    <h2 class="auth-title">登录</h2>
    <div class="input-group">
      <input type="text" id="login-id" placeholder="用户ID" required>
    </div>
    <div class="input-group">
      <input type="password" id="login-password" placeholder="密码" required>
    </div>
    <button type="submit" class="submit-btn">登录</button>
    <div class="toggle-text">
      还没有账号？<span class="toggle-link" id="to-register">去注册</span>
    </div>
    <div id="login-error-message" class="error-message hidden"></div>
  `;

  const registerForm = document.createElement('form');
  registerForm.className = 'auth-form hidden';
  registerForm.id = 'register-form';
  registerForm.innerHTML = `
    <h2 class="auth-title">注册</h2>
    <div class="user-type-group">
      <span class="group-label">注册身份</span>
      <div class="type-options">
        <label class="type-option">
          <input type="radio" name="reg-type" value="${USER_TYPES.STUDENT}" checked>
          <span>我是学生</span>
        </label>
        <label class="type-option">
          <input type="radio" name="reg-type" value="${USER_TYPES.TEACHER}">
          <span>我是老师</span>
        </label>
      </div>
    </div>
    <div class="input-group">
      <input type="text" id="reg-id" placeholder="用户ID" required>
    </div>
    <div class="input-group">
      <input type="password" id="reg-password" placeholder="密码" required>
    </div>
    <div class="input-group">
      <input type="password" id="reg-password-confirm" placeholder="确认密码" required>
    </div>
    <div class="input-group">
      <input type="email" id="reg-email" placeholder="邮箱" required>
    </div>
    <div class="input-group verify-group">
      <input type="text" id="reg-email-code" placeholder="邮箱验证码" required>
      <button type="button" id="send-code-btn" class="code-btn">发送验证码</button>
    </div>
    <button type="submit" class="submit-btn">注册</button>
    <div class="toggle-text">
      已有账号？<span class="toggle-link" id="to-login">去登录</span>
    </div>
    <div id="reg-error-message" class="error-message hidden"></div>
  `;

  authContainer.appendChild(loginForm);
  authContainer.appendChild(registerForm);
  authWrapper.appendChild(authContainer);
  appContainer.appendChild(authWrapper);

  const toRegisterBtn = loginForm.querySelector('#to-register');
  const toLoginBtn = registerForm.querySelector('#to-login');
  const sendCodeBtn = registerForm.querySelector('#send-code-btn');
  const emailInput = registerForm.querySelector('#reg-email');
  const regErrorMessage = registerForm.querySelector('#reg-error-message');
  const loginErrorMessage = loginForm.querySelector('#login-error-message');

  toRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    hideMessage(loginErrorMessage);
    hideMessage(regErrorMessage);
  });

  toLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    hideMessage(loginErrorMessage);
    hideMessage(regErrorMessage);
  });

  sendCodeBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!validateEmail(email)) {
      showMessage(regErrorMessage, '邮箱格式不正确');
      return;
    }

    hideMessage(regErrorMessage);

    try {
      const response = await sendVerifyCode(email);
      if (response.status !== 'success') {
        throw new Error(response.msg || '发送验证码失败');
      }

      sendCodeBtn.disabled = true;
      let countdown = 60;
      sendCodeBtn.textContent = `${countdown}s`;

      const timer = window.setInterval(() => {
        countdown -= 1;
        sendCodeBtn.textContent = `${countdown}s`;
        if (countdown <= 0) {
          window.clearInterval(timer);
          sendCodeBtn.disabled = false;
          sendCodeBtn.textContent = '发送验证码';
        }
      }, 1000);
    } catch (error) {
      showMessage(regErrorMessage, error.message || '发送验证码失败，请重试');
    }
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = loginForm.querySelector('#login-id').value.trim();
    const password = loginForm.querySelector('#login-password').value.trim();

    hideMessage(loginErrorMessage);

    try {
      const response = await login({ id, password });
      if (response.status !== 'success') {
        throw new Error(response.msg || '登录失败');
      }

      storeAuthSession({
        token: response.token,
        user: response.user,
      });

      window.location.href = getMenuRouteByUserType(response.user?.type);
    } catch (error) {
      showMessage(loginErrorMessage, error.message || '登录失败，请检查用户ID或密码');
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = registerForm.querySelector('#reg-id').value.trim();
    const password = registerForm.querySelector('#reg-password').value.trim();
    const confirmPassword = registerForm.querySelector('#reg-password-confirm').value.trim();
    const email = registerForm.querySelector('#reg-email').value.trim();
    const emailCode = registerForm.querySelector('#reg-email-code').value.trim();
    const userType =
      registerForm.querySelector('input[name="reg-type"]:checked')?.value ||
      USER_TYPES.STUDENT;

    if (password !== confirmPassword) {
      showMessage(regErrorMessage, '两次输入的密码不一致');
      return;
    }

    hideMessage(regErrorMessage);

    try {
      const response = await register({
        id,
        password,
        email,
        emailCode,
        type: userType,
      });

      if (response.status !== 'success') {
        throw new Error(response.msg || '注册失败');
      }

      window.alert('注册成功，请登录');
      toLoginBtn.click();
    } catch (error) {
      showMessage(regErrorMessage, error.message || '注册失败，请重试');
    }
  });
}
