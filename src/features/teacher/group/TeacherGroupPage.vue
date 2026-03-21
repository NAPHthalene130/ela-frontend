<template>
  <div class="teacher-group-page">
    <header class="top-bar">
      <div class="title-area">
        <h1>创建小组</h1>
        <p>当前教师：{{ teacherId || '未获取到教师ID' }}</p>
      </div>
      <div class="actions">
        <button type="button" class="ghost-btn" @click="goMenu">返回菜单</button>
        <button type="button" class="danger-btn" @click="logout">退出登录</button>
      </div>
    </header>

    <main class="main-layout">
      <section class="group-list-panel">
        <div class="panel-header">
          <h2>我的小组</h2>
          <button type="button" class="refresh-btn" @click="loadGroups" :disabled="loading">
            刷新
          </button>
        </div>

        <p v-if="loading" class="status-text">正在加载小组列表...</p>
        <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>
        <p v-else-if="groups.length === 0" class="status-text">暂无小组数据</p>

        <ul v-else class="group-list">
          <li
            v-for="group in groups"
            :key="group.id"
            class="group-item"
            :class="{ active: selectedGroupId === group.id }"
            @click="selectedGroupId = group.id"
          >
            <p class="group-name">{{ group.name }}</p>
            <p class="group-id">ID: {{ group.id }}</p>
          </li>
        </ul>
      </section>

      <section class="group-detail-panel">
        <h2>小组信息</h2>
        <div v-if="selectedGroup" class="detail-card">
          <p><span>小组ID：</span>{{ selectedGroup.id }}</p>
          <p><span>小组名称：</span>{{ selectedGroup.name }}</p>
          <p><span>教师ID：</span>{{ teacherId }}</p>
        </div>
        <p v-else class="placeholder">请先从左侧列表选择一个小组</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import {
  clearAuthSession,
  getStoredUser,
  getStoredUserId,
} from '../../../shared/auth/session.js';
import { ROUTES } from '../../../shared/constants/routes.js';
import { getTeacherGroups } from './api.js';

const groups = ref([]);
const loading = ref(false);
const errorMessage = ref('');
const selectedGroupId = ref(null);
const teacherId = ref('');

const selectedGroup = computed(() =>
  groups.value.find((group) => group.id === selectedGroupId.value) || null
);

const loadGroups = async () => {
  if (!teacherId.value) {
    groups.value = [];
    errorMessage.value = '未找到教师ID，请重新登录后重试。';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await getTeacherGroups(teacherId.value);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取小组列表失败');
    }

    groups.value = Array.isArray(response.data) ? response.data : [];
    if (groups.value.length > 0) {
      selectedGroupId.value = groups.value[0].id;
    } else {
      selectedGroupId.value = null;
    }
  } catch (error) {
    groups.value = [];
    selectedGroupId.value = null;
    errorMessage.value = error.message || '获取小组列表失败';
  } finally {
    loading.value = false;
  }
};

const goMenu = () => {
  window.location.href = ROUTES.TEACHER_MENU;
};

const logout = () => {
  clearAuthSession();
  window.location.href = ROUTES.AUTH;
};

onMounted(() => {
  const user = getStoredUser();
  teacherId.value = getStoredUserId() || user?.id || '';
  loadGroups();
});
</script>

<style scoped>
.teacher-group-page {
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
  border-color: #b91c1c;
  background: #dc2626;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.main-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
}

.group-list-panel,
.group-detail-panel {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  padding: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.panel-header h2,
.group-detail-panel h2 {
  margin: 0;
  font-size: 17px;
}

.status-text {
  color: rgba(255, 255, 255, 0.74);
  font-size: 14px;
}

.status-text.error {
  color: #fca5a5;
}

.group-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.03);
}

.group-item.active {
  border-color: #60a5fa;
  background: rgba(59, 130, 246, 0.22);
}

.group-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.group-id {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.68);
}

.detail-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
}

.detail-card p {
  margin: 0 0 8px;
  font-size: 14px;
}

.detail-card p span {
  color: rgba(255, 255, 255, 0.7);
}

.placeholder {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

@media (max-width: 980px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}
</style>
