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
          <button type="button" class="refresh-btn" :disabled="setLoading" @click="loadQuestionSets">
            刷新
          </button>
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
          <span v-if="selectedSetId" class="tag">题单ID {{ selectedSetId }}</span>
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
import { getQuestionSetQuestions, getTeacherQuestionSets } from './api.js';

const teacherId = ref('');
const questionSets = ref([]);
const setLoading = ref(false);
const setErrorMessage = ref('');
const selectedSetId = ref(null);

const questions = ref([]);
const questionLoading = ref(false);
const questionErrorMessage = ref('');

const getTypeLabel = (type) => {
  const typeMap = {
    choice: '选择题',
    fill: '填空题',
    subjective: '主观题',
    custom: '自定义题',
  };
  return typeMap[type] || '未知题型';
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
.refresh-btn {
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
.refresh-btn:hover {
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

@media (max-width: 980px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .set-list,
  .question-list {
    max-height: none;
  }
}
</style>
