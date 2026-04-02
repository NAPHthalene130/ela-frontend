<template>
  <div class="dashboard-container">
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
        <div class="panel-intro">
          <p class="panel-kicker">Practice Hub</p>
          <h1>练习系统</h1>
          <p class="panel-copy">当前开放练习系统入口，后续将逐步接入更多专项能力训练模块。</p>
        </div>

        <div class="menu-grid">
          <article
            v-for="module in modules"
            :key="module.key"
            class="menu-card disabled"
            :class="module.className"
          >
            <div class="card-icon">{{ module.icon }}</div>
            <div class="card-content">
              <h3>{{ module.title }}</h3>
            </div>
            <div class="card-footer">
              <button class="enter-btn" type="button" disabled>
                敬请期待
              </button>
            </div>
          </article>
        </div>
      </div>
    </main>

    <button class="back-btn" type="button" @click="goBackToMenu">返回菜单</button>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { getStoredUser } from '../../../shared/auth/session.js';
import { ROUTES } from '../../../shared/constants/routes.js';
import {
  getUserTypeLabel,
  normalizeUserType,
} from '../../../shared/constants/userTypes.js';

const props = defineProps({
  userType: {
    type: String,
    default: 'student',
  },
});

const particleCanvas = ref(null);
const userInfo = ref(null);
const displayRoleLabel = computed(() =>
  getUserTypeLabel(userInfo.value?.type || props.userType)
);

let animationFrameId = null;
let cleanupParticles = null;

const modules = [
  {
    key: 'practice',
    title: '强化练习',
    icon: '🧠',
    className: 'practice-card',
  },
  {
    key: 'past-exam',
    title: '北交大真题',
    icon: '📚',
    className: 'past-card',
  },
  {
    key: 'wrong-book',
    title: '错题本',
    icon: '🗂️',
    className: 'wrong-card',
  },
];

const buildAvatarUrl = (seed) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || 'student'}`;

const normalizeDashboardUser = (rawUser = {}) => {
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
  userInfo.value = normalizeDashboardUser(storedUser || {});
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
  max-width: 1080px;
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
  max-width: 720px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 16px;
  line-height: 1.7;
}

.menu-grid {
  display: grid;
  gap: 30px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.menu-card {
  position: relative;
  min-height: 280px;
  border-radius: 28px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  text-align: left;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  padding: 30px;
}

.disabled {
  opacity: 0.78;
}

.card-icon,
.card-content,
.card-footer {
  position: relative;
  z-index: 1;
}

.card-icon {
  font-size: 64px;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
}

.card-content h3 {
  margin: 18px 0 0;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1px;
}

.card-footer {
  margin-top: 24px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.enter-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: not-allowed;
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

.back-btn:active {
  transform: translateY(0);
}

@media (max-width: 900px) {
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
    margin: 16px 0 8px;
  }
}
</style>
