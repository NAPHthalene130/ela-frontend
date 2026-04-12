<template>
  <div class="settings-page">
    <canvas ref="particleCanvas" class="particle-background"></canvas>

    <main class="main-content">
      <section class="content-panel">
        <h1>系统设置</h1>
        <div class="account-card">
          <p class="account-label">当前用户</p>
          <p class="account-id">{{ userId || '未获取到ID' }}</p>
          <button class="logout-btn" type="button" @click="logout">退出登录</button>
        </div>
      </section>
    </main>

    <button class="back-btn" type="button" @click="goBackToMenu">返回菜单</button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { ROUTES } from '../../../shared/constants/routes.js';
import {
  clearAuthSession,
  getStoredUser,
  getStoredUserId,
} from '../../../shared/auth/session.js';

const particleCanvas = ref(null);
const userId = ref('');

let animationFrameId = null;
let cleanupParticles = null;

const initParticles = () => {
  const canvas = particleCanvas.value;
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  const particles = [];

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.size = Math.random() * 2 + 0.5;
      this.alpha = Math.random() * 0.3 + 0.1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
    }

    draw() {
      ctx.fillStyle = `rgba(200, 220, 255, ${this.alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let index = 0; index < 60; index += 1) {
    particles.push(new Particle());
  }

  const animate = () => {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((particle) => {
      particle.update();
      particle.draw();
    });
    animationFrameId = requestAnimationFrame(animate);
  };

  animate();

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
};

onMounted(() => {
  cleanupParticles = initParticles();
  const directId = getStoredUserId();
  if (directId) {
    userId.value = directId;
    return;
  }
  const storedUser = getStoredUser();
  userId.value =
    storedUser?.id ||
    storedUser?.userId ||
    storedUser?.username ||
    '';
});

onUnmounted(() => {
  if (cleanupParticles) cleanupParticles();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

const goBackToMenu = () => {
  window.location.href = ROUTES.STUDENT_MENU;
};

const logout = () => {
  clearAuthSession();
  window.location.href = ROUTES.AUTH;
};
</script>

<style scoped>
.settings-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #eef3ff;
  background: linear-gradient(135deg, #1a1c29 0%, #141826 55%, #0f1016 100%);
}

.particle-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.main-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.content-panel {
  width: 100%;
  max-width: 680px;
  padding: 40px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  text-align: center;
}

h1 {
  margin: 0;
  font-size: clamp(30px, 3.2vw, 42px);
  line-height: 1.06;
}

.account-card {
  margin-top: 22px;
  padding: 26px 24px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}

.account-label {
  margin: 0;
  font-size: 13px;
  color: rgba(219, 234, 254, 0.88);
  letter-spacing: 0.08em;
}

.account-id {
  margin: 0;
  font-size: clamp(24px, 4vw, 34px);
  font-weight: 700;
  color: #f8fbff;
  word-break: break-all;
}

.logout-btn {
  padding: 10px 18px;
  border: 1px solid #b91c1c;
  border-radius: 10px;
  background: #dc2626;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.logout-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.back-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10;
  padding: 10px 18px;
  border: 1px solid rgba(122, 162, 255, 0.55);
  border-radius: 10px;
  background: rgba(122, 162, 255, 0.35);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.back-btn:hover {
  background: rgba(122, 162, 255, 0.5);
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .content-panel {
    padding: 24px;
    border-radius: 24px;
  }
}
</style>
