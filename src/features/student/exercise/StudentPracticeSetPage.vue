<template>
  <div class="practice-session-page">
    <canvas ref="particleCanvas" class="particle-background"></canvas>

    <header class="top-bar">
      <div class="header-copy">
        <p class="panel-kicker">Practice Session</p>
        <h1>{{ sessionTitle }}</h1>
        <p class="panel-copy">进入正式练习模式后，可按题号切换，右上角可查看答案与解析。</p>
      </div>

      <div class="top-actions">
        <button type="button" class="primary-btn" @click="toggleShowAnswer">
          {{ showAnswers ? '隐藏答案' : '查看答案' }}
        </button>
        <button type="button" class="ghost-btn" @click="goBackToPool">返回题库</button>
      </div>
    </header>

    <main class="session-layout">
      <section class="question-nav-panel">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">Questions</p>
            <h2>题号导航</h2>
          </div>
          <span class="panel-badge">{{ questionList.length }}</span>
        </div>

        <p v-if="loading" class="status-text">正在加载题单...</p>
        <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>
        <p v-else-if="!questionList.length" class="status-text">当前题单暂无题目</p>

        <ul v-else class="nav-list">
          <li
            v-for="(question, index) in questionList"
            :key="question.id"
            class="nav-item"
            :class="{ active: currentQuestionIndex === index }"
            @click="selectQuestion(index)"
          >
            <div class="nav-item-header">
              <span class="tag">第 {{ index + 1 }} 题</span>
              <span class="question-id">ID {{ question.id }}</span>
            </div>
            <p class="question-brief">{{ question.brief || question.content || '未提供摘要' }}</p>
          </li>
        </ul>
      </section>

      <section class="question-content-panel">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">Question</p>
            <h2>{{ currentTypeLabel }}</h2>
            <p class="panel-copy">
              {{ currentQuestion?.course || '未标注科目' }} · 第 {{ currentQuestionIndex + 1 || 1 }} 题
            </p>
          </div>
          <div class="header-tags">
            <span class="tag">{{ currentQuestion?.course || '未标注科目' }}</span>
            <span class="tag">题目ID {{ currentQuestion?.id || '--' }}</span>
          </div>
        </div>

        <p v-if="loading" class="status-text">正在准备做题页面...</p>
        <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>
        <div v-else-if="currentQuestion" class="question-content">
          <div class="content-block">
            <p class="block-label">题目简介</p>
            <p class="block-text">{{ currentQuestion.brief || '未提供简介' }}</p>
          </div>

          <template v-if="currentQuestion.type === 'choice'">
            <div class="content-block">
              <p class="block-label">题目内容</p>
              <p class="block-text">{{ currentQuestion.content || '未提供题干' }}</p>
            </div>
            <div class="option-grid">
              <label
                v-for="option in choiceOptions(currentQuestion)"
                :key="option.key"
                class="option-card"
                :class="{ 
                  selected: answerDrafts[currentQuestion.id] === option.key,
                  correct: shouldHighlightCorrectOption(currentQuestion, option.key),
                  incorrect: shouldHighlightIncorrectOption(currentQuestion, option.key)
                }"
              >
                <input
                  :checked="answerDrafts[currentQuestion.id] === option.key"
                  type="radio"
                  class="hidden-input"
                  :name="`question-${currentQuestion.id}`"
                  @change="onChoiceAnswerChange(currentQuestion, option.key)"
                />
                <span class="option-key">{{ option.key }}.</span>
                <span class="option-text">{{ option.value || '无' }}</span>
              </label>
            </div>
          </template>

          <template v-else-if="currentQuestion.type === 'fill'">
            <div class="content-block">
              <p class="block-label">题目内容</p>
              <p class="block-text">{{ currentQuestion.content || '未提供题干' }}</p>
            </div>
            <textarea
              v-model="answerDrafts[currentQuestion.id]"
              class="answer-input"
              rows="4"
              placeholder="请输入你的答案"
            ></textarea>
            <button
              type="button"
              class="primary-btn"
              :disabled="!answerDrafts[currentQuestion.id] || answerStatusMap[currentQuestion.id]?.submitted"
              @click="submitCurrentQuestionAnswer"
            >
              {{ answerStatusMap[currentQuestion.id]?.submitted ? '已提交' : '提交本题' }}
            </button>
          </template>

          <template v-else-if="currentQuestion.type === 'subjective'">
            <div class="content-block">
              <p class="block-label">题目内容</p>
              <p class="block-text">{{ currentQuestion.content || '未提供题干' }}</p>
            </div>
            <textarea
              v-model="answerDrafts[currentQuestion.id]"
              class="answer-input"
              rows="7"
              placeholder="请输入你的作答内容"
            ></textarea>
            <button
              type="button"
              class="primary-btn"
              :disabled="!answerDrafts[currentQuestion.id] || answerStatusMap[currentQuestion.id]?.submitted"
              @click="submitCurrentQuestionAnswer"
            >
              {{ answerStatusMap[currentQuestion.id]?.submitted ? '已提交' : '提交本题' }}
            </button>
          </template>

          <template v-else-if="currentQuestion.type === 'custom'">
            <div class="content-block">
              <p class="block-label">题目描述</p>
              <p class="block-text">{{ currentQuestion.brief || '自定义题' }}</p>
            </div>
            <div v-if="currentQuestion.imageURL" class="image-shell">
              <img :src="currentQuestion.imageURL" alt="自定义题" class="preview-image" />
            </div>
            <p v-else class="status-text">未提供图片资源</p>
          </template>

          <div v-if="showAnswers" class="answer-panel">
            <div class="content-block">
              <p class="block-label">参考答案</p>
              <p class="block-text">{{ currentQuestion.answer || '未提供答案' }}</p>
            </div>
            <div class="content-block">
              <p class="block-label">解析</p>
              <p class="block-text">{{ currentQuestion.explanation || '未提供解析' }}</p>
            </div>
          </div>

          <div class="session-actions">
            <p
              v-if="currentQuestion && answerStatusMap[currentQuestion.id]?.submitted"
              class="status-text"
              :class="{ success: answerStatusMap[currentQuestion.id]?.isCorrect, error: !answerStatusMap[currentQuestion.id]?.isCorrect }"
            >
              {{ answerStatusMap[currentQuestion.id]?.isCorrect ? '本题判定：正确' : '本题判定：错误' }}
            </p>
            <button
              type="button"
              class="ghost-btn"
              :disabled="currentQuestionIndex <= 0"
              @click="selectQuestion(currentQuestionIndex - 1)"
            >
              上一题
            </button>
            <button
              type="button"
              class="ghost-btn"
              :disabled="currentQuestionIndex >= questionList.length - 1"
              @click="selectQuestion(currentQuestionIndex + 1)"
            >
              下一题
            </button>
          </div>
        </div>
      </section>
    </main>

    <button class="back-btn" type="button" @click="goBackToPool">返回题库</button>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { ROUTES } from '../../../shared/constants/routes.js';
import { getPracticeSession, submitPracticeAnswerHistory } from './api.js';

const particleCanvas = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const sessionTitle = ref('练习题单');
const questionList = ref([]);
const currentQuestionIndex = ref(0);
const showAnswers = ref(false);
const answerDrafts = reactive({});
const answerStatusMap = reactive({});

let animationFrameId = null;
let cleanupParticles = null;

const currentQuestion = computed(() => questionList.value[currentQuestionIndex.value] || null);
const currentTypeLabel = computed(() => {
  const question = currentQuestion.value;
  if (!question) {
    return '练习题';
  }
  return (
    {
      choice: '选择题',
      fill: '填空题',
      subjective: '主观题',
      custom: '自定义题',
    }[question.type] || '练习题'
  );
});

const getSetIDFromLocation = () => {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get('setID') || 0);
};

const choiceOptions = (question) => [
  { key: 'A', value: question.optionA },
  { key: 'B', value: question.optionB },
  { key: 'C', value: question.optionC },
  { key: 'D', value: question.optionD },
];

const shouldHighlightCorrectOption = (question, optionKey) => {
  const selectedOption = answerDrafts[question.id];
  if (selectedOption) {
    return optionKey === question.answer;
  }
  return showAnswers.value && optionKey === question.answer;
};

const shouldHighlightIncorrectOption = (question, optionKey) => {
  const selectedOption = answerDrafts[question.id];
  return Boolean(selectedOption) && selectedOption === optionKey && optionKey !== question.answer;
};

const normalizeAnswer = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();

const evaluateAnswer = (question, userAnswer) => {
  if (!question || question.type === 'custom') {
    return null;
  }
  const expected = normalizeAnswer(question.answer);
  const submitted = normalizeAnswer(userAnswer);
  if (!expected || !submitted) {
    return null;
  }
  return submitted === expected;
};

const submitAnswerForQuestion = async (question, userAnswer) => {
  if (!question || answerStatusMap[question.id]?.submitted) {
    return;
  }
  const isCorrect = evaluateAnswer(question, userAnswer);
  if (typeof isCorrect !== 'boolean') {
    return;
  }
  const questionID = Number(question.id || 0);
  if (!Number.isInteger(questionID) || questionID <= 0) {
    return;
  }
  answerStatusMap[question.id] = {
    submitted: true,
    isCorrect,
  };
  try {
    await submitPracticeAnswerHistory({
      questionID,
      isCorrect,
    });
  } catch (_) {
  }
};

const submitCurrentQuestionAnswer = async () => {
  const question = currentQuestion.value;
  if (!question) {
    return;
  }
  await submitAnswerForQuestion(question, answerDrafts[question.id]);
};

const onChoiceAnswerChange = async (question, optionKey) => {
  if (!question) {
    return;
  }
  answerDrafts[question.id] = optionKey;
  await submitAnswerForQuestion(question, optionKey);
};

const selectQuestion = (index) => {
  if (index < 0 || index >= questionList.value.length) {
    return;
  }
  currentQuestionIndex.value = index;
};

const toggleShowAnswer = () => {
  showAnswers.value = !showAnswers.value;
};

const goBackToPool = () => {
  window.location.href = ROUTES.STUDENT_PRACTICE;
};

const clearReactiveRecord = (record) => {
  Object.keys(record).forEach((key) => {
    delete record[key];
  });
};

const initParticles = () => {
  const canvas = particleCanvas.value;
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    size: Math.random() * 2 + 0.5,
    alpha: Math.random() * 0.25 + 0.08,
  }));

  const animate = () => {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
      ctx.fillStyle = `rgba(200, 220, 255, ${particle.alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
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

const loadSession = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const setID = getSetIDFromLocation();
    if (!setID) {
      throw new Error('缺少题单 ID');
    }
    const response = await getPracticeSession(setID);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取题单失败');
    }
    sessionTitle.value = response.data?.set?.name || '练习题单';
    questionList.value = Array.isArray(response.data?.questions) ? response.data.questions : [];
    currentQuestionIndex.value = 0;
    clearReactiveRecord(answerDrafts);
    clearReactiveRecord(answerStatusMap);
  } catch (error) {
    questionList.value = [];
    errorMessage.value = error.message || '获取题单失败';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  cleanupParticles = initParticles();
  await loadSession();
});

onUnmounted(() => {
  if (cleanupParticles) cleanupParticles();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.practice-session-page {
  position: relative;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
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
.session-layout,
.back-btn {
  position: relative;
  z-index: 1;
}

.top-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 0;
  flex-shrink: 0;
}

.header-copy,
.question-nav-panel,
.question-content-panel {
  backdrop-filter: blur(24px);
}

.header-copy {
  padding: 18px 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

.top-actions,
.header-tags,
.panel-header,
.session-actions,
.nav-item-header {
  display: flex;
  gap: 12px;
}

.top-actions {
  align-items: center;
}

.panel-kicker {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9db3ff;
}

.panel-copy,
.status-text,
.question-id {
  color: rgba(255, 255, 255, 0.72);
}

.session-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 18px;
  padding: 20px 28px 96px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.question-nav-panel,
.question-content-panel {
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.question-nav-panel {
  padding: 16px;
}

.question-content-panel {
  padding: 18px;
}

.panel-header {
  justify-content: space-between;
  align-items: flex-start;
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

.nav-list {
  list-style: none;
  margin: 16px 0 0;
  padding: 0 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
}

.nav-item {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 14px;
  cursor: pointer;
}

.nav-item.active,
.nav-item:hover {
  border-color: rgba(96, 165, 250, 0.45);
  background: rgba(37, 99, 235, 0.16);
}

.question-brief,
.block-text {
  margin: 8px 0 0;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.question-content {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex: 1;
  padding-right: 6px;
}

.content-block,
.answer-panel,
.option-card,
.image-shell {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.content-block,
.answer-panel {
  padding: 16px;
}

.block-label {
  margin: 0;
  color: #c7d2fe;
  font-size: 13px;
  font-weight: 700;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.option-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  cursor: pointer;
}

.option-card.selected {
  border-color: rgba(96, 165, 250, 0.45);
  background: rgba(37, 99, 235, 0.16);
}

.option-card.correct {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.5);
  color: #a7f3d0;
}

.option-card.incorrect {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fecaca;
}

.hidden-input {
  display: none;
}

.option-key {
  font-weight: 700;
}

.answer-input {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #eef3ff;
  font-size: 14px;
  padding: 12px 14px;
  box-sizing: border-box;
  resize: vertical;
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

.session-actions {
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  row-gap: 8px;
}

.session-actions .status-text {
  margin: 0;
}

.session-actions .status-text.success {
  color: #86efac;
}

.session-actions .status-text.error {
  color: #fca5a5;
}

.primary-btn,
.ghost-btn,
.back-btn {
  border: none;
  cursor: pointer;
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

.primary-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #eef3ff;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.status-text.error {
  color: #fca5a5;
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
}

@media (max-width: 1080px) {
  .session-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .top-actions {
    width: 100%;
    justify-content: stretch;
  }

  .top-actions > button {
    flex: 1;
  }

  .option-grid {
    grid-template-columns: 1fr;
  }
}
</style>
