<template>
  <div class="settings-page">
    <canvas ref="particleCanvas" class="particle-background"></canvas>

    <main class="main-content">
      <section class="content-panel">
        <p class="panel-kicker">Student Settings</p>
        <h1>系统设置</h1>
        <p class="panel-copy">当前为学生端系统设置占位页，后续可在这里接入账号信息、偏好配置与通知管理。</p>
        <div class="status-card">
          <span class="status-badge">即将开放</span>
          <p>系统设置模块正在规划中，当前可先返回主菜单继续使用学习对话、练习系统和考试系统。</p>
        </div>
      </section>
    </main>

    <button class="back-btn" type="button" @click="goBackToMenu">返回菜单</button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { ROUTES } from '../../../shared/constants/routes.js';

const particleCanvas = ref(null);

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
});

onUnmounted(() => {
  if (cleanupParticles) cleanupParticles();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

const goBackToMenu = () => {
  window.location.href = ROUTES.STUDENT_MENU;
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
  max-width: 920px;
  padding: 40px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
}

.panel-kicker {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #9db3ff;
}

h1 {
  margin: 0;
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1.06;
}

.panel-copy {
  margin: 16px 0 0;
  color: rgba(255, 255, 255, 0.74);
  font-size: 16px;
  line-height: 1.7;
}

.status-card {
  margin-top: 28px;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
}

.status-card p {
  margin: 14px 0 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
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
