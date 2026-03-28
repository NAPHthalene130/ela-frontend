<template>
  <div class="teacher-group-page">
    <header class="top-bar">
      <div class="title-area">
        <h1>管理小组</h1>
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
          <div class="panel-actions">
            <button type="button" class="create-btn" @click="openCreateGroup">
              创建小组
            </button>
            <button type="button" class="refresh-btn" @click="loadGroups" :disabled="loading">
              刷新
            </button>
          </div>
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
            @click="selectGroup(group.id)"
          >
            <p class="group-name">{{ group.name }}</p>
            <p class="group-id">ID: {{ group.id }}</p>
          </li>
        </ul>
      </section>

      <section class="group-detail-panel">
        <h2>管理小组</h2>
        <div v-if="showCreateForm" class="create-card">
          <p class="create-title">新建小组</p>
          <input
            v-model.trim="newGroupName"
            class="create-input"
            type="text"
            maxlength="60"
            placeholder="请输入小组名称"
            @keyup.enter="submitCreateGroup"
          />
          <div class="create-actions">
            <button type="button" class="create-btn" @click="submitCreateGroup" :disabled="creating">
              {{ creating ? '创建中...' : '确认创建' }}
            </button>
            <button type="button" class="ghost-btn" @click="cancelCreateGroup" :disabled="creating">
              取消
            </button>
          </div>
          <p v-if="createErrorMessage" class="status-text error">{{ createErrorMessage }}</p>
        </div>
        <div v-if="selectedGroup" class="detail-card">
          <p><span>小组ID：</span>{{ selectedGroup.id }}</p>
          <p><span>小组名称：</span>{{ selectedGroup.name }}</p>
          <p><span>教师ID：</span>{{ teacherId }}</p>
        </div>
        <div v-if="selectedGroup" class="member-card">
          <div class="member-header">
            <h3>小组成员</h3>
            <button type="button" class="create-btn" @click="openAddStudentForm">
              添加学生
            </button>
          </div>

          <div v-if="showAddStudentForm" class="add-student-box">
            <input
              v-model.trim="newStudentId"
              class="create-input"
              type="text"
              maxlength="60"
              placeholder="请输入学生ID"
              @keyup.enter="submitAddStudent"
            />
            <div class="create-actions">
              <button type="button" class="create-btn" @click="submitAddStudent" :disabled="addingStudent">
                {{ addingStudent ? '添加中...' : '确认添加' }}
              </button>
              <button type="button" class="ghost-btn" @click="cancelAddStudent" :disabled="addingStudent">
                取消
              </button>
            </div>
            <p v-if="addStudentErrorMessage" class="status-text error">{{ addStudentErrorMessage }}</p>
          </div>

          <p v-if="memberLoading" class="status-text">正在加载成员...</p>
          <p v-else-if="memberErrorMessage" class="status-text error">{{ memberErrorMessage }}</p>
          <p v-else-if="groupMembers.length === 0" class="status-text">当前小组暂无成员</p>
          <ul v-else class="member-list">
            <li v-for="studentId in groupMembers" :key="studentId" class="member-item">
              {{ studentId }}
            </li>
          </ul>
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
import {
  addGroupStudent,
  createTeacherGroup,
  getGroupStudents,
  getTeacherGroups,
} from './api.js';

const groups = ref([]);
const loading = ref(false);
const errorMessage = ref('');
const selectedGroupId = ref(null);
const teacherId = ref('');
const showCreateForm = ref(false);
const newGroupName = ref('');
const creating = ref(false);
const createErrorMessage = ref('');
const groupMembers = ref([]);
const memberLoading = ref(false);
const memberErrorMessage = ref('');
const showAddStudentForm = ref(false);
const newStudentId = ref('');
const addingStudent = ref(false);
const addStudentErrorMessage = ref('');

const selectedGroup = computed(() =>
  groups.value.find((group) => group.id === selectedGroupId.value) || null
);

// 支持指定优先选中的小组，便于创建成功后自动高亮新小组。
const loadGroups = async (preferredGroupId = null) => {
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
    const matchedGroup = groups.value.find(
      (group) => group.id === preferredGroupId || group.id === selectedGroupId.value
    );
    if (groups.value.length > 0) {
      const nextGroupId = matchedGroup?.id || groups.value[0].id;
      await selectGroup(nextGroupId);
    } else {
      resetSelectedGroupData();
    }
  } catch (error) {
    groups.value = [];
    resetSelectedGroupData();
    errorMessage.value = error.message || '获取小组列表失败';
  } finally {
    loading.value = false;
  }
};

const resetSelectedGroupData = () => {
  selectedGroupId.value = null;
  groupMembers.value = [];
  memberErrorMessage.value = '';
  memberLoading.value = false;
  showAddStudentForm.value = false;
  newStudentId.value = '';
  addStudentErrorMessage.value = '';
};

const loadGroupMembers = async (groupId) => {
  if (!groupId) {
    groupMembers.value = [];
    return;
  }

  memberLoading.value = true;
  memberErrorMessage.value = '';

  try {
    const response = await getGroupStudents(groupId);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取成员列表失败');
    }
    groupMembers.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    groupMembers.value = [];
    memberErrorMessage.value = error.message || '获取成员列表失败';
  } finally {
    memberLoading.value = false;
  }
};

const selectGroup = async (groupId) => {
  if (!groupId) {
    resetSelectedGroupData();
    return;
  }

  selectedGroupId.value = groupId;
  showAddStudentForm.value = false;
  newStudentId.value = '';
  addStudentErrorMessage.value = '';
  await loadGroupMembers(groupId);
};

const openCreateGroup = () => {
  showCreateForm.value = true;
  createErrorMessage.value = '';
};

const cancelCreateGroup = () => {
  if (creating.value) {
    return;
  }
  newGroupName.value = '';
  createErrorMessage.value = '';
  showCreateForm.value = false;
};

const submitCreateGroup = async () => {
  if (creating.value) {
    return;
  }

  if (!newGroupName.value) {
    createErrorMessage.value = '请输入小组名称。';
    return;
  }

  if (!teacherId.value) {
    createErrorMessage.value = '未找到教师ID，请重新登录后重试。';
    return;
  }

  creating.value = true;
  createErrorMessage.value = '';

  try {
    // 由后端基于 JWT 获取 teacherID，前端仅提交小组名称。
    const response = await createTeacherGroup(newGroupName.value);
    if (response.status !== 'success') {
      throw new Error(response.msg || '创建小组失败');
    }

    const createdGroupId = response.data?.id ?? null;
    newGroupName.value = '';
    showCreateForm.value = false;
    await loadGroups(createdGroupId);
  } catch (error) {
    createErrorMessage.value = error.message || '创建小组失败';
  } finally {
    creating.value = false;
  }
};

const openAddStudentForm = () => {
  showAddStudentForm.value = true;
  addStudentErrorMessage.value = '';
};

const cancelAddStudent = () => {
  if (addingStudent.value) {
    return;
  }
  showAddStudentForm.value = false;
  newStudentId.value = '';
  addStudentErrorMessage.value = '';
};

const submitAddStudent = async () => {
  if (addingStudent.value) {
    return;
  }
  if (!selectedGroupId.value) {
    addStudentErrorMessage.value = '请先选择小组。';
    return;
  }
  if (!newStudentId.value) {
    addStudentErrorMessage.value = '请输入学生ID。';
    return;
  }

  addingStudent.value = true;
  addStudentErrorMessage.value = '';

  try {
    const response = await addGroupStudent(selectedGroupId.value, newStudentId.value);
    if (response.status !== 'success') {
      throw new Error(response.msg || '添加学生失败');
    }
    newStudentId.value = '';
    showAddStudentForm.value = false;
    await loadGroupMembers(selectedGroupId.value);
  } catch (error) {
    addStudentErrorMessage.value = error.message || '添加学生失败';
  } finally {
    addingStudent.value = false;
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
.refresh-btn,
.create-btn {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #eef3ff;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
}

.create-btn {
  border-color: #2563eb;
  background: #2563eb;
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

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
  min-height: 132px;
}

.create-card {
  border: 1px solid rgba(37, 99, 235, 0.5);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
  background: rgba(37, 99, 235, 0.12);
}

.member-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 14px;
  margin-top: 14px;
  background: rgba(255, 255, 255, 0.03);
  min-height: 260px;
  max-height: 360px;
  display: flex;
  flex-direction: column;
}

.member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.member-header h3 {
  margin: 0;
  font-size: 15px;
}

.add-student-box {
  margin-bottom: 10px;
}

.member-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.member-item {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  font-size: 13px;
}

.create-title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
}

.create-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(15, 16, 22, 0.55);
  color: #eef3ff;
}

.create-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
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
