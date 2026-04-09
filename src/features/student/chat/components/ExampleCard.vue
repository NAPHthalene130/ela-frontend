<template>
  <div class="flex flex-col h-full bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl mx-auto border border-gray-100">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
      <div class="flex flex-col gap-1">
        <span class="text-xs font-semibold tracking-wider text-blue-600 uppercase">{{ course }}</span>
        <h3 class="text-lg font-bold text-gray-800">{{ cardData.title }}</h3>
      </div>
      <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
        <XIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
      <!-- Stem -->
      <div class="text-base text-gray-800 leading-relaxed font-medium">
        {{ cardData.stem }}
      </div>

      <!-- Options -->
      <div class="space-y-3">
        <button
          v-for="opt in cardData.options"
          :key="opt.key"
          @click="selectOption(opt.key)"
          :disabled="isSubmitted"
          :class="[
            'w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200',
            getOptionClass(opt.key)
          ]"
        >
          <span :class="['flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold shadow-sm', getOptionBadgeClass(opt.key)]">
            {{ opt.key }}
          </span>
          <span class="text-[15px] leading-relaxed mt-0.5">{{ opt.text }}</span>
        </button>
      </div>

      <!-- Explanation -->
      <div v-if="isSubmitted" class="animate-fade-in-up mt-6 bg-blue-50/50 rounded-xl p-5 border border-blue-100">
        <h4 class="flex items-center gap-2 text-sm font-bold text-blue-800 mb-2">
          <InfoIcon class="w-4 h-4" />
          解析
        </h4>
        <div class="text-sm text-gray-700 leading-relaxed">
          {{ cardData.explanation }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
      <button
        v-if="!isSubmitted"
        @click="submitAnswer"
        :disabled="!selectedOption"
        :class="[
          'px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200',
          selectedOption
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        ]"
      >
        确定 / 提交
      </button>
      <button
        v-else
        @click="$emit('close')"
        class="px-6 py-2.5 rounded-lg font-medium text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
      >
        收起
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { XIcon, InfoIcon } from 'lucide-vue-next';

const props = defineProps({
  payload: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const course = computed(() => props.payload?.course || '通用课程');
const cardData = computed(() => {
  return props.payload?.cards?.[0] || {};
});

const selectedOption = ref(null);
const isSubmitted = ref(false);

const selectOption = (key) => {
  if (isSubmitted.value) return;
  selectedOption.value = key;
};

const submitAnswer = () => {
  if (!selectedOption.value) return;
  isSubmitted.value = true;
};

const getOptionClass = (key) => {
  if (!isSubmitted.value) {
    if (selectedOption.value === key) {
      return 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm';
    }
    return 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700 bg-white';
  }

  // Submitted state
  const isCorrectAnswer = key === cardData.value.answer;
  const isSelected = key === selectedOption.value;

  if (isCorrectAnswer) {
    return 'border-green-500 bg-green-50 text-green-900 shadow-sm';
  }
  if (isSelected && !isCorrectAnswer) {
    return 'border-red-500 bg-red-50 text-red-900 shadow-sm';
  }
  return 'border-gray-200 opacity-60 text-gray-500 bg-gray-50/50';
};

const getOptionBadgeClass = (key) => {
  if (!isSubmitted.value) {
    if (selectedOption.value === key) {
      return 'bg-blue-600 text-white';
    }
    return 'bg-gray-100 text-gray-600 border border-gray-200';
  }

  const isCorrectAnswer = key === cardData.value.answer;
  const isSelected = key === selectedOption.value;

  if (isCorrectAnswer) {
    return 'bg-green-500 text-white';
  }
  if (isSelected && !isCorrectAnswer) {
    return 'bg-red-500 text-white';
  }
  return 'bg-gray-100 text-gray-400 border border-gray-200';
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
  animation: fade-in-up 0.4s ease-out forwards;
}
</style>
