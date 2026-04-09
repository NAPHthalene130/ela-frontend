<template>
  <div class="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
    <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-6 py-4">
      <div>
        <h3 class="text-lg font-bold text-gray-800">{{ title }}</h3>
        <p class="text-xs text-gray-500">共 {{ questions.length }} 题，选择后显示答案与解析</p>
      </div>
      <button @click="$emit('close')" class="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600">
        <XIcon class="h-5 w-5" />
      </button>
    </div>

    <div class="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-6">
      <article
        v-for="(question, index) in questions"
        :key="question.id || index"
        class="rounded-xl border border-gray-200 bg-white p-4"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">第 {{ index + 1 }} 题</span>
          <span class="text-xs text-gray-400">ID {{ question.id || '-' }}</span>
        </div>
        <p class="mb-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-gray-800">{{ question.content }}</p>

        <div class="space-y-2">
          <button
            v-for="opt in getOptions(question)"
            :key="opt.key"
            @click="selectOption(index, opt.key)"
            :class="getOptionClass(index, opt.key, question.answer)"
            class="flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors"
          >
            <span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-700">{{ opt.key }}</span>
            <span>{{ opt.text }}</span>
          </button>
        </div>

        <div v-if="revealMap[index]" class="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-gray-700">
          <p><span class="font-semibold">答案：</span>{{ question.answer || '-' }}</p>
          <p class="mt-1"><span class="font-semibold">简述：</span>{{ question.brief || '-' }}</p>
          <p class="mt-1 whitespace-pre-wrap"><span class="font-semibold">解析：</span>{{ question.explanation || '-' }}</p>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { XIcon } from 'lucide-vue-next';

const props = defineProps({
  payload: {
    type: Object,
    required: true
  }
});

defineEmits(['close']);

const title = computed(() => props.payload?.title || '习题推荐');
const questions = computed(() => {
  const rows = props.payload?.questions;
  return Array.isArray(rows) ? rows : [];
});

const answerMap = reactive({});
const revealMap = reactive({});

const getOptions = (question) => ([
  { key: 'A', text: question?.optionA || '' },
  { key: 'B', text: question?.optionB || '' },
  { key: 'C', text: question?.optionC || '' },
  { key: 'D', text: question?.optionD || '' },
]).filter(item => item.text);

const selectOption = (questionIndex, optionKey) => {
  answerMap[questionIndex] = optionKey;
  revealMap[questionIndex] = true;
};

const getOptionClass = (questionIndex, optionKey, correctAnswer) => {
  const selected = answerMap[questionIndex];
  const revealed = Boolean(revealMap[questionIndex]);
  if (!revealed) {
    if (selected === optionKey) {
      return 'border-blue-400 bg-blue-50 text-blue-900';
    }
    return 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50';
  }
  const normalizedCorrect = String(correctAnswer || '').trim().toUpperCase();
  const normalizedOption = String(optionKey || '').trim().toUpperCase();
  if (normalizedOption === normalizedCorrect) {
    return 'border-green-400 bg-green-50 text-green-900';
  }
  if (selected === optionKey) {
    return 'border-red-400 bg-red-50 text-red-900';
  }
  return 'border-gray-200 bg-gray-50 text-gray-500';
};
</script>

<style scoped>
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
</style>
