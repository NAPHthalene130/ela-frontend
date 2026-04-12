<template>
  <div class="dashboard-container custom-scrollbar">
    <canvas ref="particleCanvas" class="particle-background"></canvas>

    <header class="top-bar glass-panel">
      <div class="user-info" v-if="userInfo">
        <img :src="userInfo.avatarUrl" alt="用户头像" class="avatar" />
        <div class="user-meta">
          <span class="username">{{ userInfo.id || userInfo.userId || userInfo.username }}</span>
          <span class="role-badge">{{ displayRoleLabel }}</span>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="center-panel glass-panel">
        <div class="menu-grid">
          <article
            v-for="module in teacherModules"
            :key="module.action"
            class="menu-card"
            :class="module.className"
            @click="handleAction(module.action)"
          >
            <div class="card-icon">{{ module.icon }}</div>
            <div class="card-content">
              <h3>{{ module.title }}</h3>
            </div>
          </article>
        </div>
      </div>
    </main>

    <button class="logout-btn" type="button" @click="logout">
      退出登录
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { clearAuthSession, getStoredUser } from '../../../shared/auth/session.js';
import { ROUTES } from '../../../shared/constants/routes.js';
import {
  getUserTypeLabel,
  normalizeUserType,
} from '../../../shared/constants/userTypes.js';

const props = defineProps({
  userType: {
    type: String,
    default: 'teacher',
  },
});

const userInfo = ref(null);
const particleCanvas = ref(null);
const displayRoleLabel = computed(() =>
  getUserTypeLabel(userInfo.value?.type || props.userType)
);

let animationFrameId = null;
let cleanupParticles = null;

const teacherModules = [
  {
    action: 'create-group',
    title: '管理小组',
    icon: '👥',
    className: 'group-card',
  },
  {
    action: 'create-sheet',
    title: '创建题单',
    icon: '🧾',
    className: 'sheet-card',
  },
  {
    action: 'task-manage',
    title: '任务管理',
    icon: '📌',
    className: 'task-card',
  },
];

const buildAvatarUrl = (seed) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || 'teacher'}`;

const normalizeTeacherUser = (rawUser = {}) => {
  const normalizedId =
    rawUser.id || rawUser.userId || rawUser.username || props.userType;

  return {
    ...rawUser,
    id: normalizedId,
    type: normalizeUserType(rawUser.type || props.userType),
    avatarUrl: rawUser.avatarUrl || buildAvatarUrl(normalizedId),
  };
};

const initParticles = () => {
  const canvas = particleCanvas.value;
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const particles = [];
  const meteors = [];
  const particleCount = 60;
  const meteorCount = 4;

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
      this.angle = -Math.PI / 4;
      this.waitTime = Math.random() * 100;
      this.active = false;
    }

    update() {
      if (this.waitTime > 0) {
        this.waitTime -= 1;
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

  for (let index = 0; index < particleCount; index += 1) {
    particles.push(new Particle());
  }

  for (let index = 0; index < meteorCount; index += 1) {
    meteors.push(new Meteor());
  }

  const animate = () => {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.update();
      particle.draw();
    });

    meteors.forEach((meteor) => {
      meteor.update();
      meteor.draw();
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

  const storedUser = getStoredUser();
  if (storedUser) {
    userInfo.value = normalizeTeacherUser(storedUser);
    return;
  }

  userInfo.value = normalizeTeacherUser();
});

onUnmounted(() => {
  if (cleanupParticles) cleanupParticles();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

const handleAction = (action) => {
  if (action === 'create-group') {
    window.location.href = ROUTES.TEACHER_GROUP;
    return;
  }

  if (action === 'create-sheet') {
    window.location.href = ROUTES.TEACHER_QUESTION;
    return;
  }

  if (action === 'task-manage') {
    window.location.href = ROUTES.TEACHER_ASSIGNMENT;
    return;
  }

  window.alert('模块功能暂未实现。');
};

const logout = () => {
  clearAuthSession();
  window.location.href = ROUTES.AUTH;
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
  overflow-x: hidden;
  overflow-y: auto;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #eef3ff;
  background: linear-gradient(135deg, #1a1c29 0%, #141826 55%, #0f1016 100%);
  background-size: 220% 220%;
  animation: ambientBg 16s ease infinite;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.06);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(165, 180, 252, 0.55);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(165, 180, 252, 0.75);
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
  justify-content: flex-start;
  width: fit-content;
  margin: 20px 0 20px 20px;
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

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4vw 4vh;
}

.center-panel {
  padding: 50px;
  border-radius: 40px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  width: 100%;
  max-width: 1200px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  width: 100%;
}

.menu-card {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
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
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  
  opacity: 0;
  animation: slideUpFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.menu-card:nth-child(1) { animation-delay: 0.1s; }
.menu-card:nth-child(2) { animation-delay: 0.2s; }
.menu-card:nth-child(3) { animation-delay: 0.3s; }

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
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

.group-card:hover { border-color: rgba(0, 255, 255, 0.5); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 255, 0.2); }
.group-card .card-icon { text-shadow: 0 0 20px rgba(0, 255, 255, 0.4); }

.sheet-card:hover { border-color: rgba(255, 95, 98, 0.5); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 95, 98, 0.2); }
.sheet-card .card-icon { text-shadow: 0 0 20px rgba(255, 95, 98, 0.4); }

.task-card:hover { border-color: rgba(122, 162, 255, 0.55); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(122, 162, 255, 0.2); }
.task-card .card-icon { text-shadow: 0 0 20px rgba(122, 162, 255, 0.4); }

.card-icon {
  font-size: 72px;
  margin-bottom: 30px;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-card:hover .card-icon {
  transform: scale(1.15) rotate(5deg);
}

.card-content h3 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.logout-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10;
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

.logout-btn:active {
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 1200px) {
  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 800px) {
  .center-panel {
    padding: 24px;
    border-radius: 24px;
  }
  
  .menu-grid {
    grid-template-columns: 1fr;
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
    animation: slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }
  
  .card-icon {
    margin-bottom: 0;
    font-size: 48px;
  }
  
  .card-content h3 {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .center-panel {
    padding: 16px;
  }
  .menu-card {
    height: 120px;
    padding: 0 20px;
    gap: 15px;
  }
  .card-icon {
    font-size: 36px;
  }
  .card-content h3 {
    font-size: 18px;
  }
  .top-bar {
    margin: 10px 0 10px 10px;
  }
}
</style>
