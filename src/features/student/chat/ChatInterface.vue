<template>
  <div class="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans text-gray-900">
    <aside class="hidden h-full w-1/5 flex-col border-r border-gray-800 bg-gray-900 text-gray-100 md:flex">
      <div class="border-b border-gray-800 p-4">
        <button
          @click="startNewChat"
          class="flex w-full items-center justify-start gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-gray-700"
        >
          <PlusIcon class="h-5 w-5" />
          <span>新建学习对话</span>
        </button>
      </div>

      <div class="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
        <div
          v-for="item in historyList"
          :key="item.session_id"
          @click="loadSession(item.session_id)"
          :class="[
            'group flex cursor-pointer items-center gap-3 truncate rounded-lg px-3 py-3 text-sm transition-colors duration-200',
            currentSessionId === item.session_id
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
          ]"
        >
          <MessageSquareIcon class="h-4 w-4 flex-shrink-0" />
          <span class="flex-1 truncate">{{ item.title }}</span>
          <button
            @click.stop="removeSession(item)"
            class="hidden rounded p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-red-400 group-hover:flex"
            title="删除对话"
          >
            <Trash2Icon class="h-4 w-4" />
          </button>
        </div>

        <button
          v-if="hasMoreHistory"
          @click="loadMoreHistory"
          class="w-full py-2 text-center text-xs text-gray-500 hover:text-gray-300"
        >
          加载更多...
        </button>
      </div>

      <div class="border-t border-gray-800 p-4">
        <button
          @click="goBackToMenu"
          class="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700"
          title="返回菜单"
        >
          <ArrowLeftIcon class="h-4 w-4" />
          <span>返回菜单</span>
        </button>
        <div class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-800">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
            U
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-gray-200">{{ userId || '未登录用户' }}</p>
          </div>
          <MoreHorizontalIcon class="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </aside>

    <main class="relative flex h-full flex-1 flex-col bg-white">
      <header class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-sm">
        <div class="flex min-w-0 items-center gap-2">
          <button
            @click="goBackToMenu"
            class="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
            title="返回菜单"
          >
            <ArrowLeftIcon class="h-4 w-4" />
            <span>返回菜单</span>
          </button>
          <button class="rounded-md p-2 hover:bg-gray-100 md:hidden">
            <MenuIcon class="h-5 w-5 text-gray-600" />
          </button>
          <div class="flex items-center gap-2">
            <span class="whitespace-nowrap text-xs text-gray-500">课程选择</span>
            <select
              v-model="selectedCourse"
              class="h-8 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
              :disabled="courseOptions.length === 0"
            >
              <option
                v-for="course in courseOptions"
                :key="course"
                :value="course"
              >
                {{ course }}
              </option>
            </select>
          </div>
          <h1 class="max-w-xs truncate text-sm font-medium text-gray-700 md:max-w-md">
            {{ currentSessionTitle || '新对话' }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="清空上下文"
            @click="clearContext"
          >
            <RotateCcwIcon class="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        ref="messageContainerRef"
        class="scroll-smooth flex-1 space-y-6 overflow-y-auto p-4 md:p-6"
      >
        <div
          v-if="messages.length === 0"
          class="animate-fade-in-up flex h-full flex-col items-center justify-center space-y-6 text-center opacity-0"
          style="animation-fill-mode: forwards;"
        >
          <div class="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
            <BotIcon class="h-8 w-8 text-gray-800" />
          </div>
          <h2 class="text-2xl font-semibold text-gray-800">我是你的智能学习助手</h2>
          <p class="text-gray-500">今天想复习点什么？</p>

          <div class="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 px-4 md:grid-cols-2">
            <button class="rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50">
              <span class="block text-sm font-medium text-gray-800">解释二分查找</span>
              <span class="mt-1 block text-xs text-gray-500">算法复杂度分析</span>
            </button>
            <button class="rounded-xl border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50">
              <span class="block text-sm font-medium text-gray-800">Vue 生命周期</span>
              <span class="mt-1 block text-xs text-gray-500">created vs mounted</span>
            </button>
          </div>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="[
            'mx-auto flex w-full max-w-3xl gap-4',
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            v-if="msg.role === 'assistant'"
            class="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-sm"
          >
            <BotIcon class="h-5 w-5" />
          </div>

          <div
            :class="[
              'relative max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm md:max-w-[75%]',
              msg.role === 'user'
                ? 'rounded-br-none bg-blue-600 text-white'
                : 'rounded-bl-none border border-gray-100 bg-gray-50 text-gray-800'
            ]"
          >
            <div
              v-if="msg.role === 'assistant' && msg.tipTitle"
              class="mb-2 inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600"
            >
              {{ msg.tipTitle }}
            </div>
            <div
              v-if="msg.role === 'assistant' && msg.reasoningContent"
              class="mb-2 whitespace-pre-wrap text-xs leading-relaxed text-gray-400"
            >
              {{ msg.reasoningContent }}
            </div>
            <div v-if="msg.role === 'assistant'">
              <div v-if="msg.content" class="markdown-body font-sans" v-html="renderMarkdown(msg.content)"></div>
              
              <!-- 占位 UI：渲染非例题的组件数据 -->
              <div v-if="msg.component_type && msg.component_type !== 'example_card'" class="mt-3 rounded-lg border border-dashed border-gray-300 bg-white p-4">
                <div class="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Render Component: {{ msg.component_type }}
                </div>
                <pre class="overflow-x-auto whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 p-2 rounded">{{ JSON.stringify(msg.payload, null, 2) }}</pre>
              </div>
            </div>
            <div v-else class="whitespace-pre-wrap font-sans">{{ msg.content }}</div>
          </div>

          <div
            v-if="msg.role === 'user'"
            class="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 shadow-sm"
          >
            <UserIcon class="h-5 w-5" />
          </div>
        </div>

        <div v-if="isLoading && isSwitchingSession" class="mx-auto flex w-full max-w-3xl justify-start gap-4">
          <div class="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
            <BotIcon class="h-5 w-5" />
          </div>
          <div class="rounded-2xl rounded-bl-none border border-gray-100 bg-gray-50 px-5 py-4">
            <div class="flex space-x-1">
              <div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 0s"></div>
              <div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 0.2s"></div>
              <div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </div>

        <div class="h-24"></div>
      </div>

      <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent px-4 pb-6 pt-10">
        <div class="relative mx-auto max-w-3xl">
          <div class="relative flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg transition-all focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-200">
            <button class="mb-0.5 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" title="附件">
              <PaperclipIcon class="h-5 w-5" />
            </button>

            <textarea
              ref="inputRef"
              v-model="inputContent"
              @keydown.enter.prevent="handleEnter"
              placeholder="输入你的问题..."
              rows="1"
              class="custom-scrollbar max-h-48 flex-1 resize-none border-none bg-transparent px-2 py-3 text-sm leading-normal text-gray-800 placeholder-gray-400 focus:ring-0"
              style="min-height: 44px;"
            ></textarea>

            <button
              @click="sendMessage"
              :disabled="!inputContent.trim() || isLoading"
              :class="[
                'mb-0.5 rounded-xl p-2 transition-all duration-200',
                inputContent.trim() && !isLoading
                  ? 'bg-black text-white shadow-md hover:bg-gray-800'
                  : 'cursor-not-allowed bg-gray-100 text-gray-300'
              ]"
              title="发送"
            >
              <ArrowUpIcon class="h-5 w-5" />
            </button>
          </div>

          <div class="mt-2 text-center">
            <p class="text-[10px] text-gray-400">
              AI 助手可能会生成不准确的信息，请注意核实。
            </p>
          </div>
        </div>
      </div>
    </main>

    <aside class="hidden h-full w-72 flex-col border-l border-gray-200 bg-white xl:flex">
      <div class="border-b border-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-gray-700">功能卡片</h2>
      </div>

      <div class="custom-scrollbar flex-1 overflow-y-auto p-3">
        <div v-if="featureCards.length === 0" class="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 text-sm text-gray-400">
          当前无交互内容
        </div>
        <div v-else class="space-y-3">
          <article
            v-for="card in featureCards"
            :key="card.id"
            @click="openFeatureCard(card)"
            class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
          >
            <div class="flex items-start justify-between mb-1.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-700">
                {{ card.type === 'questions' ? '习题推荐' : '例题' }}
              </span>
              <PlayCircleIcon class="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 class="line-clamp-1 text-sm font-semibold text-gray-800">{{ card.title }}</h3>
            <p class="mt-1 line-clamp-2 text-xs text-gray-500 leading-relaxed">{{ card.summary }}</p>
          </article>
        </div>
      </div>
    </aside>

    <!-- Modal Overlay -->
    <div v-if="activeModalPayload" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300">
      <div class="w-full max-w-2xl h-full max-h-[85vh] flex animate-fade-in-up">
        <ExampleCard 
          v-if="activeModalType === 'example_card'" 
          :payload="activeModalPayload" 
          @close="closeFeatureCard" 
        />
        <QuestionsCard
          v-else-if="activeModalType === 'questions'"
          :payload="activeModalPayload"
          @close="closeFeatureCard"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import 'katex/dist/katex.min.css';
import {
  PlusIcon, 
  MessageSquareIcon, 
  MoreHorizontalIcon, 
  ArrowLeftIcon,
  MenuIcon, 
  RotateCcwIcon, 
  BotIcon, 
  UserIcon, 
  PaperclipIcon, 
  ArrowUpIcon,
  Trash2Icon,
  PlayCircleIcon
} from 'lucide-vue-next';
import ExampleCard from './components/ExampleCard.vue';
import QuestionsCard from './components/QuestionsCard.vue';
import {
  getHistoryList,
  getChatDetail,
  createChatWindow,
  sendChatMessageStream,
  deleteChatWindow,
  getCourseList,
} from './api.js';
import { getStoredUserId } from '../../../shared/auth/session.js';
import { ROUTES, getMenuRouteByUserType } from '../../../shared/constants/routes.js';
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys.js';

const props = defineProps({
  userType: {
    type: String,
    default: 'student',
  },
});

// 鐘舵€佸畾涔?
const historyList = ref([]);
const messages = ref([]);
const currentSessionId = ref(null);
const currentSessionTitle = ref('');
const inputContent = ref('');
const isLoading = ref(false);
const hasMoreHistory = ref(false);
const userId = ref(""); // 绉婚櫎妯℃嫙 ID锛屼娇鐢ㄧ湡瀹?token 璁よ瘉
const courseOptions = ref([]);
const selectedCourse = ref('');
const selectedCourseStorageKey = STORAGE_KEYS.SELECTED_COURSE;

// 瑙ｅ喅 UI 闂儊闂锛氭坊鍔犱竴涓爣璁帮紝鎸囩ず鏄惁姝ｅ湪鍒囨崲浼氳瘽
const isSwitchingSession = ref(false);

const activeModalPayload = ref(null);
const activeModalType = ref('');

const openFeatureCard = (card) => {
  if (!card || !card.payload) return;
  activeModalPayload.value = card.payload;
  activeModalType.value = card.type || 'example_card';
};

const closeFeatureCard = () => {
  activeModalPayload.value = null;
  activeModalType.value = '';
};

const refreshFeatureCards = async (sessionId) => {
  if (!sessionId) return;
  try {
    const res = await getChatDetail({ session_id: sessionId });
    if (res.code === 200 && Array.isArray(res.data?.featureCards)) {
      featureCards.value = res.data.featureCards;
    }
  } catch (error) {
    console.error('Failed to refresh feature cards:', error);
  }
};

const messageContainerRef = ref(null);
const inputRef = ref(null);
const currentStreamingAiMessage = ref(null);
const featureCards = ref([]);
const markdownParser = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});
markdownParser.use(markdownItKatex);

// 返回学生端/教师端菜单页
const goBackToMenu = () => {
  const targetRoute = getMenuRouteByUserType(props.userType);
  window.location.href = targetRoute || ROUTES.STUDENT_MENU;
};

const changeTipTitle = (msg) => {
  if (!currentStreamingAiMessage.value) return;
  currentStreamingAiMessage.value.tipTitle = (msg || '').trim();
};

const renderMarkdown = (content) => {
  const rawHtml = markdownParser.render(content || '');
  return DOMPurify.sanitize(rawHtml);
};

// 鑷姩婊氬姩鍒板簳閮?
const scrollToBottom = async () => {
  await nextTick();
  if (messageContainerRef.value) {
    messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
  }
};

// 鐩戝惉杈撳叆鍐呭锛岃嚜鍔ㄨ皟鏁?Textarea 楂樺害
watch(inputContent, async () => {
  await nextTick();
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'; // Reset height
    inputRef.value.style.height = `${Math.min(inputRef.value.scrollHeight, 192)}px`; // Max height 12rem (48 * 4)
  }
});

watch(selectedCourse, (course) => {
  if (course) {
    localStorage.setItem(selectedCourseStorageKey, course);
    return;
  }
  localStorage.removeItem(selectedCourseStorageKey);
});

// 鍒濆鍖?
onMounted(async () => {
  userId.value = getStoredUserId() || '';
  await loadCourseOptions();
  await loadHistory();
});

const loadCourseOptions = async () => {
  try {
    const res = await getCourseList();
    if (res.code === 200) {
      courseOptions.value = Array.isArray(res.data) ? res.data : [];
      if (courseOptions.value.length === 0) {
        selectedCourse.value = '';
        return;
      }
      const storedSelectedCourse = localStorage.getItem(selectedCourseStorageKey);
      if (storedSelectedCourse && courseOptions.value.includes(storedSelectedCourse)) {
        selectedCourse.value = storedSelectedCourse;
        return;
      }
      selectedCourse.value = courseOptions.value[0];
    }
  } catch (error) {
    console.error('Failed to load course list:', error);
    courseOptions.value = [];
    selectedCourse.value = '';
  }
};

// 鍔犺浇鍘嗗彶璁板綍
const loadHistory = async () => {
  try {
    const res = await getHistoryList();
    if (res.code === 200) {
      historyList.value = res.data.history_list;
      hasMoreHistory.value = res.data.has_more;
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
};

// 鍔犺浇鏇村鍘嗗彶 (Mock)
const loadMoreHistory = () => {
  console.log('Load more history...');
};

// 鍔犺浇浼氳瘽璇︽儏
const loadSession = async (sessionId) => {
  if (currentSessionId.value === sessionId) return;
  
  isSwitchingSession.value = true; // 寮€濮嬪垏鎹?
  currentSessionId.value = sessionId;
  const session = historyList.value.find(h => h.session_id === sessionId);
  currentSessionTitle.value = session ? session.title : '';
  
  isLoading.value = true;
  messages.value = []; // 娓呯┖褰撳墠娑堟伅
  featureCards.value = []; // 切换对话时清空功能卡片
  closeFeatureCard();
  
  try {
    const res = await getChatDetail({ session_id: sessionId });
    if (res.code === 200) {
      messages.value = res.data.messages;
      featureCards.value = Array.isArray(res.data.featureCards) ? res.data.featureCards : [];
      scrollToBottom();
    }
  } catch (error) {
    console.error('Failed to load chat detail:', error);
    messages.value = []; // 鍑洪敊鏃舵墠娓呯┖
  } finally {
    isLoading.value = false;
    isSwitchingSession.value = false; // 缁撴潫鍒囨崲
  }
};

// 鏂板缓瀵硅瘽
const startNewChat = async () => {
  try {
    const res = await createChatWindow();
    if (res.status === 'success') {
      const newWindowId = res.data.windowID;
      await loadHistory();
      await loadSession(newWindowId);
      nextTick(() => inputRef.value?.focus());
      return;
    }

    throw new Error(res.msg || '创建会话失败');
  } catch (error) {
    console.error('Create chat failed', error);
    alert(`创建学习对话失败: ${error.message}\n请检查是否已经登录，以及后端服务是否可用。`);
  }
};

const removeSession = async (item) => {
  if (!item?.session_id) return;

  if (!confirm(`确定删除对话“${item.title}”吗？`)) return;

  try {
    const res = await deleteChatWindow({
      session_id: item.session_id,
    });

    if (res.status !== 'success') {
      throw new Error(res.msg || '删除失败');
    }

    const isCurrent = currentSessionId.value === item.session_id;
    await loadHistory();

    if (isCurrent) {
      currentSessionId.value = null;
      currentSessionTitle.value = '';
      messages.value = [];
    }
  } catch (error) {
    console.error('Delete session failed:', error);
    alert(`删除对话失败: ${error.message}`);
  }
};

const clearContext = () => {
  if (confirm('确定要清空当前对话上下文吗？')) {
    messages.value = [];
  }
};

const handleEnter = (e) => {
  if (!e.shiftKey) {
    sendMessage(); 
  }
};

// 鍙戦€佹秷鎭?
const sendMessage = async () => {
  const content = inputContent.value.trim();
  if (!content || isLoading.value) return;

  // 濡傛灉娌℃湁褰撳墠浼氳瘽 ID锛屽厛鍒涘缓
  if (!currentSessionId.value) {
     try {
        const res = await createChatWindow();
        if (res.status === 'success') {
          currentSessionId.value = res.data.windowID;
          await loadHistory(); // 鍒锋柊鍒楄〃
        } else {
          throw new Error('Create window failed');
        }
     } catch (e) {
        console.error('Auto create chat failed', e);
        alert(`无法创建新会话: ${e.message}\n请检查后端服务是否已启动，或确认当前登录状态。`);
        return;
     }
  }

  // 1. 鐢ㄦ埛娑堟伅涓婂睆
  const userMsg = {
    role: 'user',
    type: 'text',
    content: content,
    created_at: new Date().toISOString()
  };
  messages.value.push(userMsg);
  
  // 2. 棰勭暀绌虹殑 AI 娑堟伅涓婂睆
  const aiMsg = reactive({
    role: 'assistant',
    type: 'text',
    content: '', // 鍒濆涓虹┖
    reasoningContent: '',
    tipTitle: '正在思考',
    component_type: null,
    payload: null,
    created_at: new Date().toISOString()
  });
  messages.value.push(aiMsg);
  currentStreamingAiMessage.value = aiMsg;
  changeTipTitle('正在思考');

  inputContent.value = '';
  inputRef.value.style.height = 'auto'; // Reset height
  scrollToBottom();

  isLoading.value = true;

  try {
    // 3. 璋冪敤娴佸紡鎺ュ彛
    await sendChatMessageStream({
      session_id: currentSessionId.value, 
      content: content,
      course: selectedCourse.value
    }, (event) => {
      if (!event) return;
      
      if (event.type === 'text') {
        aiMsg.content += event.content || '';
      } else if (event.type === 'json') {
        if (event.result) {
          aiMsg.component_type = event.result.type || event.result.ui_type || null;
          aiMsg.payload = event.result.content || event.result.payload || null;
          
          if (event.result.type === 'questions' && Array.isArray(event.result.content)) {
             featureCards.value.push({
               id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
               title: event.result.card_title || '习题推荐',
               summary: event.result.userBrief || '点击开始作答',
               type: 'questions',
               payload: {
                 title: event.result.card_title || '习题推荐',
                 questions: event.result.content
               }
             });
          } else if (event.result.ui_type === 'example_card' && event.result.payload) {
             aiMsg.content += event.result.payload.brief_text || '为你准备了一道例题，请在右侧查看。';
             featureCards.value.push({
               id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
               title: event.result.payload.cards?.[0]?.title || '例题',
               summary: event.result.payload.topic || '点击查看例题详情',
               type: 'example_card',
               payload: event.result.payload
             });
          }
        }
      } else if (event.type === 'error') {
        aiMsg.content += `\n${event.content || event.data || '[系统异常]'}`;
        aiMsg.error = true;
      } else if (event.type === 'done') {
        changeTipTitle('');
      } else if (event.type === 'reasoning') {
        aiMsg.reasoningContent += event.data || '';
      } else if (event.type === 'tip') {
        changeTipTitle(event.data);
      } else if (event.type === 'content') {
        // Fallback or unparsed string content
        aiMsg.content += event.content || event.data || '';
      }
      scrollToBottom();
    });
    
  } catch (error) {
    console.error('Failed to send message:', error);
    aiMsg.content += '\n[发送失败，请重试]';
    aiMsg.error = true;
  } finally {
    changeTipTitle('');
    currentStreamingAiMessage.value = null;
    isLoading.value = false;
    await refreshFeatureCards(currentSessionId.value);
  }
};
</script>

<style scoped>
/* 鑷畾涔夋粴鍔ㄦ潯鏍峰紡 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}

/* 鍔ㄧ敾锛氬悜涓婃贰鍏?*/
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out;
}

:deep(.markdown-body) {
  line-height: 1.7;
}

:deep(.markdown-body p) {
  margin: 0.4rem 0;
}

:deep(.markdown-body pre) {
  margin: 0.5rem 0;
  overflow-x: auto;
  border-radius: 0.5rem;
  background: #111827;
  padding: 0.75rem;
  color: #f9fafb;
}

:deep(.markdown-body code) {
  border-radius: 0.25rem;
  background: rgba(17, 24, 39, 0.08);
  padding: 0.1rem 0.35rem;
  font-size: 0.85em;
}

:deep(.markdown-body pre code) {
  background: transparent;
  padding: 0;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  margin: 0.35rem 0 0.35rem 1.2rem;
}

:deep(.markdown-body blockquote) {
  margin: 0.45rem 0;
  border-left: 3px solid #d1d5db;
  padding-left: 0.7rem;
  color: #4b5563;
}

:deep(.markdown-body table) {
  margin: 0.45rem 0;
  width: 100%;
  border-collapse: collapse;
}

:deep(.markdown-body th),
:deep(.markdown-body td) {
  border: 1px solid #e5e7eb;
  padding: 0.35rem 0.45rem;
}

:deep(.markdown-body .katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.4rem 0;
}
</style>




