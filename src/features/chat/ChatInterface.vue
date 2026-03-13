<template>
  <div class="flex h-screen w-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
    <!-- 左侧历史记录栏 (Left Sidebar) -->
    <!-- 响应式：小屏幕时自动隐藏，大屏幕占 20% 宽度 -->
    <aside 
      class="hidden md:flex flex-col w-1/5 h-full bg-gray-900 text-gray-100 border-r border-gray-800"
    >
      <!-- 顶部固定：新建对话按钮 -->
      <div class="p-4 border-b border-gray-800">
        <button 
          @click="startNewChat"
          class="flex items-center justify-start w-full px-4 py-3 gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          <PlusIcon class="w-5 h-5" />
          <span>新建学习对话</span>
        </button>
      </div>

      <!-- 中部滚动区：历史会话列表 -->
      <!-- 滚动条自动触底逻辑在 CSS 中处理或使用 simplebar -->
      <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        <div 
          v-for="item in historyList" 
          :key="item.session_id"
          @click="loadSession(item.session_id)"
          :class="[
            'group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors duration-200 text-sm truncate',
            currentSessionId === item.session_id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
          ]"
        >
          <MessageSquareIcon class="w-4 h-4 flex-shrink-0" />
          <span class="truncate flex-1">{{ item.title }}</span>
          <button
            @click.stop="removeSession(item)"
            class="hidden group-hover:flex p-1 rounded text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
            title="删除对话"
          >
            <Trash2Icon class="w-4 h-4" />
          </button>
        </div>
        
        <!-- 加载更多按钮 (Mock) -->
        <button 
          v-if="hasMoreHistory" 
          @click="loadMoreHistory"
          class="w-full text-center py-2 text-xs text-gray-500 hover:text-gray-300"
        >
          加载更多...
        </button>
      </div>

      <!-- 底部固定：用户信息 -->
      <div class="p-4 border-t border-gray-800">
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            U
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-200 truncate">{{ userId }}</p>
          </div>
          <MoreHorizontalIcon class="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </aside>

    <!-- 右侧主聊天区 (Right Main Area) -->
    <main class="flex-1 flex flex-col h-full relative bg-white">
      <!-- 顶部导航 (Header) -->
      <header class="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div class="flex items-center gap-2 min-w-0">
          <!-- 移动端侧边栏切换按钮 (Mock) -->
          <button class="md:hidden p-2 hover:bg-gray-100 rounded-md">
            <MenuIcon class="w-5 h-5 text-gray-600" />
          </button>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 whitespace-nowrap">课程选择</span>
            <select
              v-model="selectedCourse"
              class="h-8 px-2 rounded-md border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
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
          <h1 class="text-sm font-medium text-gray-700 truncate max-w-xs md:max-w-md">
            {{ currentSessionTitle || '新对话' }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
           <button 
             class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
             title="清空上下文"
             @click="clearContext"
           >
             <RotateCcwIcon class="w-4 h-4" />
           </button>
        </div>
      </header>

      <!-- 核心对话滚动区 (Message List) -->
      <div 
        ref="messageContainerRef"
        class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth"
      >
        <!-- 空状态 Welcome -->
        <div 
          v-if="messages.length === 0" 
          class="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-0 animate-fade-in-up"
          style="animation-fill-mode: forwards;"
        >
          <div class="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-2">
            <BotIcon class="w-8 h-8 text-gray-800" />
          </div>
          <h2 class="text-2xl font-semibold text-gray-800">我是你的智能学习助手</h2>
          <p class="text-gray-500">今天想复习点什么？</p>
          
          <!-- 建议卡片 (Mock) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4 mt-8">
            <button class="p-3 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <span class="block text-sm font-medium text-gray-800">解释二分查找</span>
              <span class="block text-xs text-gray-500 mt-1">算法复杂度分析</span>
            </button>
            <button class="p-3 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <span class="block text-sm font-medium text-gray-800">Vue 生命周期</span>
              <span class="block text-xs text-gray-500 mt-1">created vs mounted</span>
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="[
            'flex w-full gap-4 max-w-3xl mx-auto',
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <!-- 助手头像 -->
          <div 
            v-if="msg.role === 'assistant'"
            class="w-8 h-8 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-1"
          >
            <BotIcon class="w-5 h-5" />
          </div>

          <!-- 消息气泡 -->
          <div 
            :class="[
              'relative px-5 py-3.5 rounded-2xl text-sm leading-relaxed max-w-[85%] md:max-w-[75%] shadow-sm',
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-none'
            ]"
          >
            <div class="whitespace-pre-wrap font-sans">{{ msg.content }}</div>
          </div>

          <!-- 用户头像 -->
          <div 
            v-if="msg.role === 'user'"
            class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 shadow-sm mt-1"
          >
            <UserIcon class="w-5 h-5" />
          </div>
        </div>
        
        <!-- Loading Indicator -->
        <div v-if="isLoading" class="flex w-full gap-4 max-w-3xl mx-auto justify-start">
           <div class="w-8 h-8 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-1">
             <BotIcon class="w-5 h-5" />
           </div>
           <div class="bg-gray-50 px-5 py-4 rounded-2xl rounded-bl-none border border-gray-100">
             <div class="flex space-x-1">
               <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
               <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
               <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
             </div>
           </div>
        </div>
        
        <!-- 底部占位，防止内容被输入框遮挡 -->
        <div class="h-24"></div>
      </div>

      <!-- 底部悬浮输入区 (Input Area) -->
      <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
        <div class="max-w-3xl mx-auto relative">
          <div class="relative flex items-end gap-2 bg-white border border-gray-200 shadow-lg rounded-2xl p-2 focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-200 transition-all">
            <!-- 附件按钮 -->
            <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors mb-0.5">
              <PaperclipIcon class="w-5 h-5" />
            </button>
            
            <!-- 多行输入框 -->
            <!-- 使用 textarea 实现自动高度，通过 CSS 或 JS 调整 height -->
            <textarea
              ref="inputRef"
              v-model="inputContent"
              @keydown.enter.prevent="handleEnter"
              placeholder="输入你的问题..."
              rows="1"
              class="flex-1 max-h-48 py-3 px-2 bg-transparent border-none focus:ring-0 resize-none text-sm text-gray-800 placeholder-gray-400 custom-scrollbar leading-normal"
              style="min-height: 44px;"
            ></textarea>

            <!-- 发送按钮 -->
            <button 
              @click="sendMessage"
              :disabled="!inputContent.trim() || isLoading"
              :class="[
                'p-2 rounded-xl transition-all duration-200 mb-0.5',
                inputContent.trim() && !isLoading 
                  ? 'bg-black text-white hover:bg-gray-800 shadow-md' 
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              ]"
            >
              <ArrowUpIcon class="w-5 h-5" />
            </button>
          </div>
          
          <!-- 底部免责声明 -->
          <div class="text-center mt-2">
            <p class="text-[10px] text-gray-400">
              AI 助手可能会生成不准确的信息，请核实。
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import {
  PlusIcon, 
  MessageSquareIcon, 
  MoreHorizontalIcon, 
  MenuIcon, 
  RotateCcwIcon, 
  BotIcon, 
  UserIcon, 
  PaperclipIcon, 
  ArrowUpIcon,
  Trash2Icon
} from 'lucide-vue-next';
import {
  getHistoryList,
  getChatDetail,
  createChatWindow,
  sendChatMessageStream,
  deleteChatWindow,
  getCourseList,
} from './api.js';
import { STORAGE_KEYS } from '../../shared/constants/storageKeys.js';

// 状态定义
const historyList = ref([]);
const messages = ref([]);
const currentSessionId = ref(null);
const currentSessionTitle = ref('');
const inputContent = ref('');
const isLoading = ref(false);
const hasMoreHistory = ref(false);
const userId = ref(""); // 移除模拟 ID，使用真实 token 认证
const courseOptions = ref([]);
const selectedCourse = ref('');
const selectedCourseStorageKey = STORAGE_KEYS.SELECTED_COURSE;

// 解决 UI 闪烁问题：添加一个标记，指示是否正在切换会话
const isSwitchingSession = ref(false);

const messageContainerRef = ref(null);
const inputRef = ref(null);

// 自动滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (messageContainerRef.value) {
    messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
  }
};

// 监听输入内容，自动调整 Textarea 高度
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

// 初始化
onMounted(async () => {
  // 从 localStorage 获取用户信息 (可选，后端主要依赖 token)
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      userId.value = parsed.id;
    } catch (e) {
      console.error('Parse user failed', e);
    }
  }
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

// 加载历史记录
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

// 加载更多历史 (Mock)
const loadMoreHistory = () => {
  console.log('Load more history...');
};

// 加载会话详情
const loadSession = async (sessionId) => {
  if (currentSessionId.value === sessionId) return;
  
  isSwitchingSession.value = true; // 开始切换
  currentSessionId.value = sessionId;
  const session = historyList.value.find(h => h.session_id === sessionId);
  currentSessionTitle.value = session ? session.title : '';
  
  isLoading.value = true;
  messages.value = []; // 清空当前消息
  
  try {
    const res = await getChatDetail({ session_id: sessionId });
    if (res.code === 200) {
      messages.value = res.data.messages;
      scrollToBottom();
    }
  } catch (error) {
    console.error('Failed to load chat detail:', error);
    messages.value = []; // 出错时才清空
  } finally {
    isLoading.value = false;
    isSwitchingSession.value = false; // 结束切换
  }
};

// 新建对话
const startNewChat = async () => {
  // 调用后端创建新对话
  try {
    const res = await createChatWindow();
    if (res.status === 'success') {
      const newWindowId = res.data.windowID;
      await loadHistory(); // 刷新列表
      await loadSession(newWindowId); // 切换到新对话
      
      // Focus input
      nextTick(() => inputRef.value?.focus());
      return;
    }
    throw new Error(res.msg || '创建会话失败');
  } catch (e) {
    console.error('Create chat failed', e);
    alert(`创建学习对话失败: ${e.message}\n请检查是否已登录以及后端服务是否可用。`);
  }
};

const removeSession = async (item) => {
  if (!item?.session_id) return;
  if (!userId.value) {
    alert('用户信息缺失，请重新登录后重试。');
    return;
  }
  if (!confirm(`确定删除对话「${item.title}」吗？`)) return;

  try {
    const res = await deleteChatWindow({
      user_id: userId.value,
      session_id: item.session_id
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

// 清空上下文
const clearContext = () => {
  if (confirm('确定要清空当前对话上下文吗？')) {
    messages.value = [];
  }
};

// 处理回车发送
const handleEnter = (e) => {
  if (!e.shiftKey) {
    sendMessage(); 
  }
};

// 发送消息
const sendMessage = async () => {
  const content = inputContent.value.trim();
  if (!content || isLoading.value) return;

  // 如果没有当前会话 ID，先创建
  if (!currentSessionId.value) {
     try {
        const res = await createChatWindow();
        if (res.status === 'success') {
          currentSessionId.value = res.data.windowID;
          await loadHistory(); // 刷新列表
        } else {
          throw new Error('Create window failed');
        }
     } catch (e) {
        console.error('Auto create chat failed', e);
        alert(`无法创建新会话: ${e.message}\n请检查后端服务是否启动，或是否已登录。`);
        return;
     }
  }

  // 1. 用户消息上屏
  const userMsg = {
    role: 'user',
    type: 'text',
    content: content,
    created_at: new Date().toISOString()
  };
  messages.value.push(userMsg);
  
  // 2. 预留空的 AI 消息上屏
  const aiMsg = reactive({
    role: 'assistant',
    type: 'text',
    content: '', // 初始为空
    created_at: new Date().toISOString()
  });
  messages.value.push(aiMsg);

  inputContent.value = '';
  inputRef.value.style.height = 'auto'; // Reset height
  scrollToBottom();

  isLoading.value = true;

  try {
    // 3. 调用流式接口
    await sendChatMessageStream({
      user_id: userId.value,
      session_id: currentSessionId.value, 
      content: content,
      course: selectedCourse.value
    }, (chunk) => {
      // 4. 回调更新 AI 消息内容
      aiMsg.content += chunk;
      scrollToBottom();
    });
    
  } catch (error) {
    console.error('Failed to send message:', error);
    aiMsg.content += '\n[发送失败，请重试]';
    aiMsg.error = true;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* 自定义滚动条样式 */
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

/* 动画：向上淡入 */
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
</style>
