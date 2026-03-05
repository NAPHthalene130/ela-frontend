<template>
  <div class="dashboard-container">
    <canvas ref="particleCanvas" class="particle-background"></canvas>
    <header class="top-bar glass-panel">
      <div class="user-info" v-if="userInfo">
        <img :src="userInfo.avatarUrl" alt="用户头像" class="avatar" />
        <div class="user-meta">
          <div class="name-row">
            <span class="username">{{ userInfo.username }}</span>
            <span class="role-badge">{{ userInfo.role }}</span>
          </div>
          <div class="progress-row">
            <span class="level-text">Lv.{{ levelInfo.level }}</span>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${levelInfo.progress}%` }"></div>
            </div>
            <span class="progress-text">{{ levelInfo.progress }}%</span>
          </div>
          <div class="streak-row">🔥 连续打卡 {{ levelInfo.streakDays }} 天</div>
        </div>
      </div>
      <button @click="handleNavigation('settings')" class="icon-btn">⚙️ 设置</button>
    </header>

    <main class="main-content">
      <!-- 第一列：问答系统 (最大) -->
      <article class="menu-card qa-card" @click="handleNavigation('qa')">
        <div class="card-content">
          <h1>问答系统</h1>
          <p>智能解惑，随时提问</p>
          <small class="meta-text">今日已提问 5 次 · 1 个回答已更新</small>
        </div>
        <div class="qa-watermark">💡</div>
      </article>

      <!-- 第二列：习题系统与考试系统 (垂直排列) -->
      <div class="right-column">
        <article class="menu-card side-card exercises-card" @click="handleNavigation('exercises')">
          <div class="card-content">
            <h3>习题系统</h3>
            <p>每日一练，巩固基础</p>
            <small class="meta-text">已生成 12 套个性练习</small>
          </div>
        </article>

        <article class="menu-card side-card exam-card" @click="handleNavigation('exam')">
          <span class="exam-badge">2 场待考</span>
          <span v-if="notifications.examPending" class="notification-dot"></span>
          <div class="card-content">
            <h3>考试系统</h3>
            <p>模拟实战，检验成果</p>
            <small class="meta-text">建议本周完成冲刺测评</small>
          </div>
        </article>
      </div>
    </main>

    <footer class="bottom-bar">
      <div class="left-actions">
        <button @click="handleNavigation('favorites')" class="action-btn">
          <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>收藏</span>
        </button>
        <button @click="handleNavigation('notes')" class="action-btn">
          <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>备注</span>
        </button>
      </div>
      
      <button @click="handleNavigation('records')" class="action-btn record-btn">
        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>学习记录</span>
      </button>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { getLearningRecords, getSystemNotifications, getUserInfo } from './api';

const userInfo = ref(null);
const notifications = ref({
  studyGroupUnread: false,
  examPending: false
});
const levelInfo = ref({
  level: 3,
  progress: 70,
  streakDays: 7
});

const particleCanvas = ref(null);
let animationFrameId = null;

const initParticles = () => {
  const canvas = particleCanvas.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 60; // Low count for subtle effect

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.3; // Slow velocity
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

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  const animate = () => {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
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

let cleanupParticles = null;

onMounted(async () => {
  cleanupParticles = initParticles();
  try {
    const userRes = await getUserInfo();
    if (userRes.code === 200) {
      userInfo.value = userRes.data;
    }

    await getLearningRecords({ year: new Date().getFullYear() });

    const notifRes = await getSystemNotifications();
    if (notifRes.code === 200) {
      notifications.value = notifRes.data;
    }
  } catch (error) {
    console.error('Dashboard data load failed:', error);
  }
});

onUnmounted(() => {
  if (cleanupParticles) cleanupParticles();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

const handleNavigation = routeName => {
  console.log(`Navigating to: ${routeName}`);
};
</script>

<style scoped>
.dashboard-container {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  padding: 2vh 3vw;
  box-sizing: border-box;
  overflow: hidden;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #eef3ff;
  background: linear-gradient(135deg, #1a1c29 0%, #141826 55%, #0f1016 100%);
  background-size: 220% 220%;
  animation: ambientBg 16s ease infinite;
}

@keyframes ambientBg {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.particle-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.top-bar,
.main-content,
.bottom-bar {
  position: relative;
  z-index: 1;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.top-bar {
  min-height: 96px;
  border-radius: 16px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.18);
}

.user-meta {
  min-width: 260px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 7px;
}

.username {
  font-size: 18px;
  font-weight: 600;
  color: #f2f6ff;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: #c7d5ff;
  background: rgba(116, 146, 255, 0.2);
  border: 1px solid rgba(160, 181, 255, 0.28);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.level-text,
.progress-text {
  font-size: 12px;
  color: rgba(223, 232, 255, 0.82);
}

.progress-track {
  width: 140px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #65e0be 0%, #53b8ff 100%);
}

.streak-row {
  font-size: 12px;
  color: rgba(255, 202, 147, 0.9);
}

.icon-btn {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.05);
  color: #d8e4ff;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 16px rgba(110, 160, 255, 0.35);
}

.main-content {
  flex: 1;
  display: grid;
  /* 1.2fr for Q&A (Left), 1fr for Right Column (Exercises/Exam) */
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
  margin-top: 20px;
  min-height: 0;
}

.right-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.menu-card {
  position: relative;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%; /* Ensure full height */
  min-height: 100%;
}

.menu-card:hover {
  transform: scale(1.02) translateY(-4px);
}

.card-content {
  position: relative;
  z-index: 2;
  padding: 22px 14px;
}

.card-content h1,
.card-content h3 {
  margin: 0 0 8px;
  font-weight: 700;
  color: #f6f8ff;
}

.card-content h1 {
  font-size: clamp(28px, 3vw, 44px);
}

.card-content h3 {
  font-size: clamp(20px, 1.8vw, 26px);
}

.card-content p {
  margin: 0;
  color: rgba(220, 228, 246, 0.82);
  font-size: 14px;
}

.meta-text {
  display: block;
  margin-top: 12px;
  font-size: 12px;
  color: rgba(198, 208, 235, 0.65);
}

.qa-card {
  /* Specific styling for the main card if needed */
  background: linear-gradient(135deg, rgba(52, 115, 255, 0.2), rgba(39, 61, 126, 0.3));
}

.qa-card:hover {
  box-shadow: 0 0 28px rgba(77, 160, 255, 0.42);
}

.exercises-card:hover {
  box-shadow: 0 0 24px rgba(94, 230, 157, 0.4);
}

.exam-card:hover {
  box-shadow: 0 0 24px rgba(255, 176, 88, 0.42);
}

.top-right:hover,
.bottom-right:hover {
  box-shadow: 0 0 24px rgba(176, 113, 255, 0.42);
}

.center-card {
  /* Removed old center-card specific styles as it is now qa-card */
}

.qa-watermark {
  position: absolute;
  right: 16px;
  bottom: 8px;
  font-size: 88px;
  line-height: 1;
  color: rgba(198, 223, 255, 0.09);
  user-select: none;
  pointer-events: none;
}

.exam-badge {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 3;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #ffd7d7;
  background: rgba(255, 77, 79, 0.2);
  border: 1px solid rgba(255, 123, 123, 0.45);
}

.far-right-column {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  height: 100%; /* Ensure column takes full height */
}

.notification-dot {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ff5f62;
  box-shadow: 0 0 10px rgba(255, 95, 98, 0.6);
}

.bottom-bar {
  margin-top: 20px;
  /* Remove old grid styles */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0; /* Minimal padding */
}

.left-actions {
  display: flex;
  gap: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 12px;
  background: transparent; /* Default transparent */
  color: rgba(238, 243, 255, 0.7);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: translateY(-2px);
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.record-btn {
  font-size: 16px;
  padding: 12px 20px;
}

.icon-svg {
  width: 20px;
  height: 20px;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.action-btn:hover .icon-svg {
  opacity: 1;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}


@media (max-width: 1280px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .qa-card {
    min-height: 200px;
  }

  .right-column {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .dashboard-container {
    padding: 12px;
  }

  .top-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .main-content {
    grid-template-columns: 1fr;
  }
  
  .right-column {
    grid-template-columns: 1fr;
  }

  .bottom-bar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .left-actions {
    justify-content: space-between;
  }
  
  .record-btn {
    justify-content: center;
  }
}
</style>
