<template>
  <div class="practice-page">
    <canvas ref="particleCanvas" class="particle-background"></canvas>

    <header class="top-bar">
      <div class="user-info" v-if="userInfo">
        <img :src="userInfo.avatarUrl" alt="用户头像" class="avatar" />
        <div class="user-meta">
          <span class="username">{{ userInfo.id || userInfo.userId || userInfo.username }}</span>
          <span class="role-badge">{{ displayRoleLabel }}</span>
        </div>
      </div>

      <div class="top-actions">
        <button type="button" class="primary-btn" @click="openRecommendationModal">
          智能推荐
        </button>
        <button type="button" class="ghost-btn" @click="goBackToMenu">
          返回菜单
        </button>
      </div>
    </header>

    <section class="set-bar">
      <div class="set-bar-main">
        <div>
          <p class="panel-kicker">Practice Set</p>
          <h2>练习题单</h2>
          <p class="panel-copy">
            先创建题单，再把推荐题或预览题加入题单，随后点击题单开始做题。
          </p>
        </div>

        <div class="set-create-form">
          <input
            v-model="practiceSetName"
            class="input-control compact-input"
            type="text"
            maxlength="60"
            placeholder="请输入题单名称，不填则自动命名"
          />
          <button
            type="button"
            class="primary-btn"
            :disabled="practiceSetSubmitting"
            @click="handleCreatePracticeSet"
          >
            {{ practiceSetSubmitting ? '创建中...' : '创建题单' }}
          </button>
        </div>
      </div>

      <p v-if="practiceSetStatusMessage" class="status-text" :class="{ error: practiceSetStatusError }">
        {{ practiceSetStatusMessage }}
      </p>

      <div v-if="practiceSetLoading" class="status-text">正在加载题单...</div>
      <div v-else-if="practiceSets.length" class="set-carousel-wrap">
        <div class="set-carousel">
          <button
            type="button"
            class="carousel-btn"
            :disabled="practiceSets.length <= 1"
            @click="switchPracticeSet(-1)"
          >
            ‹
          </button>

          <button
            type="button"
            class="set-chip set-chip-center active"
            @click="openPracticeSetSession(activePracticeSet?.id)"
          >
            <span class="set-name">{{ activePracticeSet?.name }}</span>
            <span class="selection-tip">{{ activePracticeSet?.questionCount || 0 }} 题</span>
          </button>

          <button
            type="button"
            class="carousel-btn"
            :disabled="practiceSets.length <= 1"
            @click="switchPracticeSet(1)"
          >
            ›
          </button>
        </div>
        <p class="set-carousel-index">
          当前题单 {{ currentPracticeSetIndex + 1 }} / {{ practiceSets.length }}
        </p>
      </div>
      <p v-else class="status-text">当前还没有练习题单，请先创建一个。</p>
    </section>

    <main class="main-layout">
      <section class="sidebar-panel">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">Course</p>
            <h2>科目</h2>
          </div>
          <span class="panel-badge">{{ courseOptions.length }}</span>
        </div>

        <p v-if="courseLoading" class="status-text">正在加载科目...</p>
        <p v-else-if="courseErrorMessage" class="status-text error">{{ courseErrorMessage }}</p>
        <p v-else-if="courseOptions.length === 0" class="status-text">当前暂无可用习题科目</p>
        <ul v-else class="selection-list course-scroll-area">
          <li
            v-for="course in courseOptions"
            :key="course"
            class="selection-item"
            :class="{ active: selectedCourse === course }"
            @click="selectCourse(course)"
          >
            <span>{{ course }}</span>
          </li>
        </ul>
      </section>

      <section class="sidebar-panel">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">Type</p>
            <h2>题型</h2>
          </div>
          <span class="panel-badge">{{ questionTypeOptions.length }}</span>
        </div>

        <ul class="selection-list type-scroll-area">
          <li
            v-for="typeItem in questionTypeOptions"
            :key="typeItem.value"
            class="selection-item"
            :class="{ active: selectedQuestionType === typeItem.value }"
            @click="selectQuestionType(typeItem.value)"
          >
            <span>{{ typeItem.label }}</span>
          </li>
        </ul>
      </section>

      <section class="content-panel">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">Pool</p>
            <h2>练习题库</h2>
          </div>
          <div class="header-tags">
            <span class="tag">{{ selectedCourse || '未选科目' }}</span>
            <span class="tag">{{ selectedTypeLabel }}</span>
          </div>
        </div>

        <div class="content-grid">
          <section class="pool-panel">
            <div class="sub-panel-header">
              <div>
                <h3>题目列表</h3>
                <p>选择题目后可在右侧预览详情</p>
              </div>
              <span class="panel-badge">{{ questionPool.length }}</span>
            </div>

            <p v-if="questionPoolLoading" class="status-text">正在加载题库...</p>
            <p v-else-if="questionPoolErrorMessage" class="status-text error">
              {{ questionPoolErrorMessage }}
            </p>
            <p v-else-if="!selectedCourse" class="status-text">请先选择科目</p>
            <p v-else-if="questionPool.length === 0" class="status-text">当前条件下暂无题目</p>

            <ul v-else class="question-list question-scroll-area">
              <li
                v-for="item in questionPool"
                :key="item.id"
                class="question-list-item"
                :class="{ active: selectedQuestionId === item.id }"
                @click="selectQuestion(item)"
              >
                <span class="question-id">题目ID {{ item.id }}</span>
                <p class="question-brief">{{ item.brief || '未提供简介' }}</p>
              </li>
            </ul>
          </section>

          <section class="preview-panel">
            <div class="sub-panel-header">
              <div>
                <h3>题目预览</h3>
                <p>这里仅展示题目，不展示答案与解析</p>
              </div>
              <div class="preview-actions">
                <span v-if="activePracticeSet" class="tag">{{ activePracticeSet.name }}</span>
                <button
                  v-if="previewQuestionDetail"
                  type="button"
                  class="ghost-btn compact-btn"
                  :disabled="!activePracticeSetId || practiceSetActionSubmitting"
                  @click="addCurrentQuestionToSet"
                >
                  {{ practiceSetActionSubmitting ? '处理中...' : '添加习题' }}
                </button>
              </div>
            </div>

            <p v-if="previewLoading" class="status-text">正在加载题目详情...</p>
            <p v-else-if="previewErrorMessage" class="status-text error">
              {{ previewErrorMessage }}
            </p>
            <div v-else-if="previewQuestionDetail" class="preview-content preview-scroll-area">
              <div class="preview-meta">
                <span class="tag">{{ previewTypeLabel }}</span>
                <span class="tag">{{ previewQuestionDetail.course || selectedCourse }}</span>
                <span class="question-id">题目ID {{ previewQuestionDetail.id }}</span>
              </div>

              <div class="preview-block">
                <p class="preview-label">题目简介</p>
                <p class="preview-text">
                  {{ previewQuestionDetail.brief || '未提供简介' }}
                </p>
              </div>

              <template v-if="previewQuestionDetail.type === 'choice'">
                <div class="preview-block">
                  <p class="preview-label">题目内容</p>
                  <p class="preview-text">{{ previewQuestionDetail.content || '未提供题干' }}</p>
                </div>
                <ul class="option-list">
                  <li class="option-item">A. {{ previewQuestionDetail.optionA || '无' }}</li>
                  <li class="option-item">B. {{ previewQuestionDetail.optionB || '无' }}</li>
                  <li class="option-item">C. {{ previewQuestionDetail.optionC || '无' }}</li>
                  <li class="option-item">D. {{ previewQuestionDetail.optionD || '无' }}</li>
                </ul>
              </template>

              <template
                v-else-if="
                  previewQuestionDetail.type === 'fill' || previewQuestionDetail.type === 'subjective'
                "
              >
                <div class="preview-block">
                  <p class="preview-label">题目内容</p>
                  <p class="preview-text">{{ previewQuestionDetail.content || '未提供题干' }}</p>
                </div>
              </template>

              <template v-else-if="previewQuestionDetail.type === 'custom'">
                <div class="preview-block">
                  <p class="preview-label">图片题目</p>
                  <p class="preview-text">{{ previewQuestionDetail.brief || '自定义题' }}</p>
                </div>
                <div v-if="previewQuestionDetail.imageURL" class="image-shell">
                  <img
                    :src="previewQuestionDetail.imageURL"
                    alt="自定义题"
                    class="preview-image"
                  />
                </div>
                <p v-else class="status-text">未提供图片资源</p>
              </template>
            </div>
            <div v-else class="placeholder-panel">
              <h3>开始浏览练习题库</h3>
              <p>左侧选择科目和题型后，可查看题目列表与详情。</p>
              <p>你也可以点击上方“智能推荐”，按自己的训练目标筛选 10 道题。</p>
            </div>
          </section>
        </div>
      </section>
    </main>

    <div v-if="showRecommendationModal" class="modal-overlay" @click.self="closeRecommendationModal">
      <section class="recommend-modal">
        <header class="modal-header">
          <div>
            <p class="panel-kicker">Recommendation</p>
            <h2>智能推荐</h2>
            <p class="panel-copy">
              选择需要练习的科目与题型，并输入考点介绍，系统会返回 10 道推荐习题。
            </p>
          </div>
          <button type="button" class="close-btn" @click="closeRecommendationModal">×</button>
        </header>

        <div class="recommend-layout">
          <section class="recommend-form-panel">
            <div class="form-group">
              <label>科目</label>
              <select v-model="recommendCourse" class="input-control">
                <option value="">请选择科目</option>
                <option v-for="course in courseOptions" :key="`recommend-${course}`" :value="course">
                  {{ course }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>题型</label>
              <select v-model="recommendQuestionType" class="input-control">
                <option
                  v-for="typeItem in questionTypeOptions"
                  :key="`recommend-type-${typeItem.value}`"
                  :value="typeItem.value"
                >
                  {{ typeItem.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>目标题单</label>
              <select v-model="activePracticeSetId" class="input-control">
                <option :value="null">请选择题单</option>
                <option
                  v-for="practiceSet in practiceSets"
                  :key="`recommend-set-${practiceSet.id}`"
                  :value="practiceSet.id"
                >
                  {{ practiceSet.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>考点介绍</label>
              <textarea
                v-model="recommendRequirement"
                class="textarea-control"
                rows="6"
                maxlength="300"
                placeholder="例如：我想练习 C 语言里循环、数组和条件判断的综合选择题，难度偏基础到中等。"
              ></textarea>
              <span class="field-tip">{{ recommendRequirement.length }}/300</span>
            </div>

            <p v-if="recommendErrorMessage" class="status-text error">{{ recommendErrorMessage }}</p>

            <div class="form-actions">
              <button
                type="button"
                class="primary-btn"
                :disabled="recommendSubmitting"
                @click="submitRecommendation"
              >
                {{ recommendSubmitting ? '推荐中...' : '获取推荐' }}
              </button>
            </div>
          </section>

          <section class="recommend-result-panel">
            <div class="sub-panel-header">
              <div>
                <h3>推荐结果</h3>
                <p>点击某道题可直接在主界面预览</p>
              </div>
              <span class="panel-badge">
                {{ recommendationQuestions.length }}
              </span>
            </div>

            <div v-if="recommendationUserBrief" class="recommend-brief-card">
              <p class="preview-label">检索描述</p>
              <p class="preview-text">{{ recommendationUserBrief }}</p>
            </div>

            <p v-if="recommendSubmitting" class="status-text">正在生成推荐结果...</p>
            <p
              v-else-if="!recommendationQuestions.length && !recommendationUserBrief"
              class="status-text"
            >
              提交需求后，右侧会展示推荐结果。
            </p>
            <p
              v-else-if="!recommendationQuestions.length && recommendationUserBrief"
              class="status-text"
            >
              当前没有命中可用题目，请换一种描述继续尝试。
            </p>

            <ul v-else class="recommend-list">
              <li
                v-for="(question, index) in recommendationQuestions"
                :key="`recommend-question-${question.id}-${index}`"
                class="recommend-item"
                @click="previewRecommendedQuestion(question)"
              >
                <div class="recommend-item-header">
                  <span class="tag">第 {{ index + 1 }} 题</span>
                  <span class="question-id">ID {{ question.id }}</span>
                </div>
                <div class="recommend-content-block">
                  <p class="preview-label">题目简介</p>
                  <p class="question-brief">{{ question.brief || '未提供简介' }}</p>
                </div>
                <div class="recommend-content-block">
                  <p class="preview-label">题目题干</p>
                  <p class="question-brief">{{ question.content || question.brief || '未提供题干' }}</p>
                </div>
                <div class="recommend-content-block">
                  <p class="preview-label">题目选项</p>
                  <ul v-if="question.type === 'choice'" class="recommend-option-list">
                    <li class="recommend-option-item">A. {{ question.optionA || '无' }}</li>
                    <li class="recommend-option-item">B. {{ question.optionB || '无' }}</li>
                    <li class="recommend-option-item">C. {{ question.optionC || '无' }}</li>
                    <li class="recommend-option-item">D. {{ question.optionD || '无' }}</li>
                  </ul>
                  <p v-else class="question-brief">当前题型无选项</p>
                </div>
                <div class="recommend-item-actions">
                  <span class="selection-tip">点击后在主界面查看详情</span>
                  <button
                    type="button"
                    class="ghost-btn compact-btn"
                    :disabled="!activePracticeSetId || practiceSetActionSubmitting"
                    @click.stop="addQuestionById(question.id)"
                  >
                    添加习题
                  </button>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </section>
    </div>

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
import {
  addQuestionToPracticeSet,
  createPracticeSet,
  getPracticeCourses,
  getPracticeQuestionDetail,
  getPracticeQuestionPool,
  getPracticeRecommendation,
  getPracticeSets,
} from './api.js';

const props = defineProps({
  userType: {
    type: String,
    default: 'student',
  },
});

const particleCanvas = ref(null);
const userInfo = ref(null);
const courseOptions = ref([]);
const courseLoading = ref(false);
const courseErrorMessage = ref('');
const selectedCourse = ref('');
const selectedQuestionType = ref('choice');
const questionPool = ref([]);
const questionPoolLoading = ref(false);
const questionPoolErrorMessage = ref('');
const selectedQuestionId = ref(null);
const previewQuestionDetail = ref(null);
const previewLoading = ref(false);
const previewErrorMessage = ref('');
const showRecommendationModal = ref(false);
const recommendCourse = ref('');
const recommendQuestionType = ref('choice');
const recommendRequirement = ref('');
const recommendSubmitting = ref(false);
const recommendErrorMessage = ref('');
const recommendationQuestions = ref([]);
const recommendationUserBrief = ref('');
const practiceSets = ref([]);
const practiceSetLoading = ref(false);
const practiceSetSubmitting = ref(false);
const practiceSetActionSubmitting = ref(false);
const practiceSetStatusMessage = ref('');
const practiceSetStatusError = ref(false);
const practiceSetName = ref('');
const activePracticeSetId = ref(null);

const questionTypeOptions = [
  { value: 'choice', label: '选择题', tip: '适合快速强化训练' },
  { value: 'fill', label: '填空题', tip: '适合核心概念记忆' },
  { value: 'subjective', label: '主观题', tip: '适合综合表达训练' },
  { value: 'custom', label: '自定义题', tip: '适合图片题目浏览' },
];

const displayRoleLabel = computed(() =>
  getUserTypeLabel(userInfo.value?.type || props.userType)
);
const selectedTypeLabel = computed(
  () =>
    questionTypeOptions.find((item) => item.value === selectedQuestionType.value)?.label || '未选题型'
);
const previewTypeLabel = computed(
  () =>
    questionTypeOptions.find((item) => item.value === previewQuestionDetail.value?.type)?.label ||
    '题目'
);
const activePracticeSet = computed(
  () => practiceSets.value.find((item) => item.id === activePracticeSetId.value) || null
);
const currentPracticeSetIndex = computed(() =>
  Math.max(
    0,
    practiceSets.value.findIndex((item) => item.id === activePracticeSetId.value)
  )
);

let animationFrameId = null;
let cleanupParticles = null;

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

  for (let index = 0; index < 60; index += 1) {
    particles.push(new Particle());
  }

  for (let index = 0; index < 4; index += 1) {
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

const loadCourses = async () => {
  courseLoading.value = true;
  courseErrorMessage.value = '';
  try {
    const response = await getPracticeCourses();
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取科目列表失败');
    }
    courseOptions.value = Array.isArray(response.data) ? response.data : [];
    if (!courseOptions.value.length) {
      selectedCourse.value = '';
      questionPool.value = [];
      previewQuestionDetail.value = null;
      return;
    }
    if (!selectedCourse.value || !courseOptions.value.includes(selectedCourse.value)) {
      selectedCourse.value = courseOptions.value[0];
    }
    if (!recommendCourse.value || !courseOptions.value.includes(recommendCourse.value)) {
      recommendCourse.value = selectedCourse.value;
    }
    await loadQuestionPool();
  } catch (error) {
    courseOptions.value = [];
    selectedCourse.value = '';
    questionPool.value = [];
    previewQuestionDetail.value = null;
    courseErrorMessage.value = error.message || '获取科目列表失败';
  } finally {
    courseLoading.value = false;
  }
};

const loadPracticeSets = async () => {
  practiceSetLoading.value = true;
  practiceSetStatusMessage.value = '';
  practiceSetStatusError.value = false;
  try {
    const response = await getPracticeSets();
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取题单失败');
    }
    practiceSets.value = Array.isArray(response.data) ? response.data : [];
    if (!practiceSets.value.length) {
      activePracticeSetId.value = null;
      return;
    }
    if (!practiceSets.value.some((item) => item.id === activePracticeSetId.value)) {
      activePracticeSetId.value = practiceSets.value[0].id;
    }
  } catch (error) {
    practiceSets.value = [];
    activePracticeSetId.value = null;
    practiceSetStatusMessage.value = error.message || '获取题单失败';
    practiceSetStatusError.value = true;
  } finally {
    practiceSetLoading.value = false;
  }
};

const loadQuestionPool = async () => {
  if (!selectedCourse.value || !selectedQuestionType.value) {
    questionPool.value = [];
    selectedQuestionId.value = null;
    previewQuestionDetail.value = null;
    return;
  }

  questionPoolLoading.value = true;
  questionPoolErrorMessage.value = '';
  previewQuestionDetail.value = null;
  selectedQuestionId.value = null;

  try {
    const response = await getPracticeQuestionPool(
      selectedCourse.value,
      selectedQuestionType.value
    );
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取题目列表失败');
    }
    questionPool.value = Array.isArray(response.data) ? response.data : [];
    if (questionPool.value.length > 0) {
      await selectQuestion(questionPool.value[0]);
    }
  } catch (error) {
    questionPool.value = [];
    questionPoolErrorMessage.value = error.message || '获取题目列表失败';
  } finally {
    questionPoolLoading.value = false;
  }
};

const selectQuestion = async (item) => {
  if (!item?.id) return;
  selectedQuestionId.value = item.id;
  previewLoading.value = true;
  previewErrorMessage.value = '';

  try {
    const response = await getPracticeQuestionDetail(item.id);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取题目详情失败');
    }
    previewQuestionDetail.value = response.data || null;
  } catch (error) {
    previewQuestionDetail.value = null;
    previewErrorMessage.value = error.message || '获取题目详情失败';
  } finally {
    previewLoading.value = false;
  }
};

const selectCourse = async (course) => {
  if (selectedCourse.value === course) return;
  selectedCourse.value = course;
  await loadQuestionPool();
};

const selectQuestionType = async (questionType) => {
  if (selectedQuestionType.value === questionType) return;
  selectedQuestionType.value = questionType;
  await loadQuestionPool();
};

const openRecommendationModal = () => {
  recommendCourse.value = selectedCourse.value || courseOptions.value[0] || '';
  recommendQuestionType.value = selectedQuestionType.value || 'choice';
  recommendErrorMessage.value = '';
  showRecommendationModal.value = true;
};

const closeRecommendationModal = () => {
  showRecommendationModal.value = false;
};

const submitRecommendation = async () => {
  recommendSubmitting.value = true;
  recommendErrorMessage.value = '';
  recommendationQuestions.value = [];
  recommendationUserBrief.value = '';

  try {
    const response = await getPracticeRecommendation({
      course: recommendCourse.value,
      type: recommendQuestionType.value,
      requirement: recommendRequirement.value,
      limit: 10,
    });
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取推荐结果失败');
    }
    recommendationUserBrief.value = response.data?.userBrief || '';
    recommendationQuestions.value = Array.isArray(response.data?.questions)
      ? response.data.questions
      : [];
  } catch (error) {
    recommendationQuestions.value = [];
    recommendationUserBrief.value = '';
    recommendErrorMessage.value = error.message || '获取推荐结果失败';
  } finally {
    recommendSubmitting.value = false;
  }
};

const previewRecommendedQuestion = async (question) => {
  if (!question?.id) return;
  selectedCourse.value = question.course || recommendCourse.value || selectedCourse.value;
  selectedQuestionType.value = question.type || recommendQuestionType.value || selectedQuestionType.value;
  selectedQuestionId.value = question.id;
  previewQuestionDetail.value = question;
  previewErrorMessage.value = '';
  previewLoading.value = false;
  closeRecommendationModal();
};

const handleCreatePracticeSet = async () => {
  practiceSetSubmitting.value = true;
  practiceSetStatusMessage.value = '';
  practiceSetStatusError.value = false;
  try {
    const response = await createPracticeSet({ name: practiceSetName.value });
    if (response.status !== 'success') {
      throw new Error(response.msg || '创建题单失败');
    }
    practiceSetName.value = '';
    practiceSetStatusMessage.value = response.msg || '题单创建成功';
    activePracticeSetId.value = response.data?.id || null;
    await loadPracticeSets();
  } catch (error) {
    practiceSetStatusMessage.value = error.message || '创建题单失败';
    practiceSetStatusError.value = true;
  } finally {
    practiceSetSubmitting.value = false;
  }
};

// 题单轮播以中央题单为当前目标，左右按钮只切换 activePracticeSetId。
const switchPracticeSet = (direction) => {
  if (!practiceSets.value.length) {
    return;
  }
  const currentIndex = currentPracticeSetIndex.value;
  const total = practiceSets.value.length;
  const nextIndex = (currentIndex + direction + total) % total;
  activePracticeSetId.value = practiceSets.value[nextIndex]?.id ?? null;
};

const addQuestionById = async (questionID) => {
  if (!activePracticeSetId.value) {
    practiceSetStatusMessage.value = '请先创建或选择一个题单';
    practiceSetStatusError.value = true;
    return;
  }
  practiceSetActionSubmitting.value = true;
  practiceSetStatusMessage.value = '';
  practiceSetStatusError.value = false;
  try {
    const response = await addQuestionToPracticeSet({
      setID: activePracticeSetId.value,
      questionID,
    });
    if (response.status !== 'success') {
      throw new Error(response.msg || '添加习题失败');
    }
    practiceSetStatusMessage.value = response.msg || '已添加到题单';
    await loadPracticeSets();
  } catch (error) {
    practiceSetStatusMessage.value = error.message || '添加习题失败';
    practiceSetStatusError.value = true;
  } finally {
    practiceSetActionSubmitting.value = false;
  }
};

const addCurrentQuestionToSet = async () => {
  if (!previewQuestionDetail.value?.id) {
    return;
  }
  await addQuestionById(previewQuestionDetail.value.id);
};

const openPracticeSetSession = (setID) => {
  const targetSetId = setID || activePracticeSetId.value;
  if (!targetSetId) {
    return;
  }
  activePracticeSetId.value = targetSetId;
  window.location.href = `${ROUTES.STUDENT_PRACTICE_SESSION}?setID=${targetSetId}`;
};

const goBackToMenu = () => {
  window.location.href = ROUTES.STUDENT_MENU;
};

onMounted(async () => {
  cleanupParticles = initParticles();
  const storedUser = getStoredUser();
  userInfo.value = normalizeDashboardUser(storedUser || {});
  await loadPracticeSets();
  await loadCourses();
});

onUnmounted(() => {
  if (cleanupParticles) cleanupParticles();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.practice-page {
  position: relative;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

.top-bar,
.set-bar,
.main-layout,
.back-btn,
.modal-overlay {
  position: relative;
  z-index: 1;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px 0;
  flex-shrink: 0;
}

.user-info,
.top-actions,
.sidebar-panel,
.content-panel,
.recommend-modal {
  backdrop-filter: blur(24px);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
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

.top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.set-bar-main,
.set-create-form,
.set-carousel,
.preview-actions,
.recommend-item-actions {
  display: flex;
  gap: 12px;
}

.set-bar {
  margin: 8px 24px 0;
  padding: 10px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(24px);
  flex-shrink: 0;
}

.set-bar-main {
  align-items: center;
  justify-content: space-between;
}

.set-bar-main .panel-copy {
  display: none; /* Hide the subtitle to save vertical space */
}

.set-bar-main h2 {
  font-size: 16px;
  margin: 0;
}

.set-bar-main .panel-kicker {
  display: none; /* Hide the kicker to save space */
}

.set-create-form {
  min-width: 320px;
  align-items: center;
}

.compact-input {
  min-width: 180px;
  padding: 8px 12px;
}

.set-carousel-wrap {
  margin-top: 8px;
}

.set-carousel {
  align-items: center;
  justify-content: center;
}

.set-carousel-index {
  margin: 8px 0 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.carousel-btn {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #eef3ff;
  font-size: 24px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.carousel-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.set-chip-center {
  min-width: min(560px, calc(100vw - 220px));
  justify-content: space-between;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
}

.set-name {
  max-width: min(380px, 50vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.set-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #eef3ff;
  cursor: pointer;
}

.set-chip.active,
.set-chip:hover {
  border-color: rgba(96, 165, 250, 0.45);
  background: rgba(37, 99, 235, 0.16);
}

.main-layout {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(200px, 1fr) minmax(0, 3fr);
  gap: 18px;
  padding: 20px 28px 96px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar-panel,
.content-panel {
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.sidebar-panel {
  padding: 16px;
}

.content-panel {
  padding: 18px;
}

.panel-header,
.sub-panel-header,
.recommend-item-header,
.preview-meta,
.header-tags,
.form-actions,
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-kicker {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9db3ff;
}

.panel-header h2,
.modal-header h2,
.sub-panel-header h3,
.placeholder-panel h3 {
  margin: 0;
}

.panel-copy,
.sub-panel-header p,
.placeholder-panel p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  line-height: 1.6;
}

.panel-badge,
.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.header-tags {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.selection-list,
.question-list,
.recommend-list {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.course-scroll-area,
.type-scroll-area,
.question-scroll-area,
.preview-scroll-area {
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.recommend-form-panel,
.recommend-result-panel {
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.selection-item,
.question-list-item,
.recommend-item {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 14px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.selection-item:hover,
.question-list-item:hover,
.recommend-item:hover,
.selection-item.active,
.question-list-item.active {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.45);
  background: rgba(37, 99, 235, 0.16);
}

.selection-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.selection-tip,
.question-id {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(0, 2fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 18px;
  margin-top: 18px;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.pool-panel,
.preview-panel {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.question-list,
.recommend-list {
  padding-right: 6px;
}

.question-brief,
.preview-text {
  margin: 8px 0 0;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: #eef3ff;
}

.preview-content {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex: 1;
  padding-right: 6px;
}

.preview-meta,
.recommend-item-header {
  align-items: center;
  flex-wrap: wrap;
}

.preview-actions,
.recommend-item-actions {
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.preview-block,
.recommend-brief-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.recommend-content-block {
  margin-top: 12px;
}

.recommend-option-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.recommend-option-item {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  padding: 8px 10px;
  line-height: 1.6;
}

.preview-label {
  margin: 0;
  color: #c7d2fe;
  font-size: 13px;
  font-weight: 700;
}

.option-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.option-item,
.image-shell {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.option-item {
  padding: 14px;
  line-height: 1.7;
}

.image-shell {
  overflow: hidden;
}

.preview-image {
  display: block;
  width: 100%;
  max-height: 520px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.18);
}

.placeholder-panel {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.72);
}

.status-text {
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.7;
}

.status-text.error {
  color: #fca5a5;
}

.primary-btn,
.ghost-btn,
.back-btn,
.close-btn {
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease;
}

.primary-btn,
.ghost-btn {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
}

.primary-btn {
  background: linear-gradient(135deg, #4f7dff, #66b3ff);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.28);
}

/* 增强智能推荐按钮的样式 */
.top-actions .primary-btn {
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2);
  animation: glowPulse 2s infinite alternate;
  font-weight: bold;
  letter-spacing: 1px;
}

@keyframes glowPulse {
  0% {
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2);
  }
  100% {
    box-shadow: 0 0 25px rgba(124, 58, 237, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.4);
  }
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #eef3ff;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.primary-btn:hover,
.ghost-btn:hover,
.back-btn:hover,
.close-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.compact-btn {
  min-height: 32px;
  padding: 0 12px;
  font-size: 13px;
}

.preview-actions .ghost-btn.compact-btn,
.recommend-item-actions .ghost-btn.compact-btn {
  background: rgba(37, 99, 235, 0.2);
  border-color: rgba(96, 165, 250, 0.4);
  color: #93c5fd;
  font-weight: 600;
  transition: all 0.2s ease;
}

.preview-actions .ghost-btn.compact-btn:hover:not(:disabled),
.recommend-item-actions .ghost-btn.compact-btn:hover:not(:disabled) {
  background: rgba(37, 99, 235, 0.4);
  border-color: rgba(96, 165, 250, 0.8);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.back-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2;
  padding: 10px 18px;
  border-radius: 12px;
  background: rgba(122, 162, 255, 0.35);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid rgba(122, 162, 255, 0.55);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(7, 10, 20, 0.72);
}

.recommend-modal {
  width: min(1180px, 100%);
  height: min(800px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(20, 24, 38, 0.92);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.35);
  padding: 24px;
}

.close-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 22px;
}

.recommend-layout {
  display: grid;
  grid-template-columns: minmax(320px, 360px) minmax(0, 1fr);
  gap: 18px;
  margin-top: 20px;
  flex: 1;
  min-height: 0;
}

.recommend-form-panel,
.recommend-result-panel {
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 18px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.course-scroll-area,
.type-scroll-area,
.question-scroll-area,
.preview-scroll-area,
.recommend-list,
.recommend-form-panel,
.recommend-result-panel {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.75) rgba(15, 23, 42, 0.25);
}

.course-scroll-area::-webkit-scrollbar,
.type-scroll-area::-webkit-scrollbar,
.question-scroll-area::-webkit-scrollbar,
.preview-scroll-area::-webkit-scrollbar,
.recommend-list::-webkit-scrollbar,
.recommend-form-panel::-webkit-scrollbar,
.recommend-result-panel::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.course-scroll-area::-webkit-scrollbar-track,
.type-scroll-area::-webkit-scrollbar-track,
.question-scroll-area::-webkit-scrollbar-track,
.preview-scroll-area::-webkit-scrollbar-track,
.recommend-list::-webkit-scrollbar-track,
.recommend-form-panel::-webkit-scrollbar-track,
.recommend-result-panel::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.25);
  border-radius: 999px;
}

.course-scroll-area::-webkit-scrollbar-thumb,
.type-scroll-area::-webkit-scrollbar-thumb,
.question-scroll-area::-webkit-scrollbar-thumb,
.preview-scroll-area::-webkit-scrollbar-thumb,
.recommend-list::-webkit-scrollbar-thumb,
.recommend-form-panel::-webkit-scrollbar-thumb,
.recommend-result-panel::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.75);
  border-radius: 999px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #dbe6ff;
}

.input-control,
.textarea-control {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #eef3ff;
  font-size: 14px;
  padding: 12px 14px;
  box-sizing: border-box;
}

.input-control option,
.input-control optgroup {
  color: #0f172a;
  background: #f8fbff;
}

.input-control:focus,
.textarea-control:focus {
  outline: none;
  border-color: rgba(96, 165, 250, 0.56);
}

.textarea-control {
  resize: vertical;
  min-height: 160px;
  line-height: 1.7;
}

.field-tip {
  align-self: flex-end;
  color: rgba(255, 255, 255, 0.56);
  font-size: 12px;
}

@media (max-width: 1280px) {
  .main-layout {
    grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) minmax(0, 3fr);
  }

  .content-grid {
    grid-template-columns: minmax(240px, 1fr) minmax(0, 2fr);
  }
}

@media (max-width: 1080px) {
  .set-bar-main {
    flex-direction: column;
  }

  .set-create-form {
    min-width: 0;
    width: 100%;
  }

  .set-chip-center {
    min-width: min(520px, calc(100vw - 130px));
  }

  .main-layout {
    grid-template-columns: 1fr;
  }

  .content-grid,
  .recommend-layout {
    grid-template-columns: 1fr;
  }

  .pool-panel,
  .preview-panel,
  .recommend-form-panel,
  .recommend-result-panel {
    min-height: auto;
  }

  .question-list,
  .recommend-list {
    max-height: none;
  }
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .set-bar {
    margin: 18px 18px 0;
  }

  .top-actions {
    width: 100%;
    justify-content: stretch;
  }

  .top-actions > button {
    flex: 1;
  }

  .content-panel,
  .sidebar-panel,
  .recommend-modal {
    padding: 18px;
  }

  .set-create-form {
    flex-direction: column;
  }

  .compact-input {
    width: 100%;
  }

  .set-chip-center {
    min-width: min(360px, calc(100vw - 100px));
  }

  .option-list {
    grid-template-columns: 1fr;
  }
}
</style>
