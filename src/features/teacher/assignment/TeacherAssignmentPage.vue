<template>
  <div class="teacher-assignment-page">
    <header class="top-bar">
      <div class="title-area">
        <h1>任务管理</h1>
        <p>当前教师：{{ teacherId || '未获取到教师ID' }}</p>
      </div>
      <div class="actions">
        <button type="button" class="ghost-btn" @click="goMenu">返回菜单</button>
        <button type="button" class="danger-btn" @click="logout">退出登录</button>
      </div>
    </header>

    <main class="main-layout">
      <aside class="task-list-panel">
        <div class="panel-header">
          <div>
            <h2>任务列表</h2>
            <p>任务列表数据由后端接口实时返回。</p>
          </div>
          <div class="panel-actions">
            <span class="panel-badge">{{ assignmentList.length }} 项</span>
            <button
              type="button"
              class="create-btn"
              :disabled="modalOptionsLoading"
              @click="openCreateTaskModal"
            >
              添加任务
            </button>
            <button
              type="button"
              class="refresh-btn"
              :disabled="loading"
              @click="loadAssignments"
            >
              刷新
            </button>
          </div>
        </div>

        <p v-if="loading" class="status-text">正在加载任务列表...</p>
        <p v-else-if="errorMessage" class="status-text error">{{ errorMessage }}</p>
        <p v-else-if="assignmentList.length === 0" class="status-text">暂无任务数据</p>

        <div v-else class="scroll-shell task-list-scroll">
          <ul class="task-list">
            <li
              v-for="task in assignmentList"
              :key="task.id"
              class="task-item"
              :class="{ active: selectedTaskId === task.id }"
              @click="selectTask(task.id)"
            >
              <div class="task-item-top">
                <p class="task-item-title">{{ task.assignmentName || `任务 #${task.id}` }}</p>
                <div class="task-item-actions">
                  <span class="task-id">ID {{ task.id }}</span>
                  <button
                    type="button"
                    class="task-delete-btn"
                    :disabled="deletingTaskId === task.id"
                    @click.stop="handleDeleteTask(task)"
                  >
                    {{ deletingTaskId === task.id ? '...' : '×' }}
                  </button>
                </div>
              </div>
              <p class="task-item-subtitle">
                {{ task.setName || `题单 #${task.setID}` }} · {{ task.groupName || `小组 #${task.groupID}` }}
              </p>
              <div class="task-item-meta">
                <span>开始：{{ formatUtc8Display(task.beginTime) }}</span>
                <span>截止：{{ formatUtc8Display(task.endTime) }}</span>
              </div>
            </li>
          </ul>
        </div>
      </aside>

      <section class="task-detail-panel" aria-label="任务详情面板">
        <div v-if="selectedTask" class="detail-layout">
          <section class="detail-student-panel">
            <div class="detail-panel-header">
              <div>
                <h3>学生列表</h3>
                <p>{{ selectedTask.groupName || `小组 #${selectedTask.groupID}` }}</p>
              </div>
              <span class="panel-badge">{{ studentList.length }} 人</span>
            </div>

            <p v-if="studentLoading" class="status-text">正在加载学生列表...</p>
            <p v-else-if="studentErrorMessage" class="status-text error">{{ studentErrorMessage }}</p>
            <p v-else-if="studentList.length === 0" class="status-text">该小组暂无学生</p>

            <div v-else class="scroll-shell student-list-scroll">
              <ul class="student-list">
                <li
                  v-for="studentId in studentList"
                  :key="studentId"
                  class="student-item"
                  :class="{ active: selectedStudentId === studentId }"
                  @click="selectStudent(studentId)"
                >
                  <span class="student-avatar">👤</span>
                  <span class="student-id-text">{{ studentId }}</span>
                </li>
              </ul>
            </div>
          </section>

          <section class="detail-summary-panel">
            <div class="student-answer-panel">
              <div class="detail-panel-header">
                <div>
                  <h3>题目与作答</h3>
                  <p v-if="selectedStudentId">当前学生：{{ selectedStudentId }}</p>
                  <p v-else>请先在左侧学生列表中选择一名学生</p>
                </div>
              </div>

              <p v-if="studentAnswerLoading" class="status-text">正在加载题目与作答...</p>
              <p v-else-if="studentAnswerErrorMessage" class="status-text error">
                {{ studentAnswerErrorMessage }}
              </p>
              <p v-else-if="!selectedStudentId" class="status-text">
                选择学生后，可在此查看该任务下每道题及其作答内容。
              </p>
              <p v-else-if="questionAnswerList.length === 0" class="status-text">
                当前题单暂无题目。
              </p>

              <div v-else class="scroll-shell question-answer-scroll">
                <div class="question-answer-list">
                  <article
                    v-for="question in questionAnswerList"
                    :key="question.id"
                    class="question-answer-card"
                  >
                    <div class="question-header">
                      <span class="question-order">第 {{ question.orderNum }} 题</span>
                      <span class="question-type">{{ questionTypeText(question.type) }}</span>
                    </div>

                    <div class="question-body">
                      <template v-if="question.type === 'choice'">
                        <p class="question-content">{{ question.content || '暂无题目内容' }}</p>
                        <ul class="choice-option-list">
                          <li class="choice-option-item">A. {{ question.optionA || '暂无选项' }}</li>
                          <li class="choice-option-item">B. {{ question.optionB || '暂无选项' }}</li>
                          <li class="choice-option-item">C. {{ question.optionC || '暂无选项' }}</li>
                          <li class="choice-option-item">D. {{ question.optionD || '暂无选项' }}</li>
                        </ul>
                        <p class="question-answer-text">答案：{{ question.answer || '暂无答案' }}</p>
                      </template>

                      <template
                        v-else-if="question.type === 'fill' || question.type === 'subjective'"
                      >
                        <p class="question-content">{{ question.content || '暂无题目内容' }}</p>
                        <p class="question-answer-text">答案：{{ question.answer || '暂无答案' }}</p>
                      </template>

                      <template v-else-if="question.type === 'custom'">
                        <div v-if="question.imageURL" class="question-image-shell">
                          <img
                            :src="resolveImageUrl(question.imageURL)"
                            alt="自定义题图片"
                            class="question-image"
                          />
                        </div>
                        <p v-else class="empty-text">(未上传图片)</p>
                      </template>

                      <template v-else>
                        <p class="empty-text">暂不支持该题型展示</p>
                      </template>
                    </div>

                    <div class="student-answer-block">
                      <p class="student-answer-title">学生作答</p>
                      <p class="student-answer-text">
                        {{ question.studentAnswer?.content || '(未输入内容)' }}
                      </p>
                      <div
                        v-if="question.studentAnswer?.imgURL"
                        class="student-answer-image-shell"
                      >
                        <img
                          :src="resolveImageUrl(question.studentAnswer.imgURL)"
                          alt="学生作答图片"
                          class="student-answer-image"
                        />
                      </div>
                      <p v-else class="empty-text">(未上传图片)</p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div v-else class="task-detail-placeholder">
          <h3>任务详情</h3>
          <p>请先从左侧任务列表中选择一个任务。</p>
        </div>
      </section>
    </main>

    <div
      v-if="showCreateTaskModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="添加任务"
      @click.self="closeCreateTaskModal"
    >
      <section class="create-task-modal">
        <div class="modal-header">
          <div>
            <h2>添加任务</h2>
          </div>
          <button type="button" class="close-btn" @click="closeCreateTaskModal">×</button>
        </div>

        <div class="modal-columns">
          <section class="modal-column">
            <div class="modal-column-header">
              <h3>选择小组</h3>
              <span v-if="modalOptionsLoading" class="mini-status">加载中</span>
            </div>
            <p v-if="groupOptionsError" class="status-text error">{{ groupOptionsError }}</p>
            <p v-else-if="groupOptions.length === 0" class="status-text">暂无小组数据</p>
            <ul v-else class="selection-list">
              <li
                v-for="group in groupOptions"
                :key="group.id"
                class="selection-item"
                :class="{ active: selectedGroupIdForCreate === group.id }"
                @click="selectGroupForCreate(group.id)"
              >
                <span>{{ group.name || `小组 #${group.id}` }}</span>
                <span class="selection-tip">ID {{ group.id }}</span>
              </li>
            </ul>
          </section>

          <section class="modal-column">
            <div class="modal-column-header">
              <h3>选择题单</h3>
              <span v-if="modalOptionsLoading" class="mini-status">加载中</span>
            </div>
            <p v-if="questionSetOptionsError" class="status-text error">{{ questionSetOptionsError }}</p>
            <p v-else-if="questionSetOptions.length === 0" class="status-text">暂无题单数据</p>
            <ul v-else class="selection-list">
              <li
                v-for="setItem in questionSetOptions"
                :key="setItem.id"
                class="selection-item"
                :class="{ active: selectedQuestionSetIdForCreate === setItem.id }"
                @click="selectQuestionSetForCreate(setItem.id)"
              >
                <span>{{ setItem.name || `题单 #${setItem.id}` }}</span>
                <span class="selection-tip">ID {{ setItem.id }}</span>
              </li>
            </ul>
          </section>

          <section class="modal-column modal-form-column">
            <div class="modal-column-header">
              <h3>任务详情</h3>
            </div>

            <div class="detail-card">
              <label class="field-label" for="assignment-name">任务名称</label>
              <input
                id="assignment-name"
                v-model.trim="createTaskForm.assignmentName"
                class="form-input"
                type="text"
                maxlength="100"
                placeholder="请输入任务名称"
              />
            </div>

            <div class="detail-card">
              <label class="field-label" for="assignment-begin-time">开始时间</label>
              <button
                id="assignment-begin-time"
                type="button"
                class="time-input-shell time-trigger"
                :class="{ active: activeCalendarField === 'beginTime' }"
                @click="toggleCalendar('beginTime')"
              >
                <span class="time-input-icon">🗓</span>
                <span class="time-trigger-content">
                  <span class="time-trigger-label">开始时间</span>
                  <span class="time-trigger-value">{{ getCalendarFieldText('beginTime') }}</span>
                </span>
              </button>
              <div v-if="activeCalendarField === 'beginTime'" class="calendar-popover">
                <div class="calendar-toolbar">
                  <button type="button" class="calendar-nav-btn" @click="changeCalendarMonth(-1)">‹</button>
                  <strong>{{ calendarTitle }}</strong>
                  <button type="button" class="calendar-nav-btn" @click="changeCalendarMonth(1)">›</button>
                </div>
                <div class="calendar-weekdays">
                  <span v-for="weekday in calendarWeekLabels" :key="weekday">{{ weekday }}</span>
                </div>
                <div class="calendar-grid">
                  <button
                    v-for="dayItem in calendarDays"
                    :key="dayItem.key"
                    type="button"
                    class="calendar-day"
                    :class="{
                      muted: !dayItem.inCurrentMonth,
                      selected: dayItem.isSelected,
                      today: dayItem.isToday,
                    }"
                    @click="selectCalendarDate(dayItem)"
                  >
                    {{ dayItem.label }}
                  </button>
                </div>
                <div class="calendar-time-row">
                  <label class="calendar-select-shell">
                    <span>小时</span>
                    <select
                      class="calendar-select"
                      :value="activeCalendarHour"
                      @change="updateCalendarTime('hour', $event.target.value)"
                    >
                      <option v-for="hour in hourOptions" :key="hour" :value="hour">{{ hour }}</option>
                    </select>
                  </label>
                  <label class="calendar-select-shell">
                    <span>分钟</span>
                    <select
                      class="calendar-select"
                      :value="activeCalendarMinute"
                      @change="updateCalendarTime('minute', $event.target.value)"
                    >
                      <option v-for="minute in minuteOptions" :key="minute" :value="minute">
                        {{ minute }}
                      </option>
                    </select>
                  </label>
                </div>
                <div class="calendar-actions">
                  <button type="button" class="calendar-action-btn" @click="applyCurrentDateTime('beginTime')">
                    此刻
                  </button>
                  <button type="button" class="calendar-action-btn" @click="clearCalendarField('beginTime')">
                    清空
                  </button>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <label class="field-label" for="assignment-end-time">结束时间</label>
              <button
                id="assignment-end-time"
                type="button"
                class="time-input-shell time-trigger"
                :class="{ active: activeCalendarField === 'endTime' }"
                @click="toggleCalendar('endTime')"
              >
                <span class="time-input-icon">🕒</span>
                <span class="time-trigger-content">
                  <span class="time-trigger-label">结束时间</span>
                  <span class="time-trigger-value">{{ getCalendarFieldText('endTime') }}</span>
                </span>
              </button>
              <div v-if="activeCalendarField === 'endTime'" class="calendar-popover">
                <div class="calendar-toolbar">
                  <button type="button" class="calendar-nav-btn" @click="changeCalendarMonth(-1)">‹</button>
                  <strong>{{ calendarTitle }}</strong>
                  <button type="button" class="calendar-nav-btn" @click="changeCalendarMonth(1)">›</button>
                </div>
                <div class="calendar-weekdays">
                  <span v-for="weekday in calendarWeekLabels" :key="weekday">{{ weekday }}</span>
                </div>
                <div class="calendar-grid">
                  <button
                    v-for="dayItem in calendarDays"
                    :key="dayItem.key"
                    type="button"
                    class="calendar-day"
                    :class="{
                      muted: !dayItem.inCurrentMonth,
                      selected: dayItem.isSelected,
                      today: dayItem.isToday,
                    }"
                    @click="selectCalendarDate(dayItem)"
                  >
                    {{ dayItem.label }}
                  </button>
                </div>
                <div class="calendar-time-row">
                  <label class="calendar-select-shell">
                    <span>小时</span>
                    <select
                      class="calendar-select"
                      :value="activeCalendarHour"
                      @change="updateCalendarTime('hour', $event.target.value)"
                    >
                      <option v-for="hour in hourOptions" :key="hour" :value="hour">{{ hour }}</option>
                    </select>
                  </label>
                  <label class="calendar-select-shell">
                    <span>分钟</span>
                    <select
                      class="calendar-select"
                      :value="activeCalendarMinute"
                      @change="updateCalendarTime('minute', $event.target.value)"
                    >
                      <option v-for="minute in minuteOptions" :key="minute" :value="minute">
                        {{ minute }}
                      </option>
                    </select>
                  </label>
                </div>
                <div class="calendar-actions">
                  <button type="button" class="calendar-action-btn" @click="applyCurrentDateTime('endTime')">
                    此刻
                  </button>
                  <button type="button" class="calendar-action-btn" @click="clearCalendarField('endTime')">
                    清空
                  </button>
                </div>
              </div>
            </div>

            <div class="detail-card summary-card">
              <p class="summary-title">当前配置</p>
              <p><span>小组：</span>{{ selectedGroupOption?.name || '未选择' }}</p>
              <p><span>题单：</span>{{ selectedQuestionSetOption?.name || '未选择' }}</p>
              <p><span>任务名：</span>{{ createTaskForm.assignmentName || '未填写' }}</p>
              <p><span>开始：</span>{{ formatSelectedDateTime(createTaskForm.beginTime) }}</p>
              <p><span>结束：</span>{{ formatSelectedDateTime(createTaskForm.endTime) }}</p>
            </div>
          </section>
        </div>

        <div class="modal-footer">
          <p v-if="createTaskErrorMessage" class="status-text error modal-error">
            {{ createTaskErrorMessage }}
          </p>
          <div class="modal-footer-actions">
            <button
              type="button"
              class="ghost-btn"
              :disabled="createTaskSubmitting"
              @click="closeCreateTaskModal"
            >
              取消
            </button>
            <button
              type="button"
              class="create-btn"
              :disabled="createTaskSubmitting || modalOptionsLoading"
              @click="submitCreateTask"
            >
              {{ createTaskSubmitting ? '创建中...' : '确认创建' }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { API_BASE_URL } from '../../../shared/api/httpClient.js';
import {
  clearAuthSession,
  getStoredUser,
  getStoredUserId,
} from '../../../shared/auth/session.js';
import { ROUTES } from '../../../shared/constants/routes.js';
import { getGroupStudents, getTeacherGroups } from '../group/api.js';
import { getTeacherQuestionSets } from '../question/api.js';
import {
  createTeacherAssignment,
  deleteTeacherAssignment,
  getAssignmentStudentAnswers,
  getTeacherAssignments,
} from './api.js';

const teacherId = ref('');
const assignmentList = ref([]);
const selectedTaskId = ref(null);
const studentList = ref([]);
const selectedStudentId = ref('');
const studentLoading = ref(false);
const studentErrorMessage = ref('');
const questionAnswerList = ref([]);
const studentAnswerLoading = ref(false);
const studentAnswerErrorMessage = ref('');
const loading = ref(false);
const deletingTaskId = ref(null);
const errorMessage = ref('');
const showCreateTaskModal = ref(false);
const modalOptionsLoading = ref(false);
const groupOptions = ref([]);
const questionSetOptions = ref([]);
const groupOptionsError = ref('');
const questionSetOptionsError = ref('');
const selectedGroupIdForCreate = ref(null);
const selectedQuestionSetIdForCreate = ref(null);
const createTaskSubmitting = ref(false);
const createTaskErrorMessage = ref('');
const createTaskForm = ref({
  assignmentName: '',
  beginTime: '',
  endTime: '',
});
const activeCalendarField = ref(null);
const calendarViewYear = ref(new Date().getFullYear());
const calendarViewMonth = ref(new Date().getMonth());
const calendarWeekLabels = ['一', '二', '三', '四', '五', '六', '日'];
const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

const selectedGroupOption = computed(
  () => groupOptions.value.find((group) => group.id === selectedGroupIdForCreate.value) || null
);
const selectedQuestionSetOption = computed(
  () =>
    questionSetOptions.value.find((setItem) => setItem.id === selectedQuestionSetIdForCreate.value) ||
    null
);
const selectedTask = computed(
  () => assignmentList.value.find((task) => task.id === selectedTaskId.value) || null
);

const questionTypeText = (type) => {
  if (type === 'choice') {
    return '选择题';
  }
  if (type === 'fill') {
    return '填空题';
  }
  if (type === 'subjective') {
    return '主观题';
  }
  if (type === 'custom') {
    return '自定义题';
  }
  return '未知题型';
};

const resolveImageUrl = (value) => {
  if (!value) {
    return '';
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (value.startsWith('/')) {
    const apiOrigin = API_BASE_URL.startsWith('http')
      ? new URL(API_BASE_URL).origin
      : window.location.origin;
    return `${apiOrigin}${value}`;
  }
  return value;
};

const toIsoString = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString();
};

const formatUtc8Display = (value) => {
  if (!value) {
    return '未设置';
  }

  let normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return '未设置';
  }

  normalizedValue = normalizedValue.replace(' ', 'T');
  const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(normalizedValue);
  const utcDate = new Date(hasTimezone ? normalizedValue : `${normalizedValue}Z`);
  if (Number.isNaN(utcDate.getTime())) {
    return '未设置';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(utcDate);
};

const formatSelectedDateTime = (value) => {
  if (!value) {
    return '未设置';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '未设置';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const padNumber = (value) => String(value).padStart(2, '0');

const buildLocalDateTime = (year, month, day, hour, minute) =>
  `${year}-${padNumber(month)}-${padNumber(day)}T${padNumber(hour)}:${padNumber(minute)}`;

const parseLocalDateTime = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return {
    date,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
};

const getBaseDateParts = (fieldName = activeCalendarField.value) => {
  const parsed = parseLocalDateTime(createTaskForm.value[fieldName]);
  if (parsed) {
    return parsed;
  }
  const now = new Date();
  return {
    date: now,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
};

const activeCalendarValue = computed(() =>
  activeCalendarField.value ? createTaskForm.value[activeCalendarField.value] || '' : ''
);

const activeCalendarParts = computed(() => getBaseDateParts());

const activeCalendarHour = computed(() => padNumber(activeCalendarParts.value.hour));
const activeCalendarMinute = computed(() => padNumber(activeCalendarParts.value.minute));

const calendarTitle = computed(() => `${calendarViewYear.value}年 ${calendarViewMonth.value + 1}月`);

const getCalendarFieldText = (fieldName) => {
  const value = createTaskForm.value[fieldName];
  return value ? formatSelectedDateTime(value) : '请选择日期和时间';
};

const syncCalendarView = (fieldName) => {
  const target = getBaseDateParts(fieldName);
  calendarViewYear.value = target.year;
  calendarViewMonth.value = target.month - 1;
};

const toggleCalendar = (fieldName) => {
  if (activeCalendarField.value === fieldName) {
    activeCalendarField.value = null;
    return;
  }
  activeCalendarField.value = fieldName;
  syncCalendarView(fieldName);
};

const changeCalendarMonth = (offset) => {
  const nextMonth = calendarViewMonth.value + offset;
  if (nextMonth < 0) {
    calendarViewYear.value -= 1;
    calendarViewMonth.value = 11;
    return;
  }
  if (nextMonth > 11) {
    calendarViewYear.value += 1;
    calendarViewMonth.value = 0;
    return;
  }
  calendarViewMonth.value = nextMonth;
};

const calendarDays = computed(() => {
  const year = calendarViewYear.value;
  const monthIndex = calendarViewMonth.value;
  const firstDayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const currentMonthDays = new Date(year, monthIndex + 1, 0).getDate();
  const previousMonthDate = new Date(year, monthIndex, 0);
  const previousMonthDays = previousMonthDate.getDate();
  const selectedParts = parseLocalDateTime(activeCalendarValue.value);
  const today = new Date();
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    let itemYear = year;
    let itemMonth = monthIndex + 1;
    let itemDay = index - firstDayOffset + 1;
    let inCurrentMonth = true;

    if (itemDay <= 0) {
      inCurrentMonth = false;
      const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
      itemYear = monthIndex === 0 ? year - 1 : year;
      itemMonth = prevMonthIndex + 1;
      itemDay = previousMonthDays + itemDay;
    } else if (itemDay > currentMonthDays) {
      inCurrentMonth = false;
      const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
      itemYear = monthIndex === 11 ? year + 1 : year;
      itemMonth = nextMonthIndex + 1;
      itemDay -= currentMonthDays;
    }

    const isSelected =
      selectedParts &&
      selectedParts.year === itemYear &&
      selectedParts.month === itemMonth &&
      selectedParts.day === itemDay;
    const isToday =
      today.getFullYear() === itemYear &&
      today.getMonth() + 1 === itemMonth &&
      today.getDate() === itemDay;

    days.push({
      key: `${itemYear}-${itemMonth}-${itemDay}-${index}`,
      year: itemYear,
      month: itemMonth,
      day: itemDay,
      label: itemDay,
      inCurrentMonth,
      isSelected,
      isToday,
    });
  }

  return days;
});

const writeCalendarValue = (year, month, day, hour, minute) => {
  if (!activeCalendarField.value) {
    return;
  }
  createTaskForm.value[activeCalendarField.value] = buildLocalDateTime(year, month, day, hour, minute);
};

const selectCalendarDate = (dayItem) => {
  const target = getBaseDateParts();
  writeCalendarValue(dayItem.year, dayItem.month, dayItem.day, target.hour, target.minute);
  calendarViewYear.value = dayItem.year;
  calendarViewMonth.value = dayItem.month - 1;
};

const updateCalendarTime = (type, rawValue) => {
  const target = getBaseDateParts();
  const nextHour = type === 'hour' ? Number(rawValue) : target.hour;
  const nextMinute = type === 'minute' ? Number(rawValue) : target.minute;
  writeCalendarValue(target.year, target.month, target.day, nextHour, nextMinute);
};

const clearCalendarField = (fieldName) => {
  createTaskForm.value[fieldName] = '';
  if (activeCalendarField.value === fieldName) {
    activeCalendarField.value = null;
  }
};

const applyCurrentDateTime = (fieldName) => {
  const now = new Date();
  createTaskForm.value[fieldName] = buildLocalDateTime(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes()
  );
  activeCalendarField.value = fieldName;
  syncCalendarView(fieldName);
};

const resetCreateTaskForm = () => {
  selectedGroupIdForCreate.value = null;
  selectedQuestionSetIdForCreate.value = null;
  createTaskErrorMessage.value = '';
  activeCalendarField.value = null;
  createTaskForm.value = {
    assignmentName: '',
    beginTime: '',
    endTime: '',
  };
};

const selectGroupForCreate = (groupId) => {
  selectedGroupIdForCreate.value = groupId;
};

const selectQuestionSetForCreate = (setId) => {
  selectedQuestionSetIdForCreate.value = setId;
};

const loadModalOptions = async () => {
  if (!teacherId.value) {
    groupOptions.value = [];
    questionSetOptions.value = [];
    groupOptionsError.value = '未找到教师ID，请重新登录后重试。';
    questionSetOptionsError.value = '未找到教师ID，请重新登录后重试。';
    return;
  }

  modalOptionsLoading.value = true;
  groupOptionsError.value = '';
  questionSetOptionsError.value = '';

  try {
    const [groupResult, questionSetResult] = await Promise.allSettled([
      getTeacherGroups(teacherId.value),
      getTeacherQuestionSets(teacherId.value),
    ]);

    if (groupResult.status === 'fulfilled' && groupResult.value.status === 'success') {
      groupOptions.value = Array.isArray(groupResult.value.data) ? groupResult.value.data : [];
      if (
        groupOptions.value.length > 0 &&
        !groupOptions.value.some((group) => group.id === selectedGroupIdForCreate.value)
      ) {
        selectedGroupIdForCreate.value = groupOptions.value[0].id;
      }
    } else {
      groupOptions.value = [];
      groupOptionsError.value =
        groupResult.status === 'fulfilled'
          ? groupResult.value.msg || '获取小组列表失败'
          : groupResult.reason?.message || '获取小组列表失败';
    }

    if (questionSetResult.status === 'fulfilled' && questionSetResult.value.status === 'success') {
      questionSetOptions.value = Array.isArray(questionSetResult.value.data)
        ? questionSetResult.value.data
        : [];
      if (
        questionSetOptions.value.length > 0 &&
        !questionSetOptions.value.some((setItem) => setItem.id === selectedQuestionSetIdForCreate.value)
      ) {
        selectedQuestionSetIdForCreate.value = questionSetOptions.value[0].id;
      }
    } else {
      questionSetOptions.value = [];
      questionSetOptionsError.value =
        questionSetResult.status === 'fulfilled'
          ? questionSetResult.value.msg || '获取题单列表失败'
          : questionSetResult.reason?.message || '获取题单列表失败';
    }
  } finally {
    modalOptionsLoading.value = false;
  }
};

const openCreateTaskModal = async () => {
  resetCreateTaskForm();
  showCreateTaskModal.value = true;
  await loadModalOptions();
};

const closeCreateTaskModal = (force = false) => {
  if (createTaskSubmitting.value && !force) {
    return;
  }
  showCreateTaskModal.value = false;
  resetCreateTaskForm();
};

const resetSelectedTaskStudents = () => {
  studentList.value = [];
  selectedStudentId.value = '';
  studentLoading.value = false;
  studentErrorMessage.value = '';
  questionAnswerList.value = [];
  studentAnswerLoading.value = false;
  studentAnswerErrorMessage.value = '';
};

const loadTaskStudents = async (groupId) => {
  if (!groupId) {
    resetSelectedTaskStudents();
    return;
  }

  studentLoading.value = true;
  studentErrorMessage.value = '';

  try {
    const response = await getGroupStudents(groupId);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取学生列表失败');
    }
    studentList.value = Array.isArray(response.data) ? response.data : [];
    if (!studentList.value.includes(selectedStudentId.value)) {
      selectedStudentId.value = '';
      questionAnswerList.value = [];
      studentAnswerErrorMessage.value = '';
    }
  } catch (error) {
    studentList.value = [];
    selectedStudentId.value = '';
    questionAnswerList.value = [];
    studentErrorMessage.value = error.message || '获取学生列表失败';
  } finally {
    studentLoading.value = false;
  }
};

const loadStudentAnswerDetails = async (studentId) => {
  if (!selectedTask.value?.id || !studentId) {
    questionAnswerList.value = [];
    studentAnswerLoading.value = false;
    studentAnswerErrorMessage.value = '';
    return;
  }

  studentAnswerLoading.value = true;
  studentAnswerErrorMessage.value = '';
  questionAnswerList.value = [];

  try {
    const response = await getAssignmentStudentAnswers(selectedTask.value.id, studentId);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取学生作答详情失败');
    }
    questionAnswerList.value = Array.isArray(response.data?.questions) ? response.data.questions : [];
  } catch (error) {
    questionAnswerList.value = [];
    studentAnswerErrorMessage.value = error.message || '获取学生作答详情失败';
  } finally {
    studentAnswerLoading.value = false;
  }
};

const selectStudent = async (studentId) => {
  selectedStudentId.value = studentId;
  await loadStudentAnswerDetails(studentId);
};

const selectTask = async (taskId) => {
  selectedTaskId.value = taskId;
  selectedStudentId.value = '';
  questionAnswerList.value = [];
  studentAnswerLoading.value = false;
  studentAnswerErrorMessage.value = '';
  const task = assignmentList.value.find((item) => item.id === taskId);
  await loadTaskStudents(task?.groupID);
};

const loadAssignments = async (preferredTaskId = null) => {
  if (!teacherId.value) {
    assignmentList.value = [];
    selectedTaskId.value = null;
    resetSelectedTaskStudents();
    errorMessage.value = '未找到教师ID，请重新登录后重试。';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await getTeacherAssignments(teacherId.value);
    if (response.status !== 'success') {
      throw new Error(response.msg || '获取任务列表失败');
    }

    assignmentList.value = Array.isArray(response.data) ? response.data : [];
    if (assignmentList.value.length === 0) {
      selectedTaskId.value = null;
      resetSelectedTaskStudents();
      return;
    }

    const matchedTask = assignmentList.value.find(
      (item) => item.id === preferredTaskId || item.id === selectedTaskId.value
    );
    if (matchedTask) {
      selectedTaskId.value = matchedTask.id;
      await loadTaskStudents(matchedTask.groupID);
      return;
    }
    selectedTaskId.value = assignmentList.value[0].id;
    await loadTaskStudents(assignmentList.value[0].groupID);
  } catch (error) {
    assignmentList.value = [];
    selectedTaskId.value = null;
    resetSelectedTaskStudents();
    errorMessage.value = error.message || '获取任务列表失败';
  } finally {
    loading.value = false;
  }
};

const handleDeleteTask = async (task) => {
  if (!task?.id || deletingTaskId.value) {
    return;
  }

  const taskName = task.assignmentName || `任务 #${task.id}`;
  if (!window.confirm(`确认删除“${taskName}”吗？该任务及其学生作答记录将一并删除。`)) {
    return;
  }

  deletingTaskId.value = task.id;
  errorMessage.value = '';
  try {
    const response = await deleteTeacherAssignment(task.id);
    if (response.status !== 'success') {
      throw new Error(response.msg || '删除任务失败');
    }

    const nextTask =
      selectedTaskId.value === task.id
        ? assignmentList.value.find((item) => item.id !== task.id) || null
        : assignmentList.value.find((item) => item.id === selectedTaskId.value) || null;
    await loadAssignments(nextTask?.id || null);
  } catch (error) {
    errorMessage.value = error.message || '删除任务失败';
  } finally {
    deletingTaskId.value = null;
  }
};

const submitCreateTask = async () => {
  if (createTaskSubmitting.value) {
    return;
  }

  createTaskErrorMessage.value = '';

  const assignmentName = createTaskForm.value.assignmentName.trim();
  if (!selectedGroupIdForCreate.value) {
    createTaskErrorMessage.value = '请选择小组';
    return;
  }
  if (!selectedQuestionSetIdForCreate.value) {
    createTaskErrorMessage.value = '请选择题单';
    return;
  }
  if (!assignmentName) {
    createTaskErrorMessage.value = '请输入任务名称';
    return;
  }

  const beginTime = toIsoString(createTaskForm.value.beginTime);
  const endTime = toIsoString(createTaskForm.value.endTime);
  if (!beginTime || !endTime) {
    createTaskErrorMessage.value = '请选择开始时间和结束时间';
    return;
  }
  if (new Date(endTime).getTime() <= new Date(beginTime).getTime()) {
    createTaskErrorMessage.value = '结束时间必须晚于开始时间';
    return;
  }

  createTaskSubmitting.value = true;
  try {
    const response = await createTeacherAssignment({
      assignmentName,
      setID: selectedQuestionSetIdForCreate.value,
      groupID: selectedGroupIdForCreate.value,
      beginTime,
      endTime,
    });
    if (response.status !== 'success') {
      throw new Error(response.msg || '创建任务失败');
    }

    const createdTaskId = response.data?.id || null;
    closeCreateTaskModal(true);
    await loadAssignments(createdTaskId);
  } catch (error) {
    createTaskErrorMessage.value = error.message || '创建任务失败';
  } finally {
    createTaskSubmitting.value = false;
  }
};

const goMenu = () => {
  window.location.href = ROUTES.TEACHER_MENU;
};

const logout = () => {
  clearAuthSession();
  window.location.href = ROUTES.AUTH;
};

onMounted(async () => {
  const storedUser = getStoredUser();
  teacherId.value = getStoredUserId() || storedUser?.id || '';
  await loadAssignments();
});
</script>

<style scoped>
.teacher-assignment-page {
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

.actions,
.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.panel-actions {
  justify-content: flex-end;
}

.ghost-btn,
.danger-btn,
.refresh-btn,
.create-btn,
.close-btn {
  min-height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #eef3ff;
  padding: 8px 14px;
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.ghost-btn:hover,
.danger-btn:hover,
.refresh-btn:hover,
.create-btn:hover,
.close-btn:hover {
  transform: translateY(-1px);
}

.create-btn {
  border-color: rgba(96, 165, 250, 0.36);
  background: rgba(37, 99, 235, 0.24);
}

.danger-btn {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(127, 29, 29, 0.32);
}

.refresh-btn:disabled,
.create-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.main-layout {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.task-list-panel,
.task-detail-panel {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
}

.task-list-panel {
  padding: 18px;
  display: flex;
  flex-direction: column;
}

.task-detail-panel {
  min-height: 0;
  max-height: calc(100vh - 136px);
  padding: 18px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.task-detail-panel::-webkit-scrollbar {
  width: 8px;
}

.task-detail-panel::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.55);
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 18px;
  min-height: 0;
}

.detail-student-panel,
.detail-summary-panel,
.task-detail-placeholder {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 18px;
}

.detail-student-panel,
.detail-summary-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.detail-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.detail-panel-header p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.student-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.student-item:hover,
.student-item.active {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.45);
  background: rgba(37, 99, 235, 0.16);
}

.student-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.16);
}

.student-id-text {
  font-size: 14px;
  font-weight: 600;
  color: #e0ecff;
  word-break: break-all;
}

.student-answer-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.scroll-shell {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.task-list-scroll {
  margin-top: 16px;
  max-height: calc(100vh - 260px);
  padding-right: 6px;
}

.student-list-scroll {
  margin-top: 16px;
  max-height: calc(100vh - 320px);
  padding-right: 6px;
}

.question-answer-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.question-answer-scroll {
  margin-top: 18px;
  max-height: calc(100vh - 300px);
  padding-right: 6px;
}

.question-answer-card {
  padding: 18px 0 0;
  border-top: 2px solid rgba(255, 255, 255, 0.18);
}

.question-answer-card:first-child {
  padding-top: 0;
  border-top: none;
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.question-order {
  color: #f8fbff;
  font-size: 15px;
  font-weight: 700;
}

.question-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.16);
  color: #bfdbfe;
  font-size: 12px;
}

.question-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-content,
.question-answer-text,
.student-answer-text,
.empty-text,
.student-answer-title {
  margin: 0;
}

.question-content,
.question-answer-text,
.student-answer-text {
  line-height: 1.7;
  color: #eef3ff;
  white-space: pre-wrap;
  word-break: break-word;
}

.choice-option-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.choice-option-item {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #e0ecff;
  line-height: 1.6;
  word-break: break-word;
}

.question-image-shell,
.student-answer-image-shell {
  width: 100%;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.question-image,
.student-answer-image {
  display: block;
  width: 100%;
  max-height: 420px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.2);
}

.student-answer-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.student-answer-title {
  font-size: 14px;
  font-weight: 700;
  color: #c7d2fe;
}

.empty-text {
  color: rgba(255, 255, 255, 0.62);
}

.task-detail-placeholder {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.task-detail-placeholder h3,
.task-detail-placeholder p {
  margin: 0;
}

.task-detail-placeholder p {
  color: rgba(255, 255, 255, 0.72);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-header > div:first-child {
  min-width: 0;
}

.panel-header h2 {
  margin: 0;
}

.panel-header p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  line-height: 1.6;
}

.panel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.status-text {
  margin: 0;
  padding: 18px 0 8px;
  color: rgba(255, 255, 255, 0.75);
}

.status-text.error {
  color: #fca5a5;
}

.task-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.task-item:hover,
.task-item.active {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.45);
  background: rgba(79, 70, 229, 0.12);
}

.task-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.task-item-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.task-item-title,
.task-item-subtitle {
  margin: 0;
}

.task-item-title {
  font-size: 16px;
  font-weight: 700;
}

.task-id,
.task-item-subtitle,
.task-item-meta {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
}

.task-delete-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid rgba(248, 113, 113, 0.3);
  background: rgba(127, 29, 29, 0.24);
  color: #fca5a5;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.task-delete-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(248, 113, 113, 0.5);
  background: rgba(153, 27, 27, 0.34);
}

.task-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.task-item-subtitle {
  margin-top: 8px;
  line-height: 1.5;
}

.task-item-meta {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(5, 8, 18, 0.78);
  backdrop-filter: blur(10px);
}

.create-task-modal {
  width: min(1200px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, rgba(23, 28, 45, 0.98) 0%, rgba(14, 18, 31, 0.98) 100%);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.45);
}

.modal-header,
.modal-footer,
.modal-column-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-header {
  padding: 24px 24px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h2,
.modal-column-header h3,
.summary-title {
  margin: 0;
}

.modal-header p,
.selection-tip,
.summary-card p {
  color: rgba(255, 255, 255, 0.7);
}

.close-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 12px;
  font-size: 24px;
  line-height: 1;
}

.modal-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(320px, 1.15fr);
  gap: 18px;
  padding: 24px;
}

.modal-column {
  min-height: 440px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.mini-status {
  color: #93c5fd;
  font-size: 12px;
}

.selection-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.selection-item:hover,
.selection-item.active {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.4);
  background: rgba(37, 99, 235, 0.16);
}

.selection-tip,
.modal-error {
  font-size: 12px;
}

.modal-form-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-card {
  position: relative;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.field-label {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  color: #dbeafe;
}

.form-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: #eef3ff;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
}

.time-input-shell {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: linear-gradient(135deg, rgba(40, 50, 84, 0.48) 0%, rgba(22, 28, 48, 0.62) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.time-trigger {
  text-align: left;
  cursor: pointer;
}

.time-trigger.active,
.time-input-shell:focus-within {
  border-color: rgba(96, 165, 250, 0.72);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}

.time-trigger-content {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.time-trigger-label {
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}

.time-trigger-value {
  color: #eef3ff;
  font-size: 14px;
  font-weight: 600;
}

.time-input-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.18);
  font-size: 16px;
}

.calendar-popover {
  margin-top: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(96, 165, 250, 0.22);
  background: linear-gradient(180deg, rgba(13, 18, 34, 0.98) 0%, rgba(21, 28, 46, 0.96) 100%);
  box-shadow: 0 16px 36px rgba(4, 12, 28, 0.45);
}

.calendar-toolbar,
.calendar-time-row,
.calendar-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.calendar-toolbar {
  margin-bottom: 12px;
}

.calendar-toolbar strong {
  font-size: 15px;
  letter-spacing: 0.02em;
}

.calendar-nav-btn,
.calendar-action-btn {
  min-height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #eef3ff;
  padding: 6px 12px;
  cursor: pointer;
}

.calendar-nav-btn {
  width: 36px;
  padding: 0;
  font-size: 18px;
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

.calendar-weekdays {
  margin-bottom: 8px;
}

.calendar-weekdays span {
  text-align: center;
  color: rgba(255, 255, 255, 0.56);
  font-size: 12px;
}

.calendar-day {
  min-height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: #eef3ff;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.calendar-day:hover {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.42);
  background: rgba(59, 130, 246, 0.12);
}

.calendar-day.muted {
  color: rgba(255, 255, 255, 0.36);
  background: rgba(255, 255, 255, 0.02);
}

.calendar-day.today {
  border-color: rgba(56, 189, 248, 0.52);
}

.calendar-day.selected {
  border-color: rgba(96, 165, 250, 0.82);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.38) 0%, rgba(99, 102, 241, 0.4) 100%);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.25);
}

.calendar-time-row {
  margin-top: 14px;
}

.calendar-select-shell {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.calendar-select {
  min-height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: #eef3ff;
  padding: 0 12px;
  outline: none;
}

.calendar-actions {
  margin-top: 14px;
  justify-content: flex-end;
}

.form-input:focus {
  border-color: rgba(96, 165, 250, 0.72);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}

.summary-card {
  margin-top: auto;
}

.summary-card p {
  margin: 10px 0 0;
}

.summary-card span {
  color: #dbeafe;
}

.modal-footer {
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px 24px;
}

.modal-footer-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 960px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .task-detail-panel {
    max-height: calc(100vh - 190px);
  }

  .detail-layout {
    grid-template-columns: 1fr;
  }

  .task-list-scroll,
  .student-list-scroll,
  .question-answer-scroll {
    max-height: none;
  }

  .choice-option-list {
    grid-template-columns: 1fr;
  }

  .modal-columns {
    grid-template-columns: 1fr;
  }

  .modal-column {
    min-height: auto;
  }
}

@media (max-width: 640px) {
  .teacher-assignment-page {
    padding: 16px;
  }

  .top-bar,
  .panel-header,
  .task-item-top,
  .question-header,
  .modal-header,
  .modal-column-header,
  .modal-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions,
  .panel-actions,
  .modal-footer-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .panel-badge,
  .create-btn,
  .refresh-btn {
    flex: 1 1 120px;
    justify-content: center;
  }

  .calendar-time-row {
    flex-direction: column;
    align-items: stretch;
  }

  .modal-overlay {
    padding: 16px;
  }

  .modal-columns,
  .modal-header,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .selection-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
