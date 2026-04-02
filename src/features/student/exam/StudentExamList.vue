<template>
  <div class="exam-list-page">
    <canvas ref="particleCanvas" class="particle-background"></canvas>

    <main class="main-content">
      <section class="content-panel">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">Student Exam</p>
            <h1>考试任务列表</h1>
          </div>
          <label class="debug-switch">
            <input
              type="checkbox"
              :checked="debugBypassTime"
              @change="onDebugToggle"
            />
            <span>调试模式 (强制进行中)</span>
          </label>
        </div>

        <div v-if="isLoading" class="loading-grid">
          <div v-for="index in 3" :key="index" class="assignment-skeleton"></div>
        </div>

        <div v-else-if="errorMessage" class="feedback-box error-box">
          <p>{{ errorMessage }}</p>
          <button type="button" class="retry-btn" @click="fetchAssignments">重新加载</button>
        </div>

        <div v-else-if="assignments.length === 0" class="feedback-box empty-box">
          <p>暂无考试任务</p>
        </div>

        <div v-else class="assignment-grid">
          <article
            v-for="assignment in assignments"
            :key="assignment.assignmentID"
            class="assignment-card"
          >
            <div class="card-top">
              <h3>{{ assignment.assignmentName || '未命名任务' }}</h3>
              <span class="status-tag" :class="getStatusClass(assignment.status)">
                {{ getStatusText(assignment.status) }}
              </span>
            </div>

            <div class="meta-row">
              <span class="meta-label">所属小组</span>
              <span class="meta-value">{{ assignment.groupName || '-' }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">开始时间</span>
              <span class="meta-value">{{ formatDateTime(assignment.beginTime) }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">结束时间</span>
              <span class="meta-value">{{ formatDateTime(assignment.endTime) }}</span>
            </div>

            <div class="card-actions">
              <button
                type="button"
                class="enter-btn"
                :disabled="assignment.status !== 'in_progress'"
                @click="goToExamDetail(assignment.assignmentID)"
              >
                进入考试
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>

    <button class="back-btn" type="button" @click="goBackToExercise">返回大厅</button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { get } from '../../../shared/api/httpClient.js';
import { ROUTES } from '../../../shared/constants/routes.js';

const particleCanvas = ref(null);
const assignments = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const debugBypassTime = ref(false);

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
  fetchAssignments();
});

onUnmounted(() => {
  if (cleanupParticles) cleanupParticles();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

const goBackToExercise = () => {
  window.location.href = ROUTES.STUDENT_MENU;
};

const getStatusText = (status) => {
  if (status === 'not_started') return '未开始';
  if (status === 'in_progress') return '进行中';
  if (status === 'ended') return '已结束';
  return '未知';
};

const getStatusClass = (status) => {
  if (status === 'not_started') return 'tag-not-started';
  if (status === 'in_progress') return 'tag-in-progress';
  if (status === 'ended') return 'tag-ended';
  return 'tag-not-started';
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
};

async function fetchAssignments() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const params = debugBypassTime.value ? { debug_bypass_time: 'true' } : {};
    const response = await get('/student/assignments', params);
    const data = response?.data || {};
    assignments.value = Array.isArray(data.items) ? data.items : [];
  } catch (error) {
    assignments.value = [];
    errorMessage.value =
      error?.message || '考试任务加载失败，请稍后重试。';
  } finally {
    isLoading.value = false;
  }
}

async function onDebugToggle(event) {
  debugBypassTime.value = Boolean(event?.target?.checked);
  await fetchAssignments();
}

const goToExamDetail = (assignmentID) => {
  if (!assignmentID) return;
  const targetUrl = `/student/exam-detail?assignmentId=${encodeURIComponent(assignmentID)}`;
  window.location.href = targetUrl;
};
</script>

<style scoped>
.exam-list-page {
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
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 24px;
  padding-bottom: 20px;
}

.content-panel {
  width: 100%;
  max-width: 1260px;
  padding: 46px;
  border-radius: 36px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
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
  font-size: clamp(34px, 4vw, 50px);
  line-height: 1.08;
  letter-spacing: -0.02em;
}

.debug-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
}

.debug-switch input {
  accent-color: #7aa2ff;
}

.assignment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 20px;
  margin-top: 14px;
}

.assignment-card {
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.26);
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.25s ease, border-color 0.25s ease;
}

.assignment-card:hover {
  transform: translateY(-4px);
  border-color: rgba(122, 162, 255, 0.35);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-top h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.35;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 10px;
}

.meta-label {
  color: rgba(255, 255, 255, 0.66);
  font-size: 13px;
}

.meta-value {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-align: right;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 66px;
  height: 28px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
}

.tag-not-started {
  color: #efe5c6;
  background: rgba(150, 124, 55, 0.25);
  border-color: rgba(198, 162, 78, 0.5);
}

.tag-in-progress {
  color: #d4f6de;
  background: rgba(35, 125, 63, 0.32);
  border-color: rgba(89, 215, 132, 0.52);
}

.tag-ended {
  color: #ffd2d2;
  background: rgba(128, 45, 45, 0.3);
  border-color: rgba(220, 86, 86, 0.5);
}

.card-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.enter-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid rgba(122, 162, 255, 0.42);
  background: rgba(122, 162, 255, 0.24);
  color: #f6f8ff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.enter-btn:hover:enabled {
  background: rgba(122, 162, 255, 0.34);
  transform: translateY(-1px);
}

.enter-btn:disabled {
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 20px;
}

.assignment-skeleton {
  height: 210px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    110deg,
    rgba(255, 255, 255, 0.05) 8%,
    rgba(255, 255, 255, 0.13) 18%,
    rgba(255, 255, 255, 0.05) 33%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

@keyframes shimmer {
  to {
    background-position-x: -200%;
  }
}

.feedback-box {
  margin-top: 12px;
  min-height: 180px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.88);
}

.empty-box {
  background: rgba(255, 255, 255, 0.04);
}

.error-box {
  background: rgba(160, 48, 48, 0.2);
  border-color: rgba(220, 86, 86, 0.45);
}

.retry-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(220, 86, 86, 0.6);
  background: rgba(220, 86, 86, 0.24);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
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

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
