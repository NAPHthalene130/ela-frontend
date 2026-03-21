<template>
  <div class="dashboard-container">
    <canvas ref="particleCanvas" class="particle-background"></canvas>

    <header class="top-bar glass-panel">
      <div class="user-info" v-if="userInfo">
        <img :src="userInfo.avatarUrl" alt="用户头像" class="avatar" />
        <div class="user-meta">
          <span class="username">
            {{ userInfo.id || userInfo.userId || userInfo.username }}
          </span>
          <span class="role-badge">{{ displayRoleLabel }}</span>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="center-panel glass-panel">
        <div class="panel-intro">
          <p class="panel-kicker">Teacher Workspace</p>
          <h1>教师管理菜单</h1>
          <p class="panel-copy">
            聚焦教师端核心管理流程：管理小组、创建题单与任务管理，支持后续业务平滑扩展。
          </p>
        </div>

        <div class="menu-grid teacher-grid">
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
              <p>{{ module.description }}</p>
            </div>
            <span class="status-chip">{{ module.statusText }}</span>
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

// 教师端菜单模块配置：统一维护卡片信息，便于后续接入真实业务页面
const teacherModules = [
  {
    action: 'create-group',
    title: '管理小组',
    description: '建立教学小组并分配成员，为课堂协作与分层教学提供基础。',
    icon: '👥',
    className: 'group-card',
    statusText: '已接入',
  },
  {
    action: 'create-sheet',
    title: '创建题单',
    description: '按课程与难度组织题单，支持后续发布、批改与学习数据追踪。',
    icon: '🧾',
    className: 'sheet-card',
    statusText: '待实现',
  },
  {
    action: 'task-manage',
    title: '任务管理',
    description: '统一查看任务状态，后续可扩展截止时间、完成率与提醒策略。',
    icon: '📌',
    className: 'task-card',
    statusText: '规划中',
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

  const actionMessages = {
    'create-sheet': '创建题单功能暂未实现。',
    'task-manage': '任务管理功能暂未实现。',
  };

  const feedback = actionMessages[action];
  if (feedback) {
    window.alert(feedback);
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

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4vw 4vh;
}

.center-panel {
  padding: 46px;
  border-radius: 40px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  width: 100%;
  max-width: 1260px;
}

.panel-intro {
  margin-bottom: 28px;
}

.panel-kicker {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #9db3ff;
}

.panel-intro h1 {
  margin: 0;
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1.06;
  color: #ffffff;
  letter-spacing: -0.03em;
}

.panel-copy {
  margin: 14px 0 0;
  max-width: 760px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 16px;
  line-height: 1.7;
}

.menu-grid {
  display: grid;
  gap: 30px;
  width: 100%;
}

.teacher-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.menu-card {
  position: relative;
  width: 100%;
  min-height: 300px;
  border-radius: 28px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  text-align: left;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  padding: 30px;
  opacity: 0;
  animation: slideUpFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.menu-card:nth-child(1) { animation-delay: 0.12s; }
.menu-card:nth-child(2) { animation-delay: 0.24s; }

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
  inset: 0;
  background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.12), transparent 60%);
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

.group-card:hover {
  border-color: rgba(0, 255, 255, 0.5);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 255, 0.18);
}

.sheet-card:hover {
  border-color: rgba(255, 95, 98, 0.5);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 95, 98, 0.18);
}

.task-card:hover {
  border-color: rgba(122, 162, 255, 0.55);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(122, 162, 255, 0.2);
}

.card-icon,
.card-content,
.status-chip {
  position: relative;
  z-index: 1;
}

.card-icon {
  font-size: 72px;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-card:hover .card-icon {
  transform: scale(1.15) rotate(5deg);
}

.card-content h3 {
  margin: 28px 0 12px;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.card-content p {
  margin: 0;
  max-width: 85%;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.7;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 28px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
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

@media (max-width: 1100px) {
  .teacher-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}

@media (max-width: 800px) {
  .center-panel {
    padding: 24px;
    border-radius: 24px;
  }

  .menu-card {
    min-height: 220px;
    padding: 24px;
  }

  .card-icon {
    font-size: 52px;
  }

  .card-content h3 {
    font-size: 22px;
    margin: 18px 0 8px;
  }

  .card-content p {
    max-width: 100%;
    font-size: 14px;
  }
}
</style>
