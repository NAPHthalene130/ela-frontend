import './auth.css';
import { ParticleSystem } from './particles.js';
import { login, register, sendVerifyCode } from '../api/auth.js';

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
      <input type="text" id="login-id" placeholder="用户ID" required>
    </div>
    <div class="input-group">
      <input type="password" id="login-password" placeholder="密码" required>
    </div>
    <button type="submit" class="submit-btn">登录</button>
    <div class="toggle-text">
      还没有账号？ <span class="toggle-link" id="to-register">去注册</span>
    </div>
    <div id="login-error-message" class="error-message hidden"></div>
  `;

  // 4. Register Form
  const registerForm = document.createElement('form');
  registerForm.className = 'auth-form hidden';
  registerForm.id = 'register-form';
  registerForm.innerHTML = `
    <h2 class="auth-title">注册</h2>
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
      已有账号？ <span class="toggle-link" id="to-login">去登录</span>
    </div>
    <div id="reg-error-message" class="error-message hidden"></div>
  `;

  authContainer.appendChild(loginForm);
  authContainer.appendChild(registerForm);
  appContainer.appendChild(authContainer);

  // 5. Logic
  const toRegisterBtn = loginForm.querySelector('#to-register');
  const toLoginBtn = registerForm.querySelector('#to-login');
  const sendCodeBtn = registerForm.querySelector('#send-code-btn');
  const emailInput = registerForm.querySelector('#reg-email');
  const regErrorMessage = registerForm.querySelector('#reg-error-message');
  const loginErrorMessage = loginForm.querySelector('#login-error-message');

  // 切换表单
  toRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    regErrorMessage.classList.add('hidden');
    regErrorMessage.textContent = '';
  });

  toLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    loginErrorMessage.classList.add('hidden');
    loginErrorMessage.textContent = '';
  });

  // 邮箱验证逻辑
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  // 发送验证码逻辑
  sendCodeBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    
    if (validateEmail(email)) {
      regErrorMessage.classList.add('hidden');
      regErrorMessage.textContent = '';
      
      try {
        // 调用发送验证码 API
        const res = await sendVerifyCode(email);
        
        if (res.status === 'success') {
          console.log(`验证码已发送至 ${email}`, res);
          // 开始倒计时
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
        } else {
          // 如果 status 不是 success，抛出错误
          throw new Error(res.msg || '发送验证码失败');
        }
        
      } catch (error) {
        regErrorMessage.textContent = error.message || '发送验证码失败，请重试';
        regErrorMessage.classList.remove('hidden');
      }

    } else {
      regErrorMessage.textContent = '邮箱格式不正确';
      regErrorMessage.classList.remove('hidden');
    }
  });

  // 登录逻辑
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = loginForm.querySelector('#login-id').value.trim();
    const password = loginForm.querySelector('#login-password').value.trim();

    try {
      // 这里的 API 调用参数已经更新为 id
      const res = await login({ id, password });
      
      if (res.status === 'success') {
        console.log('登录成功', res);
        alert('登录成功！'); 
        // 登录成功后的跳转逻辑，例如跳转到主页或保存 token
        // localStorage.setItem('token', res.token);
      } else {
        // 如果 status 不是 success，抛出错误
        throw new Error(res.msg || '登录失败');
      }

    } catch (error) {
      loginErrorMessage.textContent = error.message || '登录失败，请检查用户ID或密码';
      loginErrorMessage.classList.remove('hidden');
    }
  });

  // 注册逻辑
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = registerForm.querySelector('#reg-id').value.trim();
    const password = registerForm.querySelector('#reg-password').value.trim();
    const confirmPassword = registerForm.querySelector('#reg-password-confirm').value.trim();
    const email = registerForm.querySelector('#reg-email').value.trim();
    const emailCode = registerForm.querySelector('#reg-email-code').value.trim();

    if (password !== confirmPassword) {
        regErrorMessage.textContent = '两次输入的密码不一致';
        regErrorMessage.classList.remove('hidden');
        return;
    }

    try {
      // 这里的 API 调用参数已经更新为 id 和 emailCode
      const res = await register({ id, password, email, emailCode });
      
      if (res.status === 'success') {
        console.log('注册成功', res);
        alert('注册成功，请登录！');
        // 自动切换到登录页
        toLoginBtn.click();
      } else {
        // 如果 status 不是 success，抛出错误
        throw new Error(res.msg || '注册失败');
      }

    } catch (error) {
      regErrorMessage.textContent = error.message || '注册失败，请重试';
      regErrorMessage.classList.remove('hidden');
    }
  });
}
