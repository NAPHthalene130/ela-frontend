<template>
  <div class="teacher-question-page">
    <header class="top-bar">
      <div class="title-area">
        <h1>题单管理</h1>
        <p>当前教师：{{ teacherId || '未获取到教师ID' }}</p>
      </div>
      <div class="actions">
        <button type="button" class="ghost-btn" @click="goMenu">返回菜单</button>
        <button type="button" class="danger-btn" @click="logout">退出登录</button>
      </div>
    </header>

    <main class="main-layout">
      <section class="set-list-panel">
        <div class="panel-header">
          <h2>我的题单</h2>
          <div class="panel-actions">
            <button type="button" class="refresh-btn" :disabled="setLoading" @click="loadQuestionSets">
              刷新
            </button>
          </div>
        </div>

        <p v-if="setLoading" class="status-text">正在加载题单...</p>
        <p v-else-if="setErrorMessage" class="status-text error">{{ setErrorMessage }}</p>
        <p v-else-if="questionSets.length === 0" class="status-text">暂无题单数据</p>

        <ul v-else class="set-list">
          <li
            v-for="setItem in questionSets"
            :key="setItem.id"
            class="set-item"
            :class="{ active: selectedSetId === setItem.id }"
            @click="selectQuestionSet(setItem.id)"
          >
            <p class="set-name">{{ setItem.name || `题单 #${setItem.id}` }}</p>
            <span class="set-id">ID: {{ setItem.id }}</span>
          </li>
        </ul>
      </section>

      <section class="question-detail-panel">
        <div class="panel-header">
          <h2>题目详情</h2>
          <div class="panel-actions">
            <span v-if="selectedSetId" class="tag">题单ID {{ selectedSetId }}</span>
            <button
              type="button"
              class="create-btn create-question-btn"
              @click="openCreateQuestionModal"
            >
              创建题目
            </button>
            <button
              type="button"
              class="create-btn"
              :disabled="!selectedSetId"
              @click="openAddQuestionModal"
            >
              添加题目
            </button>
          </div>
        </div>

        <p v-if="!selectedSetId" class="placeholder">请先在左侧选择题单</p>
        <p v-else-if="questionLoading" class="status-text">正在加载题目...</p>
        <p v-else-if="questionErrorMessage" class="status-text error">{{ questionErrorMessage }}</p>
        <p v-else-if="questions.length === 0" class="status-text">该题单暂无题目</p>

        <div v-else class="question-list">
          <article
            v-for="question in questions"
            :key="question.id"
            class="question-card"
          >
            <header class="question-card-header">
              <span class="question-type">{{ getTypeLabel(question.type) }}</span>
              <span class="question-id">题目ID: {{ question.id }}</span>
            </header>

            <template v-if="question.type === 'choice'">
              <p class="question-content">{{ question.content || '未提供题干' }}</p>
              <ul class="option-list">
                <li>A. {{ question.optionA || '无' }}</li>
                <li>B. {{ question.optionB || '无' }}</li>
                <li>C. {{ question.optionC || '无' }}</li>
                <li>D. {{ question.optionD || '无' }}</li>
              </ul>
            </template>

            <template v-else-if="question.type === 'fill' || question.type === 'subjective'">
              <p class="question-content">{{ question.content || '未提供题干' }}</p>
            </template>

            <template v-else-if="question.type === 'custom'">
              <div class="custom-image-wrap">
                <img
                  v-if="question.imageURL"
                  :src="question.imageURL"
                  alt="自定义题图片"
                  class="custom-image"
                />
                <p v-else class="status-text">未提供图片地址</p>
              </div>
            </template>

            <template v-else>
              <p class="status-text">未知题型</p>
            </template>
          </article>
        </div>
      </section>
    </main>

    <div v-if="showCreateQuestionModal" class="modal-overlay" @click.self="closeCreateQuestionModal">
      <section class="add-question-modal create-question-modal">
        <header class="modal-header">
          <div>
            <h2>创建题目</h2>
            <p>当前仅完成前端界面搭建，暂未接入上传后端逻辑</p>
          </div>
          <button type="button" class="close-btn" @click="closeCreateQuestionModal">×</button>
        </header>

        <div class="create-modal-grid">
          <section class="modal-column">
            <div class="modal-column-header">
              <h3>选择科目</h3>
              <span v-if="courseLoading" class="mini-status">加载中</span>
            </div>
            <p v-if="courseErrorMessage" class="status-text error">{{ courseErrorMessage }}</p>
            <p v-else-if="courseOptions.length === 0" class="status-text">暂无科目数据</p>
            <ul v-else class="selection-list">
              <li
                v-for="course in courseOptions"
                :key="`create-${course}`"
                class="selection-item"
                :class="{ active: createSelectedCourse === course }"
                @click="selectCreateCourse(course)"
              >
                {{ course }}
              </li>
            </ul>
          </section>

          <section class="modal-column">
            <div class="modal-column-header">
              <h3>题型选择</h3>
              <span v-if="createSelectedCourse" class="mini-status">当前科目：{{ createSelectedCourse }}</span>
            </div>
            <p v-if="!createSelectedCourse" class="status-text">请先选择左侧科目</p>
            <ul v-else class="selection-list">
              <li
                v-for="typeItem in questionTypeOptions"
                :key="`create-${typeItem.value}`"
                class="selection-item"
                :class="{ active: createSelectedQuestionType === typeItem.value }"
                @click="selectCreateQuestionType(typeItem.value)"
              >
                <span>{{ typeItem.label }}</span>
                <span class="selection-tip">{{ typeItem.tip }}</span>
              </li>
            </ul>
          </section>

          <section class="modal-column create-form-column">
            <div class="modal-column-header">
              <h3>题目填写</h3>
              <span v-if="createSelectedQuestionType" class="mini-status">
                {{ getTypeLabel(createSelectedQuestionType) }}
              </span>
            </div>

            <div
              v-if="!createSelectedCourse || !createSelectedQuestionType"
              class="placeholder-panel create-placeholder"
            >
              <p>请先选择科目和题型</p>
              <p class="placeholder-subtext">选择后在此填写题目内容</p>
            </div>

            <div v-else class="create-form-panel">
              <template v-if="createSelectedQuestionType === 'choice'">
                <label class="form-field">
                  <span class="form-label">题目</span>
                  <textarea
                    v-model="createQuestionForm.content"
                    class="form-textarea"
                    rows="5"
                    placeholder="请输入选择题题干"
                  />
                </label>

                <div class="form-grid">
                  <label class="form-field">
                    <span class="form-label">选项 A</span>
                    <input
                      v-model="createQuestionForm.optionA"
                      type="text"
                      class="form-input"
                      placeholder="请输入选项 A"
                    />
                  </label>
                  <label class="form-field">
                    <span class="form-label">选项 B</span>
                    <input
                      v-model="createQuestionForm.optionB"
                      type="text"
                      class="form-input"
                      placeholder="请输入选项 B"
                    />
                  </label>
                  <label class="form-field">
                    <span class="form-label">选项 C</span>
                    <input
                      v-model="createQuestionForm.optionC"
                      type="text"
                      class="form-input"
                      placeholder="请输入选项 C"
                    />
                  </label>
                  <label class="form-field">
                    <span class="form-label">选项 D</span>
                    <input
                      v-model="createQuestionForm.optionD"
                      type="text"
                      class="form-input"
                      placeholder="请输入选项 D"
                    />
                  </label>
                </div>

                <div class="form-field">
                  <span class="form-label">答案</span>
                  <div class="answer-selector">
                    <button
                      v-for="answerOption in ['A', 'B', 'C', 'D']"
                      :key="answerOption"
                      type="button"
                      class="answer-option-btn"
                      :class="{ active: createQuestionForm.answer === answerOption }"
                      @click="createQuestionForm.answer = answerOption"
                    >
                      {{ answerOption }}
                    </button>
                  </div>
                </div>
              </template>

              <template
                v-else-if="
                  createSelectedQuestionType === 'fill' ||
                  createSelectedQuestionType === 'subjective'
                "
              >
                <label class="form-field">
                  <span class="form-label">题目</span>
                  <textarea
                    v-model="createQuestionForm.content"
                    class="form-textarea"
                    rows="6"
                    placeholder="请输入题目内容"
                  />
                </label>

                <label class="form-field">
                  <span class="form-label">答案</span>
                  <textarea
                    v-model="createQuestionForm.answer"
                    class="form-textarea"
                    rows="5"
                    placeholder="请输入参考答案"
                  />
                </label>
              </template>

              <template v-else-if="createSelectedQuestionType === 'custom'">
                <label class="form-field">
                  <span class="form-label">上传图片</span>
                  <div class="file-upload-box">
                    <input
                      type="file"
                      accept="image/*"
                      class="file-input"
                      @change="handleCreateQuestionImageChange"
                    />
                    <p class="upload-hint">请选择一张图片作为自定义题题目</p>
                    <p v-if="createQuestionForm.imageFileName" class="upload-file-name">
                      已选择：{{ createQuestionForm.imageFileName }}
                    </p>
                  </div>
                </label>

                <div v-if="createQuestionForm.imagePreviewUrl" class="preview-image-wrap create-preview-image-wrap">
                  <img
                    :src="createQuestionForm.imagePreviewUrl"
                    alt="创建题目图片预览"
                    class="preview-image"
                    @click="openImagePreview(createQuestionForm.imagePreviewUrl)"
                  />
                </div>
              </template>

              <div class="create-form-footer">
                <div class="visibility-group">
                  <span class="form-label visibility-label">可见性</span>
                  <div class="visibility-selector" role="radiogroup" aria-label="题目可见性">
                    <button
                      type="button"
                      class="visibility-btn"
                      :class="{ active: createQuestionForm.visibility === 'public' }"
                      :aria-checked="createQuestionForm.visibility === 'public'"
                      role="radio"
                      @click="createQuestionForm.visibility = 'public'"
                    >
                      <span class="visibility-indicator" aria-hidden="true"></span>
                      公开
                    </button>
                    <button
                      type="button"
                      class="visibility-btn"
                      :class="{ active: createQuestionForm.visibility === 'private' }"
                      :aria-checked="createQuestionForm.visibility === 'private'"
                      role="radio"
                      @click="createQuestionForm.visibility = 'private'"
                    >
                      <span class="visibility-indicator" aria-hidden="true"></span>
                      私有
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  class="create-btn upload-btn"
                  :disabled="!canSubmitCreateQuestion()"
                  @click="handleCreateQuestionUpload"
                >
                  上传
                </button>
              </div>

              <p v-if="createQuestionNotice" class="status-text create-notice">{{ createQuestionNotice }}</p>
            </div>
          </section>
        </div>
      </section>
    </div>

    <div v-if="showAddQuestionModal" class="modal-overlay" @click.self="closeAddQuestionModal">
      <section class="add-question-modal">
        <header class="modal-header">
          <div>
            <h2>添加题目</h2>
            <p>
              题单ID：{{ selectedSetId || '未选择题单' }}
            </p>
          </div>
          <button type="button" class="close-btn" @click="closeAddQuestionModal">×</button>
        </header>

        <div class="modal-grid">
          <section class="modal-column">
            <div class="modal-column-header">
              <h3>选择科目</h3>
              <span v-if="courseLoading" class="mini-status">加载中</span>
            </div>
            <p v-if="courseErrorMessage" class="status-text error">{{ courseErrorMessage }}</p>
            <p v-else-if="courseOptions.length === 0" class="status-text">暂无科目数据</p>
            <ul v-else class="selection-list">
              <li
                v-for="course in courseOptions"
                :key="course"
                class="selection-item"
                :class="{ active: selectedCourse === course }"
                @click="selectCourse(course)"
              >
                {{ course }}
              </li>
            </ul>
          </section>

          <section class="modal-column">
            <div class="modal-column-header">
              <h3>题型选择</h3>
              <span v-if="selectedCourse" class="mini-status">当前科目：{{ selectedCourse }}</span>
            </div>
            <p v-if="!selectedCourse" class="status-text">请先选择左侧科目</p>
            <ul v-else class="selection-list">
              <li
                v-for="typeItem in questionTypeOptions"
                :key="typeItem.value"
                class="selection-item"
                :class="{ active: selectedQuestionType === typeItem.value }"
                @click="selectQuestionType(typeItem.value)"
              >
                <span>{{ typeItem.label }}</span>
                <span class="selection-tip">{{ typeItem.tip }}</span>
              </li>
            </ul>
          </section>

          <section class="modal-column">
            <div class="modal-column-header">
              <h3>题目列表</h3>
              <span v-if="questionPoolLoading" class="mini-status">加载中</span>
            </div>
            <p v-if="!selectedCourse || !selectedQuestionType" class="status-text">
              请先选择科目和题型
            </p>
            <p v-else-if="questionPoolErrorMessage" class="status-text error">
              {{ questionPoolErrorMessage }}
            </p>
            <p v-else-if="questionPool.length === 0" class="status-text">
              当前条件下暂无题目
            </p>
            <ul v-else class="selection-list">
              <li
                v-for="item in questionPool"
                :key="item.id"
                class="selection-item"
                :class="{ active: selectedQuestionPoolItem?.id === item.id }"
                @click="selectQuestionPoolItem(item)"
              >
                <span>题目ID：{{ item.id }}</span>
                <span class="selection-tip">{{ item.brief || '未提供简介' }}</span>
              </li>
            </ul>
          </section>

          <section class="modal-column">
            <div class="modal-column-header">
              <h3>题目预览</h3>
            </div>
            <p v-if="previewLoading" class="status-text">正在加载题目预览...</p>
            <p v-else-if="previewErrorMessage" class="status-text error">
              {{ previewErrorMessage }}
            </p>
            <div v-else-if="selectedQuestionPoolItem && previewQuestionDetail" class="preview-panel">
              <div class="preview-meta">
                <span class="tag">{{ getTypeLabel(previewQuestionDetail.type) }}</span>
                <span class="question-id">题目ID：{{ previewQuestionDetail.id }}</span>
              </div>
              <p class="preview-title">题目简介</p>
              <p class="question-content">
                {{ previewQuestionDetail.brief || selectedQuestionPoolItem.brief || '未提供简介' }}
              </p>

              <template v-if="previewQuestionDetail.type === 'choice'">
                <p class="preview-title">题目</p>
                <p class="question-content">{{ previewQuestionDetail.content || '未提供题目' }}</p>
                <ul class="option-list preview-option-list">
                  <li>A. {{ previewQuestionDetail.optionA || '无' }}</li>
                  <li>B. {{ previewQuestionDetail.optionB || '无' }}</li>
                  <li>C. {{ previewQuestionDetail.optionC || '无' }}</li>
                  <li>D. {{ previewQuestionDetail.optionD || '无' }}</li>
                </ul>
                <p class="preview-title">答案</p>
                <p class="answer-text">{{ previewQuestionDetail.answer || '未提供答案' }}</p>
              </template>

              <template
                v-else-if="
                  previewQuestionDetail.type === 'fill' || previewQuestionDetail.type === 'subjective'
                "
              >
                <p class="preview-title">题目</p>
                <p class="question-content">{{ previewQuestionDetail.content || '未提供题目' }}</p>
                <p class="preview-title">答案</p>
                <p class="answer-text">{{ previewQuestionDetail.answer || '未提供答案' }}</p>
              </template>

              <template v-else-if="previewQuestionDetail.type === 'custom'">
                <p class="preview-title">图片 URL</p>
                <a
                  v-if="previewQuestionDetail.imageURL"
                  class="image-url-link"
                  :href="previewQuestionDetail.imageURL"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ previewQuestionDetail.imageURL }}
                </a>
                <p v-else class="status-text">未提供图片 URL</p>
                <div v-if="previewQuestionDetail.imageURL" class="preview-image-wrap">
                  <img
                    :src="previewQuestionDetail.imageURL"
                    alt="自定义题预览"
                    class="preview-image"
                    @click="openImagePreview(previewQuestionDetail.imageURL)"
                  />
                </div>
              </template>
            </div>
            <div v-else class="placeholder-panel">
              <p>请在左侧选择题目</p>
              <p class="placeholder-subtext">
                当前选择：{{ selectedCourse || '未选科目' }} / {{ getTypeLabel(selectedQuestionType) }}
              </p>
            </div>
          </section>
        </div>
      </section>
    </div>

    <div v-if="enlargedImageUrl" class="image-preview-overlay" @click.self="closeImagePreview">
      <button type="button" class="close-btn image-preview-close" @click="closeImagePreview">×</button>
      <img :src="enlargedImageUrl" alt="放大预览" class="image-preview-full" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import {
  clearAuthSession,
  getStoredUser,
  getStoredUserId,
} from '../../../shared/auth/session.js';
import { ROUTES } from '../../../shared/constants/routes.js';
import {
  getCourseOptions,
  getQuestionDetail,
  getQuestionPool,
  getQuestionSetQuestions,
  getTeacherQuestionSets,
} from './api.js';

const teacherId = ref('');
const questionSets = ref([]);
const setLoading = ref(false);
const setErrorMessage = ref('');
const selectedSetId = ref(null);

const questions = ref([]);
const questionLoading = ref(false);
const questionErrorMessage = ref('');
const showCreateQuestionModal = ref(false);
const showAddQuestionModal = ref(false);
const courseOptions = ref([]);
const courseLoading = ref(false);
const courseErrorMessage = ref('');
const selectedCourse = ref('');
const selectedQuestionType = ref('');
const questionPool = ref([]);
const questionPoolLoading = ref(false);
const questionPoolErrorMessage = ref('');
const selectedQuestionPoolItem = ref(null);
const previewQuestionDetail = ref(null);
const previewLoading = ref(false);
const previewErrorMessage = ref('');
const enlargedImageUrl = ref('');
const createSelectedCourse = ref('');
const createSelectedQuestionType = ref('');
const createQuestionNotice = ref('');

const getInitialCreateQuestionForm = () => ({
  content: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  answer: '',
  visibility: 'public',
  imageFile: null,
  imageFileName: '',
  imagePreviewUrl: '',
});

const createQuestionForm = ref(getInitialCreateQuestionForm());

const questionTypeOptions = [
  { value: 'choice', label: '选择题', tip: '含题干与4个选项' },
  { value: 'fill', label: '填空题', tip: '展示题干文本' },
  { value: 'subjective', label: '主观题', tip: '展示题干文本' },
  { value: 'custom', label: '自定义题', tip: '展示图片资源' },
];

const getTypeLabel = (type) => {
  const typeMap = {
    choice: '选择题',
    fill: '填空题',
    subjective: '主观题',
    custom: '自定义题',
  };
  return typeMap[type] || '未知题型';
};

const loadCourseOptions = async () => {
  courseLoading.value = true;
  courseErrorMessage.value = '';
  try {
    const response = await getCourseOptions();
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取科目列表失败');
    }
    courseOptions.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    courseOptions.value = [];
    courseErrorMessage.value = error.message || '获取科目列表失败';
  } finally {
    courseLoading.value = false;
  }
};

const loadQuestionSets = async () => {
  if (!teacherId.value) {
    questionSets.value = [];
    selectedSetId.value = null;
    setErrorMessage.value = '未找到教师ID，请重新登录后重试。';
    return;
  }

  setLoading.value = true;
  setErrorMessage.value = '';
  try {
    const response = await getTeacherQuestionSets(teacherId.value);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取题单失败');
    }
    questionSets.value = Array.isArray(response.data) ? response.data : [];
    if (questionSets.value.length === 0) {
      selectedSetId.value = null;
      questions.value = [];
      return;
    }
    if (!selectedSetId.value || !questionSets.value.some((item) => item.id === selectedSetId.value)) {
      await selectQuestionSet(questionSets.value[0].id);
    }
  } catch (error) {
    questionSets.value = [];
    selectedSetId.value = null;
    questions.value = [];
    setErrorMessage.value = error.message || '获取题单失败';
  } finally {
    setLoading.value = false;
  }
};

const revokeCreateQuestionPreview = () => {
  if (createQuestionForm.value.imagePreviewUrl) {
    URL.revokeObjectURL(createQuestionForm.value.imagePreviewUrl);
  }
};

const resetCreateQuestionFields = (visibility = createQuestionForm.value.visibility || 'public') => {
  revokeCreateQuestionPreview();
  createQuestionForm.value = {
    ...getInitialCreateQuestionForm(),
    visibility,
  };
};

const resetCreateQuestionState = () => {
  createSelectedCourse.value = '';
  createSelectedQuestionType.value = '';
  createQuestionNotice.value = '';
  resetCreateQuestionFields('public');
};

const resetQuestionPoolState = () => {
  questionPool.value = [];
  questionPoolLoading.value = false;
  questionPoolErrorMessage.value = '';
  selectedQuestionPoolItem.value = null;
  previewQuestionDetail.value = null;
  previewLoading.value = false;
  previewErrorMessage.value = '';
  enlargedImageUrl.value = '';
};

const loadQuestionPool = async () => {
  if (!selectedCourse.value || !selectedQuestionType.value) {
    resetQuestionPoolState();
    return;
  }

  questionPoolLoading.value = true;
  questionPoolErrorMessage.value = '';
  selectedQuestionPoolItem.value = null;
  try {
    const response = await getQuestionPool(selectedCourse.value, selectedQuestionType.value);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取题目列表失败');
    }
    questionPool.value = Array.isArray(response.data) ? response.data : [];
    if (questionPool.value.length > 0) {
      selectedQuestionPoolItem.value = questionPool.value[0];
      await loadQuestionDetailById(questionPool.value[0].id);
    }
  } catch (error) {
    questionPool.value = [];
    questionPoolErrorMessage.value = error.message || '获取题目列表失败';
  } finally {
    questionPoolLoading.value = false;
  }
};

const loadQuestionDetailById = async (questionId) => {
  previewLoading.value = true;
  previewErrorMessage.value = '';
  previewQuestionDetail.value = null;
  enlargedImageUrl.value = '';
  try {
    const response = await getQuestionDetail(questionId);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取题目预览失败');
    }
    previewQuestionDetail.value = response.data || null;
  } catch (error) {
    previewQuestionDetail.value = null;
    previewErrorMessage.value = error.message || '获取题目预览失败';
  } finally {
    previewLoading.value = false;
  }
};

const loadQuestionsBySetId = async (setId) => {
  if (!setId) {
    questions.value = [];
    return;
  }

  questionLoading.value = true;
  questionErrorMessage.value = '';
  try {
    const response = await getQuestionSetQuestions(setId);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取题目失败');
    }
    questions.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    questions.value = [];
    questionErrorMessage.value = error.message || '获取题目失败';
  } finally {
    questionLoading.value = false;
  }
};

const selectQuestionSet = async (setId) => {
  selectedSetId.value = setId;
  await loadQuestionsBySetId(setId);
};

const selectCreateCourse = (course) => {
  createSelectedCourse.value = course;
  createSelectedQuestionType.value = '';
  createQuestionNotice.value = '';
  resetCreateQuestionFields(createQuestionForm.value.visibility);
};

const selectCreateQuestionType = (questionType) => {
  if (!createSelectedCourse.value) {
    return;
  }
  createSelectedQuestionType.value = questionType;
  createQuestionNotice.value = '';
  resetCreateQuestionFields(createQuestionForm.value.visibility);
};

const selectCourse = (course) => {
  selectedCourse.value = course;
  selectedQuestionType.value = '';
  resetQuestionPoolState();
};

const selectQuestionType = async (questionType) => {
  if (!selectedCourse.value) {
    return;
  }
  selectedQuestionType.value = questionType;
  await loadQuestionPool();
};

const selectQuestionPoolItem = (item) => {
  selectedQuestionPoolItem.value = item;
  loadQuestionDetailById(item.id);
};

const openImagePreview = (imageUrl) => {
  enlargedImageUrl.value = imageUrl || '';
};

const closeImagePreview = () => {
  enlargedImageUrl.value = '';
};

const handleCreateQuestionImageChange = (event) => {
  const selectedFile = event.target.files?.[0] || null;
  revokeCreateQuestionPreview();
  if (!selectedFile) {
    createQuestionForm.value.imageFile = null;
    createQuestionForm.value.imageFileName = '';
    createQuestionForm.value.imagePreviewUrl = '';
    return;
  }

  createQuestionForm.value.imageFile = selectedFile;
  createQuestionForm.value.imageFileName = selectedFile.name;
  createQuestionForm.value.imagePreviewUrl = URL.createObjectURL(selectedFile);
};

const canSubmitCreateQuestion = () => {
  if (!createSelectedCourse.value || !createSelectedQuestionType.value) {
    return false;
  }

  if (createSelectedQuestionType.value === 'choice') {
    return [
      createQuestionForm.value.content,
      createQuestionForm.value.optionA,
      createQuestionForm.value.optionB,
      createQuestionForm.value.optionC,
      createQuestionForm.value.optionD,
      createQuestionForm.value.answer,
    ].every((item) => Boolean(item?.trim()));
  }

  if (
    createSelectedQuestionType.value === 'fill' ||
    createSelectedQuestionType.value === 'subjective'
  ) {
    return Boolean(createQuestionForm.value.content.trim() && createQuestionForm.value.answer.trim());
  }

  if (createSelectedQuestionType.value === 'custom') {
    return Boolean(createQuestionForm.value.imageFile);
  }

  return false;
};

const handleCreateQuestionUpload = () => {
  createQuestionNotice.value = canSubmitCreateQuestion()
    ? `已完成${getTypeLabel(createSelectedQuestionType.value)}界面搭建，上传逻辑暂未接入后端。`
    : '请先完整填写当前题目内容。';
};

const openCreateQuestionModal = async () => {
  showAddQuestionModal.value = false;
  resetQuestionPoolState();
  resetCreateQuestionState();
  showCreateQuestionModal.value = true;
  await loadCourseOptions();
};

const closeCreateQuestionModal = () => {
  showCreateQuestionModal.value = false;
  resetCreateQuestionState();
};

const openAddQuestionModal = async () => {
  if (!selectedSetId.value) {
    return;
  }

  showCreateQuestionModal.value = false;
  resetCreateQuestionState();
  showAddQuestionModal.value = true;
  selectedCourse.value = '';
  selectedQuestionType.value = '';
  resetQuestionPoolState();
  await loadCourseOptions();
};

const closeAddQuestionModal = () => {
  showAddQuestionModal.value = false;
  selectedCourse.value = '';
  selectedQuestionType.value = '';
  resetQuestionPoolState();
};

const goMenu = () => {
  window.location.href = ROUTES.TEACHER_MENU;
};

const logout = () => {
  clearAuthSession();
  window.location.href = ROUTES.AUTH;
};

onMounted(async () => {
  const user = getStoredUser();
  teacherId.value = getStoredUserId() || user?.id || '';
  await loadQuestionSets();
});
</script>

<style scoped>
.teacher-question-page {
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #1a1c29 0%, #141826 55%, #0f1016 100%);
  color: #eef3ff;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.title-area h1 {
  margin: 0;
  font-size: 26px;
}

.title-area p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 10px;
}

.ghost-btn,
.danger-btn,
.refresh-btn,
.create-btn,
.close-btn {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #eef3ff;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}

.danger-btn {
  border-color: rgba(248, 113, 113, 0.5);
  background: rgba(248, 113, 113, 0.2);
}

.ghost-btn:hover,
.refresh-btn:hover,
.create-btn:hover {
  border-color: rgba(148, 163, 184, 0.7);
}

.danger-btn:hover {
  border-color: rgba(248, 113, 113, 0.8);
}

.main-layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 18px;
}

.set-list-panel,
.question-detail-panel {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  padding: 16px;
}

.panel-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.create-btn {
  border-color: rgba(56, 189, 248, 0.5);
  background: rgba(56, 189, 248, 0.16);
}

.create-question-btn {
  border-color: rgba(192, 132, 252, 0.52);
  background: rgba(192, 132, 252, 0.16);
}

.create-btn:disabled,
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
}

.tag {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  color: rgba(226, 232, 240, 0.9);
}

.status-text {
  margin: 10px 0;
  font-size: 14px;
  color: rgba(226, 232, 240, 0.82);
}

.status-text.error {
  color: #fca5a5;
}

.set-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

.set-item {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.set-item:hover {
  border-color: rgba(147, 197, 253, 0.65);
}

.set-item.active {
  border-color: rgba(56, 189, 248, 0.9);
  background: rgba(56, 189, 248, 0.14);
}

.set-name {
  margin: 0;
  font-weight: 600;
}

.set-id {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.72);
}

.placeholder {
  margin-top: 30px;
  color: rgba(226, 232, 240, 0.72);
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

.question-card {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
}

.question-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.question-type {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(125, 211, 252, 0.22);
  border: 1px solid rgba(125, 211, 252, 0.55);
  font-size: 12px;
}

.question-id {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

.question-content {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
}

.option-list {
  margin: 10px 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.custom-image-wrap {
  display: flex;
  justify-content: flex-start;
}

.custom-image {
  max-width: min(100%, 520px);
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.42);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(5, 8, 20, 0.72);
  backdrop-filter: blur(10px);
}

.add-question-modal {
  width: min(1400px, 100%);
  min-height: min(760px, calc(100vh - 48px));
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, rgba(18, 24, 44, 0.96), rgba(13, 18, 31, 0.98));
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
}

.modal-header p {
  margin: 6px 0 0;
  color: rgba(226, 232, 240, 0.72);
  font-size: 13px;
}

.close-btn {
  min-width: 42px;
  min-height: 42px;
  font-size: 24px;
  line-height: 1;
}

.modal-grid {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr);
  gap: 16px;
  min-height: 0;
}

.create-modal-grid {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr);
  gap: 16px;
  min-height: 0;
}

.modal-column {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  padding: 14px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.modal-column-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.modal-column-header h3 {
  margin: 0;
  font-size: 18px;
}

.mini-status {
  font-size: 12px;
  color: rgba(191, 219, 254, 0.78);
}

.selection-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.selection-item {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.selection-item:hover {
  border-color: rgba(147, 197, 253, 0.62);
}

.selection-item.active {
  border-color: rgba(56, 189, 248, 0.9);
  background: rgba(56, 189, 248, 0.14);
}

.selection-tip {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.65);
}

.preview-panel {
  flex: 1;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.create-form-column {
  min-height: 0;
}

.create-form-panel {
  flex: 1;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.create-placeholder {
  min-height: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  color: rgba(191, 219, 254, 0.82);
}

.form-input,
.form-textarea,
.file-input {
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.55);
  color: #eef3ff;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
}

.form-input:focus,
.form-textarea:focus,
.file-input:focus {
  border-color: rgba(96, 165, 250, 0.68);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.answer-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.answer-option-btn,
.visibility-btn {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: #eef3ff;
  padding: 10px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.answer-option-btn.active,
.visibility-btn.active {
  border-color: rgba(56, 189, 248, 0.9);
  background: rgba(56, 189, 248, 0.18);
}

.file-upload-box {
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.42);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-hint,
.upload-file-name {
  margin: 0;
  font-size: 13px;
  color: rgba(226, 232, 240, 0.74);
}

.create-preview-image-wrap {
  justify-content: flex-start;
}

.create-form-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.visibility-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.visibility-label {
  color: rgba(226, 232, 240, 0.88);
}

.visibility-selector {
  display: flex;
  gap: 0;
  flex-wrap: nowrap;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.55);
  overflow: hidden;
}

.visibility-btn {
  min-width: 112px;
  border: 0;
  border-right: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.visibility-btn:last-child {
  border-right: 0;
}

.visibility-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.visibility-indicator {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(191, 219, 254, 0.62);
  box-sizing: border-box;
  background: transparent;
  transition: all 0.2s ease;
}

.visibility-btn.active {
  background: rgba(56, 189, 248, 0.16);
  color: #f8fbff;
}

.visibility-btn.active .visibility-indicator {
  border-color: rgba(125, 211, 252, 0.95);
  background: radial-gradient(circle, rgba(125, 211, 252, 0.95) 0 45%, transparent 50% 100%);
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.create-notice {
  margin-top: 0;
}

.preview-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-title {
  margin: 0;
  font-size: 13px;
  color: rgba(191, 219, 254, 0.78);
}

.preview-option-list {
  margin-top: 0;
}

.answer-text {
  margin: 0;
  color: #fde68a;
  white-space: pre-wrap;
  line-height: 1.6;
}

.image-url-link {
  color: #93c5fd;
  word-break: break-all;
  text-decoration: none;
}

.image-url-link:hover {
  text-decoration: underline;
}

.preview-image-wrap {
  display: flex;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 320px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.42);
  cursor: zoom-in;
  object-fit: contain;
}

.placeholder-panel {
  flex: 1;
  min-height: 220px;
  border-radius: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.32);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(226, 232, 240, 0.78);
  text-align: center;
  padding: 18px;
}

.placeholder-panel p {
  margin: 0;
}

.placeholder-subtext {
  font-size: 12px;
  color: rgba(191, 219, 254, 0.68);
}

.image-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.82);
}

.image-preview-close {
  position: absolute;
  top: 24px;
  right: 24px;
}

.image-preview-full {
  max-width: calc(100vw - 80px);
  max-height: calc(100vh - 80px);
  border-radius: 16px;
  object-fit: contain;
}

@media (max-width: 980px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .set-list,
  .question-list {
    max-height: none;
  }

  .add-question-modal {
    padding: 18px;
  }

  .modal-grid {
    grid-template-columns: 1fr;
  }

  .create-modal-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
