<template>
  <div class="exam-detail-page">
    <canvas ref="particleCanvas" class="particle-background"></canvas>

    <main class="main-content">
      <section class="content-panel">
        <header class="exam-header">
          <div>
            <p class="panel-kicker">Student Exam</p>
            <h1>{{ assignment.assignmentName || '考试详情' }}</h1>
            <p class="assignment-meta">
              <span>所属小组：{{ assignment.groupName || '-' }}</span>
              <span>开始：{{ formatDateTime(assignment.beginTime) }}</span>
              <span>结束：{{ formatDateTime(assignment.endTime) }}</span>
            </p>
            <p class="progress-meta">
              已答：{{ answeredCount }} / 总题数：{{ questions.length }}
              <span v-if="unansweredCount > 0">，还有 {{ unansweredCount }} 道题未作答</span>
              <span v-else>，已全部作答</span>
            </p>
            <p v-if="lastSavedAt" class="save-meta">最近保存：{{ lastSavedAt }}</p>
          </div>
          <div class="countdown-box" :class="{ ended: isExpired }">
            <span class="countdown-label">倒计时</span>
            <strong>{{ countdownText }}</strong>
          </div>
        </header>

        <div v-if="isLoading" class="loading-grid">
          <div v-for="index in 3" :key="index" class="question-skeleton"></div>
        </div>

        <div v-else-if="errorMessage" class="feedback-box error-box">
          <p>{{ errorMessage }}</p>
          <button type="button" class="retry-btn" @click="initializePage">重新加载</button>
        </div>

        <div v-else-if="questions.length === 0" class="feedback-box empty-box">
          <p>试卷暂无题目</p>
        </div>

        <div v-else class="exam-body">
          <div class="question-grid">
            <article
              v-for="(question, index) in questions"
              :key="question.questionID"
              :id="`question-item-${question.questionID}`"
              class="question-card"
            >
              <div class="question-header">
                <span class="question-index">第 {{ index + 1 }} 题</span>
                <span class="question-type">{{ getQuestionTypeText(question.type) }}</span>
              </div>
              <p v-if="question.brief" class="question-brief">
                {{ question.brief }}
              </p>
              <p v-if="question.type !== 'custom' && question.content" class="question-content">
                {{ question.content }}
              </p>

              <div v-if="question.type === 'choice'" class="answer-block">
                <label
                  v-for="option in question.options || []"
                  :key="`${question.questionID}-${option.key}`"
                  class="option-item"
                >
                  <input
                    type="radio"
                    :name="`choice-${question.questionID}`"
                    :value="option.key"
                    v-model="studentAnswers[question.questionID].content"
                  />
                  <span>{{ option.key }}. {{ option.text }}</span>
                </label>
              </div>

              <div v-else-if="question.type === 'custom'" class="answer-block">
                <div v-if="question.imageURL" class="image-wrapper">
                  <button
                    type="button"
                    class="image-preview-trigger"
                    @click="openImageLightbox(resolveImageUrl(question.imageURL), '题目图片')"
                  >
                    <img :src="resolveImageUrl(question.imageURL)" alt="题目图片" />
                  </button>
                </div>
              </div>

              <div class="response-editor">
                <span class="response-label">文字作答</span>
                <textarea
                  class="text-area"
                  rows="4"
                  placeholder="请输入你的作答内容"
                  v-model="ensureAnswerState(question.questionID).content"
                ></textarea>

                <div class="upload-row">
                  <label class="upload-btn">
                    <input
                      :key="answerImageInputKeys[question.questionID]"
                      type="file"
                      accept="image/*"
                      class="file-input"
                      @change="handleAnswerImageChange(question.questionID, $event)"
                    />
                    上传图片
                  </label>
                  <span
                    v-if="getAnswerImageLabel(question.questionID)"
                    class="upload-file-name"
                  >
                    {{ getAnswerImageLabel(question.questionID) }}
                  </span>
                  <button
                    v-if="hasAnswerImage(question.questionID)"
                    type="button"
                    class="remove-image-btn"
                    @click="removeAnswerImage(question.questionID)"
                  >
                    移除图片
                  </button>
                </div>

                <div v-if="hasAnswerImage(question.questionID)" class="answer-image-preview">
                  <div class="answer-image-preview-header">
                    <span>已上传图片</span>
                  </div>
                  <button
                    type="button"
                    class="image-preview-trigger"
                    @click="
                      openImageLightbox(
                        getAnswerPreviewUrl(question.questionID),
                        `第 ${index + 1} 题作答图片`
                      )
                    "
                  >
                    <img :src="getAnswerPreviewUrl(question.questionID)" alt="作答图片预览" />
                  </button>
                </div>
              </div>
            </article>
          </div>

          <aside class="answer-sheet">
            <div class="answer-sheet-header">
              <h3>答题卡</h3>
              <span>{{ answeredCount }}/{{ questions.length }}</span>
            </div>
            <div class="answer-sheet-grid">
              <button
                v-for="(question, index) in questions"
                :key="`sheet-${question.questionID}`"
                type="button"
                class="sheet-item"
                :class="{ answered: isQuestionAnswered(question.questionID) }"
                @click="scrollToQuestion(question.questionID)"
              >
                {{ index + 1 }}
              </button>
            </div>
            <div class="answer-sheet-legend">
              <span class="legend-item legend-answered">已答</span>
              <span class="legend-item legend-unanswered">未答</span>
            </div>
          </aside>
        </div>
      </section>
    </main>

    <div class="floating-actions">
      <button class="back-btn" type="button" :disabled="isSubmitting" @click="goBackToList">
        返回任务列表
      </button>
      <button class="submit-btn" type="button" :disabled="isSubmitting" @click="saveProgress">
        {{ isSubmitting ? '保存中...' : '保存作答' }}
      </button>
    </div>

    <div
      v-if="imageLightbox.visible"
      class="image-lightbox"
      role="dialog"
      aria-modal="true"
      @click.self="closeImageLightbox"
    >
      <div class="image-lightbox-panel">
        <div class="image-lightbox-header">
          <span>{{ imageLightbox.title || '图片预览' }}</span>
          <button type="button" class="image-lightbox-close" @click="closeImageLightbox">
            关闭
          </button>
        </div>
        <div class="image-lightbox-body">
          <img :src="imageLightbox.url" :alt="imageLightbox.title || '图片预览'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { API_BASE_URL, get, post } from '../../../shared/api/httpClient.js';
import { ROUTES } from '../../../shared/constants/routes.js';

const particleCanvas = ref(null);
const assignment = ref({});
const questions = ref([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const lastSavedAt = ref('');
const studentAnswers = reactive({});
const answerImageInputKeys = reactive({});
const imageLightbox = reactive({
  visible: false,
  url: '',
  title: '',
});

const queryParams = new URLSearchParams(window.location.search);
const assignmentIdRaw = queryParams.get('assignmentId') || '';
const assignmentId = Number.parseInt(assignmentIdRaw, 10);
const hasValidAssignmentId = Number.isInteger(assignmentId) && assignmentId > 0;
const saveEndpoint = '/student/exam/save';

let animationFrameId = null;
let particleCleanup = null;
let autoSaveTimerId = null;
let countdownTimerId = null;
let saveRequestChain = Promise.resolve();
const pendingImageConversions = new Map();
const remainingSeconds = ref(0);
const hasSubmissionCompleted = ref(false);

const storageKey = computed(() => `student_exam_answers_${assignmentIdRaw || 'unknown'}`);

const isExpired = computed(
  () => remainingSeconds.value <= 0 && Boolean(assignment.value?.endTime)
);
const countdownText = computed(() => {
  if (!assignment.value?.endTime) return '不限时';
  if (remainingSeconds.value <= 0) return '已结束';
  const hours = Math.floor(remainingSeconds.value / 3600);
  const minutes = Math.floor((remainingSeconds.value % 3600) / 60);
  const seconds = remainingSeconds.value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});
const createEmptyAnswerState = () => ({
  content: '',
  imgURL: '',
  imageData: '',
  imageFileName: '',
  localPreviewUrl: '',
  removeImage: false,
});
const revokeObjectUrl = (value) => {
  if (!value || !String(value).startsWith('blob:')) {
    return;
  }
  URL.revokeObjectURL(value);
};
const updateAnswerLocalPreview = (questionId, nextPreviewUrl = '') => {
  const answerState = ensureAnswerState(questionId);
  if (answerState.localPreviewUrl && answerState.localPreviewUrl !== nextPreviewUrl) {
    revokeObjectUrl(answerState.localPreviewUrl);
  }
  answerState.localPreviewUrl = nextPreviewUrl;
  return answerState;
};
const registerPendingImageConversion = (questionId, taskPromise) => {
  const trackedTask = Promise.resolve(taskPromise).finally(() => {
    if (pendingImageConversions.get(questionId) === trackedTask) {
      pendingImageConversions.delete(questionId);
    }
  });
  pendingImageConversions.set(questionId, trackedTask);
  return trackedTask;
};
const waitForPendingImageConversions = async () => {
  const taskList = Array.from(pendingImageConversions.values());
  if (taskList.length === 0) {
    return;
  }
  await Promise.allSettled(taskList);
};
const ensureAnswerState = (questionId) => {
  const currentValue = studentAnswers[questionId];
  if (!currentValue || typeof currentValue !== 'object') {
    studentAnswers[questionId] = createEmptyAnswerState();
  }
  return studentAnswers[questionId];
};
const getExistingAnswerState = (questionId) => studentAnswers[questionId] || createEmptyAnswerState();
const hasAnswerImage = (questionId) => {
  const answerState = getExistingAnswerState(questionId);
  return Boolean(
    String(answerState.localPreviewUrl || '').trim() ||
      String(answerState.imageData || '').trim() ||
      String(answerState.imgURL || '').trim()
  );
};
const getAnswerImageLabel = (questionId) => {
  const answerState = getExistingAnswerState(questionId);
  if (answerState.imageFileName) {
    return answerState.imageFileName;
  }
  if (answerState.imgURL) {
    return '已上传图片';
  }
  return '';
};
const answeredQuestionIdSet = computed(() => {
  const answeredSet = new Set();
  questions.value.forEach((question) => {
    const answerState = getExistingAnswerState(question.questionID);
    const answerText = String(answerState.content || '').trim();
    if (answerText.length > 0 || hasAnswerImage(question.questionID)) {
      answeredSet.add(question.questionID);
    }
  });
  return answeredSet;
});
const answeredCount = computed(() => answeredQuestionIdSet.value.size);
const unansweredCount = computed(() =>
  Math.max(questions.value.length - answeredQuestionIdSet.value.size, 0)
);

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

const getQuestionTypeText = (type) => {
  if (type === 'choice') return '选择题';
  if (type === 'fill') return '填空题';
  if (type === 'subjective') return '主观题';
  if (type === 'custom') return '图片题';
  return '题目';
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return String(value);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
};

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith('/api/')) return imageUrl;
  if (imageUrl.startsWith('/')) return `${API_BASE_URL}${imageUrl}`;
  return `${API_BASE_URL}/${imageUrl}`;
};

const syncCountdown = () => {
  const endTime = assignment.value?.endTime;
  if (!endTime) {
    remainingSeconds.value = 0;
    return false;
  }
  const targetTime = new Date(endTime).getTime();
  if (Number.isNaN(targetTime)) {
    remainingSeconds.value = 0;
    return false;
  }
  const diffSeconds = Math.floor((targetTime - Date.now()) / 1000);
  remainingSeconds.value = diffSeconds > 0 ? diffSeconds : 0;
  return diffSeconds <= 0;
};

const clearCountdown = () => {
  if (countdownTimerId) {
    clearInterval(countdownTimerId);
    countdownTimerId = null;
  }
};

const clearAutoSave = () => {
  if (autoSaveTimerId) {
    clearInterval(autoSaveTimerId);
    autoSaveTimerId = null;
  }
};

const isQuestionAnswered = (questionId) => answeredQuestionIdSet.value.has(questionId);
const scrollToQuestion = (questionId) => {
  const targetElement = document.getElementById(`question-item-${questionId}`);
  if (!targetElement) return;
  targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('图片读取失败'));
  reader.readAsDataURL(file);
});

const getAnswerPreviewUrl = (questionId) => {
  const answerState = getExistingAnswerState(questionId);
  if (answerState.localPreviewUrl) {
    return answerState.localPreviewUrl;
  }
  if (answerState.imageData) {
    return answerState.imageData;
  }
  return answerState.imgURL ? resolveImageUrl(answerState.imgURL) : '';
};

const buildSubmitAnswers = () =>
  questions.value.map((question) => ({
    questionID: question.questionID,
    content: String(ensureAnswerState(question.questionID).content || ''),
    imgURL: String(ensureAnswerState(question.questionID).imgURL || ''),
    imageData: String(ensureAnswerState(question.questionID).imageData || ''),
    imageFileName: String(ensureAnswerState(question.questionID).imageFileName || ''),
    removeImage: Boolean(ensureAnswerState(question.questionID).removeImage),
  }));

const restoreAnswersFromLocal = () => {
  const cachedText = localStorage.getItem(storageKey.value);
  if (!cachedText) return false;
  let hasRestoredDraft = false;
  try {
    const cachedAnswers = JSON.parse(cachedText);
    if (!cachedAnswers || typeof cachedAnswers !== 'object') return false;
    questions.value.forEach((question) => {
      const cachedValue = cachedAnswers[question.questionID];
      if (typeof cachedValue === 'string') {
        const answerState = ensureAnswerState(question.questionID);
        hasRestoredDraft = hasRestoredDraft || String(answerState.content || '') !== cachedValue;
        answerState.content = cachedValue;
      } else if (cachedValue && typeof cachedValue === 'object') {
        const answerState = ensureAnswerState(question.questionID);
        const nextContent = String(cachedValue.content || '');
        const nextImgURL = String(cachedValue.imgURL || answerState.imgURL || '');
        const nextImageData = String(cachedValue.imageData || '');
        const nextImageFileName = String(cachedValue.imageFileName || '');
        const nextRemoveImage = Boolean(cachedValue.removeImage);
        hasRestoredDraft =
          hasRestoredDraft ||
          String(answerState.content || '') !== nextContent ||
          String(answerState.imgURL || '') !== nextImgURL ||
          String(answerState.imageData || '') !== nextImageData ||
          String(answerState.imageFileName || '') !== nextImageFileName ||
          Boolean(answerState.removeImage) !== nextRemoveImage;
        answerState.content = nextContent;
        answerState.imgURL = nextImgURL;
        answerState.imageData = nextImageData;
        answerState.imageFileName = nextImageFileName;
        answerState.removeImage = nextRemoveImage;
      }
    });
    return hasRestoredDraft;
  } catch {
    localStorage.removeItem(storageKey.value);
    return false;
  }
};

const persistAnswersToLocal = () => {
  try {
    const payload = {};
    questions.value.forEach((question) => {
      const answerState = getExistingAnswerState(question.questionID);
      payload[question.questionID] = {
        content: String(answerState.content || ''),
        imgURL: String(answerState.imgURL || ''),
        imageData: answerState.imgURL ? '' : String(answerState.imageData || ''),
        imageFileName: String(answerState.imageFileName || ''),
        removeImage: Boolean(answerState.removeImage),
      };
    });
    localStorage.setItem(storageKey.value, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist answers to localStorage:', error);
  }
};

const syncSavedAnswers = (savedAnswerList = []) => {
  const savedAnswerMap = new Map(
    (Array.isArray(savedAnswerList) ? savedAnswerList : []).map((item) => [
      Number(item.questionID),
      item,
    ])
  );

  questions.value.forEach((question) => {
    const answerState = ensureAnswerState(question.questionID);
    const savedAnswer = savedAnswerMap.get(question.questionID);
    if (!savedAnswer) {
      return;
    }
    const hasPendingLocalImage = Boolean(answerState.localPreviewUrl || answerState.imageData);
    answerState.content = String(savedAnswer.content || '');
    const savedImageUrl = String(savedAnswer.imgURL || '');
    if (savedImageUrl) {
      revokeObjectUrl(answerState.localPreviewUrl);
      answerState.localPreviewUrl = '';
      answerState.imgURL = savedImageUrl;
      answerState.imageData = '';
      answerState.removeImage = false;
      if (!answerState.imageFileName) {
        answerState.imageFileName = '已上传图片';
      }
      return;
    }
    if (hasPendingLocalImage) {
      answerState.imgURL = '';
      answerState.removeImage = false;
      return;
    }
    revokeObjectUrl(answerState.localPreviewUrl);
    answerState.localPreviewUrl = '';
    answerState.imgURL = '';
    answerState.imageData = '';
    answerState.imageFileName = '';
    answerState.removeImage = false;
  });
};

watch(
  studentAnswers,
  () => {
    persistAnswersToLocal();
  },
  { deep: true }
);

const startAutoSave = () => {
  clearAutoSave();
  autoSaveTimerId = setInterval(async () => {
    await saveAnswers('save', false);
  }, 30000);
};

const startCountdown = () => {
  clearCountdown();
  countdownTimerId = setInterval(async () => {
    const hasExpired = syncCountdown();
    if (!hasExpired || hasSubmissionCompleted.value || isSubmitting.value) {
      return;
    }
    clearCountdown();
    await handleExamExpired();
  }, 1000);
  return syncCountdown();
};

const saveAnswers = async (mode = 'save', showError = false, { ignoreSubmitting = false } = {}) => {
  if (!hasValidAssignmentId || questions.value.length === 0 || (isSubmitting.value && !ignoreSubmitting)) {
    return false;
  }
  const queuedSave = saveRequestChain.catch(() => false).then(async () => {
    try {
      await waitForPendingImageConversions();
      const response = await post(saveEndpoint, {
        assignmentID: assignmentId,
        mode,
        answers: buildSubmitAnswers(),
      });
      syncSavedAnswers(response?.data?.answers || []);
      lastSavedAt.value = String(response?.data?.savedAt || lastSavedAt.value || '');
      return true;
    } catch (error) {
      if (showError) {
        window.alert(error?.message || '保存失败，请稍后重试');
      }
      return false;
    }
  });
  saveRequestChain = queuedSave.then(() => undefined, () => undefined);
  return queuedSave;
};
const saveProgress = async ({ silent = false } = {}) => {
  if (isSubmitting.value) {
    return false;
  }
  isSubmitting.value = true;
  const ok = await saveAnswers('save', !silent, { ignoreSubmitting: true });
  isSubmitting.value = false;
  if (!ok) {
    if (!silent) {
      window.alert('保存失败，请稍后重试');
    }
    return false;
  }
  if (!silent) {
    window.alert('作答已保存');
  }
  return true;
};
const handleExamExpired = async () => {
  if (hasSubmissionCompleted.value) {
    return;
  }
  hasSubmissionCompleted.value = true;
  clearAutoSave();
  clearCountdown();
  const ok = await saveProgress({ silent: true });
  window.alert(ok ? '考试时间已结束，系统已自动保存作答。' : '考试时间已结束，自动保存失败，本地作答已保留。');
  window.location.href = ROUTES.STUDENT_EXAM_LIST;
};
const flushAnswersOnPageHide = () => {
  if (
    !hasValidAssignmentId ||
    questions.value.length === 0 ||
    isLoading.value ||
    isSubmitting.value ||
    hasSubmissionCompleted.value
  ) {
    return;
  }
  const payload = {
    assignmentID: assignmentId,
    mode: 'save',
    answers: buildSubmitAnswers().map((answerItem) => ({
      ...answerItem,
      imageData: '',
    })),
  };
  post(saveEndpoint, payload, { keepalive: true }).catch(() => {});
};
const openImageLightbox = (imageUrl, title = '图片预览') => {
  if (!imageUrl) {
    return;
  }
  imageLightbox.visible = true;
  imageLightbox.url = imageUrl;
  imageLightbox.title = title;
};
const closeImageLightbox = () => {
  imageLightbox.visible = false;
  imageLightbox.url = '';
  imageLightbox.title = '';
};
const handleWindowKeydown = (event) => {
  if (event.key === 'Escape' && imageLightbox.visible) {
    closeImageLightbox();
  }
};

const handleAnswerImageChange = async (questionId, event) => {
  const selectedFile = event.target?.files?.[0] || null;
  if (!selectedFile) {
    return;
  }

  try {
    const previewUrl = URL.createObjectURL(selectedFile);
    const answerState = updateAnswerLocalPreview(questionId, previewUrl);
    answerState.imageFileName = selectedFile.name;
    answerState.imgURL = '';
    answerState.removeImage = false;
    answerState.imageData = '';
    await registerPendingImageConversion(
      questionId,
      fileToDataUrl(selectedFile).then((imageData) => {
        answerState.imageData = imageData;
      })
    );
    await nextTick();
    await saveAnswers('save', true);
  } catch (error) {
    window.alert(error?.message || '图片上传失败，请稍后重试');
  } finally {
    answerImageInputKeys[questionId] = (answerImageInputKeys[questionId] || 0) + 1;
  }
};

const removeAnswerImage = async (questionId) => {
  const answerState = ensureAnswerState(questionId);
  const previousValue = {
    content: answerState.content,
    imgURL: answerState.imgURL,
    imageData: answerState.imageData,
    imageFileName: answerState.imageFileName,
    localPreviewUrl: answerState.localPreviewUrl,
    removeImage: answerState.removeImage,
  };

  answerState.localPreviewUrl = '';
  answerState.imgURL = '';
  answerState.imageData = '';
  answerState.imageFileName = '';
  answerState.removeImage = true;
  answerImageInputKeys[questionId] = (answerImageInputKeys[questionId] || 0) + 1;

  const saved = await saveAnswers('save', true);
  if (!saved) {
    Object.assign(answerState, previousValue);
    return;
  }
  revokeObjectUrl(previousValue.localPreviewUrl);
};

const initializePage = async () => {
  if (!hasValidAssignmentId) {
    errorMessage.value = '无效的 assignmentId 参数';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  lastSavedAt.value = '';
  hasSubmissionCompleted.value = false;
  try {
    const response = await get(`/student/exam/${assignmentId}`);
    const data = response?.data || {};
    assignment.value = data.assignment || {};
    questions.value = Array.isArray(data.questions) ? data.questions : [];

    Object.values(studentAnswers).forEach((answerState) => {
      revokeObjectUrl(answerState?.localPreviewUrl);
    });
    Object.keys(studentAnswers).forEach((key) => delete studentAnswers[key]);
    Object.keys(answerImageInputKeys).forEach((key) => delete answerImageInputKeys[key]);
    questions.value.forEach((question) => {
      studentAnswers[question.questionID] = {
        ...createEmptyAnswerState(),
        content: String(question.studentAnswer?.content || ''),
        imgURL: String(question.studentAnswer?.imgURL || ''),
      };
      answerImageInputKeys[question.questionID] = 0;
    });

    const hasRestoredDraft = restoreAnswersFromLocal();
    if (hasRestoredDraft) {
      await saveAnswers('save', false);
    }
    startAutoSave();
    const hasExpired = startCountdown();
    if (hasExpired && !hasSubmissionCompleted.value && !isSubmitting.value) {
      await handleExamExpired();
    }
  } catch (error) {
    errorMessage.value = error?.message || '试卷加载失败，请稍后重试';
    clearAutoSave();
    clearCountdown();
  } finally {
    isLoading.value = false;
  }
};

const goBackToList = async () => {
  if (isSubmitting.value) {
    return;
  }
  const ok = await saveProgress({ silent: true });
  if (!ok) {
    window.alert('当前未能同步到服务器，已保留本地作答记录。');
  }
  window.location.href = ROUTES.STUDENT_EXAM_LIST;
};

onMounted(() => {
  particleCleanup = initParticles();
  window.addEventListener('keydown', handleWindowKeydown);
  window.addEventListener('pagehide', flushAnswersOnPageHide);
  initializePage();
});

onUnmounted(() => {
  clearAutoSave();
  clearCountdown();
  closeImageLightbox();
  window.removeEventListener('keydown', handleWindowKeydown);
  window.removeEventListener('pagehide', flushAnswersOnPageHide);
  Object.values(studentAnswers).forEach((answerState) => {
    revokeObjectUrl(answerState?.localPreviewUrl);
  });
  if (particleCleanup) particleCleanup();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.exam-detail-page {
  position: relative;
  display: flex;
  height: 100vh;
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
  flex: 1;
  justify-content: center;
  min-height: 0;
  padding: 24px 24px 88px;
  overflow: hidden;
}

.content-panel {
  width: 100%;
  max-width: 1260px;
  padding: 24px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.exam-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #9db3ff;
}

h1 {
  margin: 0;
  font-size: clamp(30px, 3.2vw, 44px);
  line-height: 1.08;
}

.assignment-meta {
  margin: 12px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.progress-meta {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.save-meta {
  margin: 8px 0 0;
  color: rgba(157, 179, 255, 0.88);
  font-size: 13px;
}

.countdown-box {
  min-width: 150px;
  height: fit-content;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(89, 215, 132, 0.45);
  background: rgba(35, 125, 63, 0.24);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.countdown-box.ended {
  border-color: rgba(220, 86, 86, 0.5);
  background: rgba(128, 45, 45, 0.3);
}

.countdown-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.countdown-box strong {
  margin-top: 2px;
  font-size: 20px;
  letter-spacing: 0.06em;
}

.exam-body {
  display: flex;
  gap: 18px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.question-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
}

.question-card {
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.26);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.question-index,
.question-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.question-index {
  color: #d8e5ff;
  background: rgba(122, 162, 255, 0.24);
  border: 1px solid rgba(122, 162, 255, 0.45);
}

.question-type {
  color: #c9f0ff;
  background: rgba(0, 140, 180, 0.26);
  border: 1px solid rgba(120, 207, 244, 0.45);
}

.question-brief {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 14px;
  line-height: 1.6;
}

.question-content {
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 15px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.answer-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 12px;
  cursor: pointer;
}

.option-item input {
  margin-top: 3px;
  accent-color: #7aa2ff;
}

.option-item span {
  flex: 1;
}

.text-input,
.text-area {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(10, 13, 22, 0.52);
  color: #f1f4ff;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  resize: vertical;
}

.text-input:focus,
.text-area:focus {
  border-color: rgba(122, 162, 255, 0.6);
  box-shadow: 0 0 0 3px rgba(122, 162, 255, 0.2);
}

.response-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(122, 162, 255, 0.18);
  background: rgba(122, 162, 255, 0.08);
}

.response-label {
  font-size: 13px;
  font-weight: 700;
  color: #dce8ff;
}

.upload-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.file-input {
  display: none;
}

.upload-btn,
.remove-image-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #f8fbff;
  background: rgba(122, 162, 255, 0.32);
  border-color: rgba(122, 162, 255, 0.5);
}

.remove-image-btn {
  color: #ffe3e3;
  background: rgba(170, 53, 53, 0.26);
  border-color: rgba(220, 86, 86, 0.5);
}

.upload-file-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.76);
  word-break: break-all;
}

.answer-image-preview {
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.24);
}

.image-preview-trigger {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: zoom-in;
}

.answer-image-preview-header {
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 700;
  color: #dce8ff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(122, 162, 255, 0.12);
}

.answer-image-preview img {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  display: block;
}

.image-wrapper {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.25);
}

.image-wrapper img {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  display: block;
}

.image-lightbox {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(5, 8, 16, 0.82);
  backdrop-filter: blur(10px);
}

.image-lightbox-panel {
  width: min(1080px, 100%);
  max-height: 100%;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(16, 20, 32, 0.96);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.image-lightbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #eef3ff;
  font-size: 14px;
  font-weight: 700;
}

.image-lightbox-close {
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: #eef3ff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.image-lightbox-body {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  max-height: calc(100vh - 120px);
}

.image-lightbox-body img {
  max-width: 100%;
  max-height: calc(100vh - 156px);
  object-fit: contain;
  display: block;
}

.answer-sheet {
  width: 300px;
  min-width: 300px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.26);
  padding: 14px;
  backdrop-filter: blur(16px);
  overflow-y: auto;
}

.answer-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.answer-sheet-header h3 {
  margin: 0;
  font-size: 15px;
}

.answer-sheet-header span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.76);
}

.answer-sheet-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.sheet-item {
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(10, 13, 22, 0.45);
  color: #e6ecff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sheet-item:hover {
  transform: translateY(-1px);
  border-color: rgba(122, 162, 255, 0.6);
}

.sheet-item.answered {
  border-color: rgba(89, 215, 132, 0.6);
  background: rgba(35, 125, 63, 0.42);
  color: #d4f6de;
}

.answer-sheet-legend {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.legend-item {
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.legend-answered {
  color: #d4f6de;
  background: rgba(35, 125, 63, 0.42);
  border: 1px solid rgba(89, 215, 132, 0.6);
}

.legend-unanswered {
  color: #e6ecff;
  background: rgba(10, 13, 22, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.24);
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
}

.question-skeleton {
  height: 240px;
  border-radius: 22px;
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
  min-height: 220px;
  border-radius: 22px;
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

.floating-actions {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10;
  display: flex;
  gap: 10px;
}

.back-btn,
.submit-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, background 0.2s ease;
}

.back-btn {
  border-color: rgba(122, 162, 255, 0.55);
  background: rgba(122, 162, 255, 0.35);
}

.submit-btn {
  border-color: rgba(89, 215, 132, 0.6);
  background: rgba(35, 125, 63, 0.4);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.back-btn:hover,
.submit-btn:hover:enabled {
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .content-panel {
    padding: 22px;
    border-radius: 24px;
  }

  .exam-header {
    flex-direction: column;
  }

  .countdown-box {
    width: 100%;
    align-items: flex-start;
  }

  .exam-body {
    flex-direction: column;
    overflow: visible;
  }

  .answer-sheet {
    width: 100%;
    min-width: 0;
  }

  .floating-actions {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }

  .back-btn,
  .submit-btn {
    flex: 1;
  }

  .image-lightbox {
    padding: 16px;
  }
}
</style>
