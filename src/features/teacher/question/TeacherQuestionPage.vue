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
            <button
              type="button"
              class="create-set-btn"
              :disabled="setLoading || setCreating"
              @click="handleCreateQuestionSet"
            >
              {{ setCreating ? '创建中...' : '创建题单' }}
            </button>
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
            <div class="set-item-info">
              <div class="set-name-row">
                <button
                  type="button"
                  class="item-edit-btn"
                  :disabled="setRenaming && editingSetId === setItem.id"
                  title="修改题单名称"
                  @click.stop="openRenameQuestionSetDialog(setItem)"
                >
                  ✎
                </button>
                <p class="set-name">{{ setItem.name || `题单 #${setItem.id}` }}</p>
              </div>
              <span class="set-id">ID: {{ setItem.id }}</span>
            </div>
            <button
              type="button"
              class="item-delete-btn"
              :disabled="setDeletingId === setItem.id"
              title="删除题单"
              @click.stop="handleDeleteQuestionSet(setItem.id)"
            >
              ×
            </button>
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
              <div class="question-card-actions">
                <span class="question-id">题目ID: {{ question.id }}</span>
                <button
                  type="button"
                  class="question-delete-btn"
                  :disabled="deletingQuestionId === question.id"
                  @click="handleRemoveQuestion(question.id)"
                >
                  删除
                </button>
              </div>
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
            <p>创建完成后可在添加题目弹窗中按科目和题型检索新题目</p>
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
                      :key="createQuestionImageInputKey"
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
                  :disabled="!canSubmitCreateQuestion() || createQuestionSubmitting"
                  @click="handleCreateQuestionUpload"
                >
                  {{ createQuestionSubmitting ? '上传中...' : '上传' }}
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

        <footer class="add-question-footer">
          <p
            v-if="addQuestionNotice"
            class="status-text"
            :class="{ error: addQuestionNoticeIsError }"
          >
            {{ addQuestionNotice }}
          </p>
          <button
            type="button"
            class="confirm-add-btn"
            :disabled="addQuestionSubmitting || !selectedQuestionPoolItem"
            @click="handleAddQuestionToSet"
          >
            {{ addQuestionSubmitting ? '提交中...' : '确定' }}
          </button>
        </footer>
      </section>
    </div>

    <div v-if="enlargedImageUrl" class="image-preview-overlay" @click.self="closeImagePreview">
      <button type="button" class="close-btn image-preview-close" @click="closeImagePreview">×</button>
      <img :src="enlargedImageUrl" alt="放大预览" class="image-preview-full" />
    </div>

    <div v-if="showConfirmDialog" class="modal-overlay confirm-overlay" @click.self="closeConfirmDialog">
      <section class="confirm-dialog">
        <div class="confirm-dialog-body">
          <h3>{{ confirmDialogTitle }}</h3>
          <p>{{ confirmDialogMessage }}</p>
        </div>
        <div class="confirm-dialog-actions">
          <button
            type="button"
            class="ghost-btn"
            :disabled="confirmDialogSubmitting"
            @click="closeConfirmDialog"
          >
            {{ confirmDialogCancelText }}
          </button>
          <button
            type="button"
            class="danger-btn confirm-danger-btn"
            :disabled="confirmDialogSubmitting"
            @click="handleConfirmDialogConfirm"
          >
            {{ confirmDialogSubmitting ? '处理中...' : confirmDialogConfirmText }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="showSetNameDialog" class="modal-overlay confirm-overlay" @click.self="closeSetNameDialog">
      <section class="confirm-dialog set-name-dialog">
        <div class="confirm-dialog-body">
          <h3>{{ setNameDialogMode === 'create' ? '创建题单' : '修改题单名称' }}</h3>
          <p>{{ setNameDialogMode === 'create' ? '请输入新题单名称。' : '请输入新的题单名称。' }}</p>
          <label class="form-field dialog-form-field">
            <span class="form-label">题单名称</span>
            <input
              v-model="setNameInput"
              type="text"
              class="form-input"
              maxlength="1024"
              placeholder="请输入题单名称"
              @keydown.enter.prevent="handleSetNameDialogConfirm"
            />
          </label>
          <p v-if="setNameDialogError" class="status-text error dialog-error">{{ setNameDialogError }}</p>
        </div>
        <div class="confirm-dialog-actions">
          <button
            type="button"
            class="ghost-btn"
            :disabled="setNameDialogSubmitting"
            @click="closeSetNameDialog"
          >
            取消
          </button>
          <button
            type="button"
            class="create-set-btn dialog-confirm-btn"
            :disabled="setNameDialogSubmitting"
            @click="handleSetNameDialogConfirm"
          >
            {{ setNameDialogSubmitting ? '处理中...' : '确认' }}
          </button>
        </div>
      </section>
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
  addQuestionToSet,
  createQuestion,
  createQuestionSet,
  deleteQuestionSet,
  getCourseOptions,
  getQuestionDetail,
  getQuestionPool,
  getQuestionSetQuestions,
  getTeacherQuestionSets,
  removeQuestionFromSet,
  renameQuestionSet,
} from './api.js';

const teacherId = ref('');
const questionSets = ref([]);
const setLoading = ref(false);
const setErrorMessage = ref('');
const selectedSetId = ref(null);
const setCreating = ref(false);
const setRenaming = ref(false);

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
const addQuestionNotice = ref('');
const addQuestionNoticeIsError = ref(false);
const addQuestionSubmitting = ref(false);
const deletingQuestionId = ref(null);
const setDeletingId = ref(null);
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogConfirmText = ref('确认');
const confirmDialogCancelText = ref('取消');
const confirmDialogSubmitting = ref(false);
const confirmDialogAction = ref(null);
const showSetNameDialog = ref(false);
const setNameDialogMode = ref('create');
const setNameDialogSubmitting = ref(false);
const setNameDialogError = ref('');
const setNameInput = ref('');
const editingSetId = ref(null);
const createSelectedCourse = ref('');
const createSelectedQuestionType = ref('');
const createQuestionNotice = ref('');
const createQuestionSubmitting = ref(false);
const createQuestionImageInputKey = ref(0);

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
  createQuestionImageInputKey.value += 1;
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

const resetAddQuestionState = () => {
  addQuestionNotice.value = '';
  addQuestionNoticeIsError.value = false;
  addQuestionSubmitting.value = false;
  selectedCourse.value = '';
  selectedQuestionType.value = '';
  resetQuestionPoolState();
};

const openConfirmDialog = ({
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  action,
}) => {
  confirmDialogTitle.value = title;
  confirmDialogMessage.value = message;
  confirmDialogConfirmText.value = confirmText;
  confirmDialogCancelText.value = cancelText;
  confirmDialogAction.value = action || null;
  confirmDialogSubmitting.value = false;
  showConfirmDialog.value = true;
};

const closeConfirmDialog = (force = false) => {
  if (confirmDialogSubmitting.value && !force) {
    return;
  }
  showConfirmDialog.value = false;
  confirmDialogTitle.value = '';
  confirmDialogMessage.value = '';
  confirmDialogConfirmText.value = '确认';
  confirmDialogCancelText.value = '取消';
  confirmDialogAction.value = null;
};

const handleConfirmDialogConfirm = async () => {
  if (typeof confirmDialogAction.value !== 'function') {
    closeConfirmDialog();
    return;
  }

  confirmDialogSubmitting.value = true;
  try {
    await confirmDialogAction.value();
    closeConfirmDialog(true);
  } finally {
    confirmDialogSubmitting.value = false;
  }
};

const openCreateQuestionSetDialog = () => {
  setNameDialogMode.value = 'create';
  setNameInput.value = '';
  setNameDialogError.value = '';
  editingSetId.value = null;
  setNameDialogSubmitting.value = false;
  showSetNameDialog.value = true;
};

const openRenameQuestionSetDialog = (setItem) => {
  setNameDialogMode.value = 'rename';
  setNameInput.value = setItem?.name || '';
  setNameDialogError.value = '';
  editingSetId.value = setItem?.id ?? null;
  setNameDialogSubmitting.value = false;
  showSetNameDialog.value = true;
};

const closeSetNameDialog = (force = false) => {
  if (setNameDialogSubmitting.value && !force) {
    return;
  }
  showSetNameDialog.value = false;
  setNameDialogError.value = '';
  setNameInput.value = '';
  editingSetId.value = null;
  setNameDialogMode.value = 'create';
};

const loadQuestionPool = async (preferredQuestionId = null) => {
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
      const preferredItem = preferredQuestionId
        ? questionPool.value.find((item) => item.id === preferredQuestionId)
        : null;
      const targetItem = preferredItem || questionPool.value[0];
      selectedQuestionPoolItem.value = targetItem;
      await loadQuestionDetailById(targetItem.id);
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

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('图片读取失败'));
  reader.readAsDataURL(file);
});

const refreshViewAfterCreateQuestion = async (createdQuestion) => {
  const refreshTasks = [];

  if (selectedSetId.value) {
    refreshTasks.push(loadQuestionsBySetId(selectedSetId.value));
  }

  const shouldRefreshQuestionPool = (
    selectedCourse.value &&
    selectedQuestionType.value &&
    selectedCourse.value === createdQuestion?.course &&
    selectedQuestionType.value === createdQuestion?.type
  );

  if (shouldRefreshQuestionPool) {
    refreshTasks.push(loadQuestionPool(createdQuestion.id));
  }

  await Promise.all(refreshTasks);
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

const handleCreateQuestionUpload = async () => {
  if (!canSubmitCreateQuestion() || createQuestionSubmitting.value) {
    createQuestionNotice.value = '请先完整填写当前题目内容。';
    return;
  }

  createQuestionSubmitting.value = true;
  createQuestionNotice.value = '';

  try {
    const payload = {
      course: createSelectedCourse.value,
      type: createSelectedQuestionType.value,
      visibility: createQuestionForm.value.visibility,
    };

    if (createSelectedQuestionType.value === 'choice') {
      payload.content = createQuestionForm.value.content.trim();
      payload.optionA = createQuestionForm.value.optionA.trim();
      payload.optionB = createQuestionForm.value.optionB.trim();
      payload.optionC = createQuestionForm.value.optionC.trim();
      payload.optionD = createQuestionForm.value.optionD.trim();
      payload.answer = createQuestionForm.value.answer.trim().toUpperCase();
    } else if (
      createSelectedQuestionType.value === 'fill' ||
      createSelectedQuestionType.value === 'subjective'
    ) {
      payload.content = createQuestionForm.value.content.trim();
      payload.answer = createQuestionForm.value.answer.trim();
    } else if (createSelectedQuestionType.value === 'custom') {
      if (!createQuestionForm.value.imageFile) {
        throw new Error('请先选择图片');
      }
      payload.imageFileName = createQuestionForm.value.imageFileName;
      payload.imageData = await fileToDataUrl(createQuestionForm.value.imageFile);
    }

    const response = await createQuestion(payload);
    if (response.status !== 'success') {
      throw new Error(response.msg || '创建题目失败');
    }

    await refreshViewAfterCreateQuestion(response.data || null);
    createQuestionNotice.value = `创建成功，题目ID：${response.data?.id ?? '未知'}`;
    resetCreateQuestionFields(createQuestionForm.value.visibility);
  } catch (error) {
    createQuestionNotice.value = error.message || '创建题目失败';
  } finally {
    createQuestionSubmitting.value = false;
  }
};

const handleAddQuestionToSet = async () => {
  if (!selectedSetId.value || !selectedQuestionPoolItem.value?.id) {
    addQuestionNotice.value = '请先选择要添加的题目。';
    addQuestionNoticeIsError.value = true;
    return;
  }

  if (addQuestionSubmitting.value) {
    return;
  }

  addQuestionSubmitting.value = true;
  addQuestionNotice.value = '';
  addQuestionNoticeIsError.value = false;

  try {
    const response = await addQuestionToSet(selectedSetId.value, selectedQuestionPoolItem.value.id);
    if (response.status !== 'success') {
      throw new Error(response.msg || '添加题目失败');
    }

    await loadQuestionsBySetId(selectedSetId.value);
    closeAddQuestionModal();
  } catch (error) {
    addQuestionNotice.value = error.message || '添加题目失败';
    addQuestionNoticeIsError.value = true;
  } finally {
    addQuestionSubmitting.value = false;
  }
};

const submitCreateQuestionSet = async (name) => {
  if (setCreating.value) {
    return;
  }

  setCreating.value = true;
  setErrorMessage.value = '';

  try {
    const response = await createQuestionSet(name);
    if (response.status !== 'success') {
      throw new Error(response.msg || '创建题单失败');
    }

    await loadQuestionSets();
    if (response.data?.id) {
      await selectQuestionSet(response.data.id);
    }
  } catch (error) {
    setErrorMessage.value = error.message || '创建题单失败';
    throw new Error(error.message || '创建题单失败');
  } finally {
    setCreating.value = false;
  }
};

const submitRenameQuestionSet = async (setId, name) => {
  if (setRenaming.value) {
    return;
  }

  setRenaming.value = true;
  setErrorMessage.value = '';

  try {
    const response = await renameQuestionSet(setId, name);
    if (response.status !== 'success') {
      throw new Error(response.msg || '修改题单名称失败');
    }

    await loadQuestionSets();
    if (selectedSetId.value === setId) {
      await selectQuestionSet(setId);
    }
  } catch (error) {
    throw new Error(error.message || '修改题单名称失败');
  } finally {
    setRenaming.value = false;
  }
};

const handleSetNameDialogConfirm = async () => {
  const trimmedName = setNameInput.value.trim();
  if (!trimmedName) {
    setNameDialogError.value = '请输入题单名称';
    return;
  }
  if (setNameDialogMode.value === 'rename' && !editingSetId.value) {
    setNameDialogError.value = '未找到需要修改的题单';
    return;
  }

  setNameDialogSubmitting.value = true;
  setNameDialogError.value = '';

  try {
    if (setNameDialogMode.value === 'rename') {
      await submitRenameQuestionSet(editingSetId.value, trimmedName);
    } else {
      await submitCreateQuestionSet(trimmedName);
    }
    closeSetNameDialog(true);
  } catch (error) {
    setNameDialogError.value = error.message || '提交失败';
  } finally {
    setNameDialogSubmitting.value = false;
  }
};

const handleCreateQuestionSet = () => {
  if (setCreating.value) {
    return;
  }
  openCreateQuestionSetDialog();
};

const removeQuestionFromCurrentSet = async (questionId) => {
  if (!selectedSetId.value || deletingQuestionId.value === questionId) {
    return;
  }

  deletingQuestionId.value = questionId;
  questionErrorMessage.value = '';

  try {
    const response = await removeQuestionFromSet(selectedSetId.value, questionId);
    if (response.status !== 'success') {
      throw new Error(response.msg || '删除题目失败');
    }
    await loadQuestionsBySetId(selectedSetId.value);
  } catch (error) {
    questionErrorMessage.value = error.message || '删除题目失败';
  } finally {
    deletingQuestionId.value = null;
  }
};

const handleRemoveQuestion = (questionId) => {
  if (!selectedSetId.value || deletingQuestionId.value === questionId) {
    return;
  }

  openConfirmDialog({
    title: '删除题目',
    message: `确认从当前题单中删除题目 ${questionId} 吗？`,
    confirmText: '确认删除',
    cancelText: '取消',
    action: () => removeQuestionFromCurrentSet(questionId),
  });
};

const deleteQuestionSetItem = async (setId) => {
  if (setDeletingId.value === setId) {
    return;
  }

  setDeletingId.value = setId;
  setErrorMessage.value = '';

  try {
    const response = await deleteQuestionSet(setId);
    if (response.status !== 'success') {
      throw new Error(response.msg || '删除题单失败');
    }

    if (selectedSetId.value === setId) {
      selectedSetId.value = null;
      questions.value = [];
      if (showAddQuestionModal.value) {
        closeAddQuestionModal();
      }
    }

    await loadQuestionSets();
  } catch (error) {
    setErrorMessage.value = error.message || '删除题单失败';
  } finally {
    setDeletingId.value = null;
  }
};

const handleDeleteQuestionSet = (setId) => {
  if (setDeletingId.value === setId) {
    return;
  }

  openConfirmDialog({
    title: '删除题单',
    message: `确认删除题单 ${setId} 吗？删除后将同时清理题单关联数据。`,
    confirmText: '确认删除',
    cancelText: '取消',
    action: () => deleteQuestionSetItem(setId),
  });
};

const openCreateQuestionModal = async () => {
  showAddQuestionModal.value = false;
  resetAddQuestionState();
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
  resetAddQuestionState();
  await loadCourseOptions();
};

const closeAddQuestionModal = () => {
  showAddQuestionModal.value = false;
  resetAddQuestionState();
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
  padding: 16px 20px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  background: linear-gradient(135deg, #1a1c29 0%, #141826 55%, #0f1016 100%);
  color: #eef3ff;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.title-area h1 {
  margin: 0;
  font-size: 24px;
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
  padding: 7px 12px;
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
  flex: 1;
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 18px;
  min-height: 0;
  align-items: start;
}

.set-list-panel,
.question-detail-panel {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  padding: 14px;
  min-height: 0;
}

.question-detail-panel {
  display: flex;
  flex-direction: column;
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

.create-set-btn {
  border: 1px solid rgba(74, 222, 128, 0.55);
  border-radius: 8px;
  background: rgba(74, 222, 128, 0.2);
  color: #dcfce7;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}

.create-question-btn {
  border-color: rgba(192, 132, 252, 0.52);
  background: rgba(192, 132, 252, 0.16);
}

.create-btn:disabled,
.refresh-btn:disabled,
.create-set-btn:disabled {
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
  font-size: 18px;
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
  max-height: calc(100vh - 190px);
  overflow-y: auto;
}

.set-item {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

.set-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.set-item-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  max-height: calc(100vh - 190px);
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

.question-card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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

.item-edit-btn,
.item-delete-btn,
.question-delete-btn,
.confirm-add-btn {
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.item-edit-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid rgba(125, 211, 252, 0.5);
  background: rgba(56, 189, 248, 0.14);
  color: #dbeafe;
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.item-delete-btn,
.question-delete-btn {
  border: 1px solid rgba(248, 113, 113, 0.5);
  background: rgba(248, 113, 113, 0.18);
  color: #fecaca;
}

.item-delete-btn {
  width: 34px;
  height: 34px;
  padding: 0;
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
}

.question-delete-btn {
  padding: 6px 12px;
  font-size: 12px;
}

.item-edit-btn:hover {
  border-color: rgba(125, 211, 252, 0.85);
  background: rgba(56, 189, 248, 0.22);
}

.item-delete-btn:hover,
.question-delete-btn:hover {
  border-color: rgba(248, 113, 113, 0.85);
  background: rgba(248, 113, 113, 0.24);
}

.item-edit-btn:disabled,
.item-delete-btn:disabled,
.question-delete-btn:disabled,
.confirm-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 16px;
  background: rgba(5, 8, 20, 0.72);
  backdrop-filter: blur(10px);
}

.add-question-modal {
  width: min(1320px, 100%);
  max-height: calc(100vh - 32px);
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, rgba(18, 24, 44, 0.96), rgba(13, 18, 31, 0.98));
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
}

.modal-header p {
  margin: 6px 0 0;
  color: rgba(226, 232, 240, 0.72);
  font-size: 13px;
}

.add-question-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.add-question-footer .status-text {
  margin: 0;
}

.close-btn {
  min-width: 38px;
  min-height: 38px;
  font-size: 22px;
  line-height: 1;
}

.modal-grid {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(170px, 0.8fr) minmax(210px, 1fr) minmax(250px, 1.05fr) minmax(320px, 1.45fr);
  gap: 14px;
  min-height: 0;
}

.create-modal-grid {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(180px, 0.9fr) minmax(220px, 1fr) minmax(360px, 1.7fr);
  gap: 14px;
  min-height: 0;
}

.modal-column {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.modal-column-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.modal-column-header h3 {
  margin: 0;
  font-size: 16px;
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
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.selection-item {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  padding: 10px 12px;
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
  min-height: 0;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.create-form-column {
  min-height: 0;
}

.create-form-panel {
  flex: 1;
  min-height: 0;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
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
  min-height: 92px;
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

.confirm-add-btn {
  margin-left: auto;
  border: 1px solid rgba(74, 222, 128, 0.55);
  background: rgba(74, 222, 128, 0.2);
  color: #dcfce7;
  padding: 10px 20px;
  font-size: 14px;
}

.confirm-add-btn:hover {
  border-color: rgba(74, 222, 128, 0.85);
  background: rgba(74, 222, 128, 0.28);
}

.create-set-btn:hover {
  border-color: rgba(74, 222, 128, 0.85);
  background: rgba(74, 222, 128, 0.28);
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

.confirm-overlay {
  z-index: 45;
}

.confirm-dialog {
  width: min(420px, 100%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, rgba(18, 24, 44, 0.97), rgba(13, 18, 31, 0.99));
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.confirm-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.confirm-dialog-body h3,
.confirm-dialog-body p {
  margin: 0;
}

.confirm-dialog-body h3 {
  font-size: 22px;
}

.confirm-dialog-body p {
  color: rgba(226, 232, 240, 0.8);
  line-height: 1.6;
}

.confirm-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.confirm-danger-btn {
  min-width: 96px;
}

.set-name-dialog {
  width: min(460px, 100%);
}

.dialog-form-field {
  margin-top: 4px;
}

.dialog-error {
  margin: 0;
}

.dialog-confirm-btn {
  min-width: 96px;
}

@media (max-width: 980px) {
  .teacher-question-page {
    padding: 14px;
  }

  .top-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .main-layout {
    grid-template-columns: 1fr;
  }

  .set-list,
  .question-list {
    max-height: none;
  }

  .add-question-modal {
    max-height: none;
    padding: 16px;
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
