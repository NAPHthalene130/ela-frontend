<template>
  <div class="dashboard-container">
    <canvas ref="particleCanvas" class="particle-background"></canvas>
    
    <header class="top-bar glass-panel">
      <div class="user-info" v-if="userInfo">
        <img :src="userInfo.avatarUrl" alt="用户头像" class="avatar" />
        <div class="user-meta">
          <span class="username">{{ userInfo.id || userInfo.userId || userInfo.username }}</span>
          <span class="role-badge">{{ userInfo.role || 'Student' }}</span>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="center-panel glass-panel">
        <div class="menu-grid">
          <!-- 问答系统 -->
          <article class="menu-card qa-card" @click="handleNavigation('qa')">
            <div class="card-icon">💡</div>
            <div class="card-content">
              <h3>问答系统</h3>
              <p>智能解惑，随时提问</p>
            </div>
          </article>

          <!-- 习题系统 -->
          <article class="menu-card exercises-card" @click="handleNavigation('exercises')">
            <div class="card-icon">📝</div>
            <div class="card-content">
              <h3>习题系统</h3>
              <p>每日一练，巩固基础</p>
            </div>
          </article>

          <!-- 考试系统 -->
          <article class="menu-card exam-card" @click="handleNavigation('exam')">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <h3>考试系统</h3>
              <p>模拟实战，检验成果</p>
            </div>
            <span v-if="notifications.examPending" class="notification-dot"></span>
          </article>
          
          <!-- 设置 -->
           <article class="menu-card settings-card" @click="handleNavigation('settings')">
            <div class="card-icon">⚙️</div>
            <div class="card-content">
              <h3>系统设置</h3>
              <p>个性化调整</p>
            </div>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { getSystemNotifications, getUserInfo } from './api';

const userInfo = ref(null);
const notifications = ref({
  studyGroupUnread: false,
  examPending: false
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
  const meteors = [];
  const particleCount = 60;
  const meteorCount = 4; // Number of active meteors

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

  class Meteor {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width + 200;
      this.y = Math.random() * height - 200;
      this.len = Math.random() * 80 + 10;
      this.speed = Math.random() * 10 + 6;
      this.size = Math.random() * 1 + 0.1;
      // Angle for shooting star (top-right to bottom-left)
      this.angle = -Math.PI / 4; 
      this.waitTime = Math.random() * 100; // Delay before appearing
      this.active = false;
    }

    update() {
      if (this.waitTime > 0) {
        this.waitTime--;
        return;
      }
      this.active = true;
      this.x -= this.speed * Math.cos(Math.abs(this.angle));
      this.y += this.speed * Math.sin(Math.abs(this.angle));

      if (this.x < -100 || this.y > height + 100) {
        this.reset();
      }
    }

    draw() {
      if (!this.active) return;
      
      const tailX = this.x + this.len * Math.cos(Math.abs(this.angle));
      const tailY = this.y - this.len * Math.sin(Math.abs(this.angle));

      const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  for (let i = 0; i < meteorCount; i++) {
    meteors.push(new Meteor());
  }

  const animate = () => {
    ctx.clearRect(0, 0, width, height);
    
    // Draw particles
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    // Draw meteors
    meteors.forEach(m => {
      m.update();
      m.draw();
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
  
  // 优先从 localStorage 获取用户信息以确保 ID 一致
  // Prioritize getting user info from localStorage to ensure ID consistency
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      // 确保有 avatarUrl
      if (!parsed.avatarUrl) {
         parsed.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${parsed.id || 'default'}`;
      }
      userInfo.value = parsed;
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    }
  }

  // 如果本地没有，或者需要更新，可以调用 API (此处仅作为 fallback 或补充)
  if (!userInfo.value) {
      try {
        const userRes = await getUserInfo();
        if (userRes.code === 200) {
          userInfo.value = userRes.data;
        }
      } catch (error) {
        console.error('User data load failed:', error);
      }
  }

  try {
    const notifRes = await getSystemNotifications();
    if (notifRes.code === 200) {
      notifications.value = notifRes.data;
    }
  } catch (error) {
    console.error('Notifications load failed:', error);
  }
});

onUnmounted(() => {
  if (cleanupParticles) cleanupParticles();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

const handleNavigation = routeName => {
  console.log(`Navigating to: ${routeName}`);
  // 这里可以添加实际的路由跳转逻辑
};
</script>

<style scoped>
.dashboard-container {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #eef3ff;
  background: linear-gradient(135deg, #1a1c29 0%, #141826 55%, #0f1016 100%);
  background-size: 220% 220%;
  animation: ambientBg 16s ease infinite;
}

@keyframes ambientBg {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
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
.main-content {
  position: relative;
  z-index: 1;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

/* Top Bar */
.top-bar {
  height: 60px;
  border-radius: 12px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Align left */
  width: fit-content; /* Only take necessary width */
  margin: 20px 0 20px 20px; /* Add margin to position it nicely */
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.18);
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 16px;
  font-weight: 600;
  color: #f2f6ff;
}

.role-badge {
  font-size: 11px;
  color: #c7d5ff;
}

/* Main Content - Hui Style Center */
.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4vw 4vh; /* Add horizontal padding */
}

.center-panel {
  padding: 50px;
  border-radius: 40px; /* Slightly more rounded */
  background: rgba(255, 255, 255, 0.03); /* More subtle base */
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px); /* Stronger blur */
  width: 100%;
  max-width: 1400px; /* Adjusted max width for better proportion */
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 columns for wide screens */
  gap: 30px;
  width: 100%;
}

.menu-card {
  position: relative;
  width: 100%; /* Fill grid cell */
  aspect-ratio: 4 / 5; /* Use aspect ratio instead of fixed height */
  border-radius: 28px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15); /* Subtle shadow */
  
  /* Entrance Animation */
  opacity: 0;
  animation: slideUpFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

/* Staggered animation delays */
.menu-card:nth-child(1) { animation-delay: 0.1s; }
.menu-card:nth-child(2) { animation-delay: 0.2s; }
.menu-card:nth-child(3) { animation-delay: 0.3s; }
.menu-card:nth-child(4) { animation-delay: 0.4s; }

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent 60%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.menu-card:hover::before {
  opacity: 1;
}

.menu-card:hover {
  transform: translateY(-12px) scale(1.02);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.1);
}

/* Specific Card Colors */
.qa-card:hover { border-color: rgba(255, 215, 0, 0.5); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.2); }
.qa-card .card-icon { text-shadow: 0 0 20px rgba(255, 215, 0, 0.4); }

.exercises-card:hover { border-color: rgba(0, 255, 255, 0.5); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 255, 0.2); }
.exercises-card .card-icon { text-shadow: 0 0 20px rgba(0, 255, 255, 0.4); }

.exam-card:hover { border-color: rgba(255, 95, 98, 0.5); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 95, 98, 0.2); }
.exam-card .card-icon { text-shadow: 0 0 20px rgba(255, 95, 98, 0.4); }

.settings-card:hover { border-color: rgba(192, 192, 192, 0.5); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(192, 192, 192, 0.2); }
.settings-card .card-icon { text-shadow: 0 0 20px rgba(192, 192, 192, 0.4); }

.card-icon {
  font-size: 72px; /* Larger icon */
  margin-bottom: 30px;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-card:hover .card-icon {
  transform: scale(1.15) rotate(5deg);
}

.card-content h3 {
  margin: 0 0 12px;
  font-size: 26px; /* Larger text */
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.card-content p {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  max-width: 85%;
  margin: 0 auto;
  font-weight: 400;
}

.notification-dot {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff5f62;
  box-shadow: 0 0 10px #ff5f62;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 95, 98, 0.7); }
  70% { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(255, 95, 98, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 95, 98, 0); }
}

/* Responsive */
@media (max-width: 1400px) {
  .menu-grid {
    grid-template-columns: repeat(2, 1fr); /* 2x2 for medium screens */
  }
}

@media (max-width: 800px) {
  .center-panel {
    padding: 24px;
    border-radius: 24px;
  }
  
  .menu-grid {
    grid-template-columns: 1fr; /* Stack for mobile */
    gap: 20px;
  }
  
  .menu-card {
    aspect-ratio: auto;
    height: 140px;
    flex-direction: row;
    justify-content: flex-start;
    padding: 0 30px;
    gap: 25px;
    text-align: left;
    /* Reset animation for mobile simplicity or keep it */
    animation: slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }
  
  .card-icon {
    margin-bottom: 0;
    font-size: 48px;
  }
  
  .card-content h3 {
    font-size: 20px;
    margin-bottom: 6px;
  }
  
  .card-content p {
    margin: 0;
    max-width: 100%;
    font-size: 14px;
  }
}
</style>
