<template>
  <div class="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 font-sans text-gray-900">
    <div
      v-if="floatingNotice.visible"
      class="fixed right-5 top-5 z-[70] w-[min(90vw,360px)] rounded-xl border bg-white/95 p-4 shadow-2xl backdrop-blur"
      :class="floatingNotice.type === 'error' ? 'border-rose-200' : floatingNotice.type === 'success' ? 'border-emerald-200' : 'border-indigo-200'"
    >
      <p class="text-sm leading-relaxed text-gray-700">{{ floatingNotice.message }}</p>
      <div v-if="floatingNotice.mode === 'confirm'" class="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          @click="cancelFloatingNotice"
        >
          取消
        </button>
        <button
          type="button"
          class="rounded-md bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700"
          @click="confirmFloatingNotice"
        >
          确认
        </button>
      </div>
    </div>

    <aside class="hidden h-full w-1/5 flex-col border-r border-gray-200 bg-slate-900 text-gray-100 shadow-2xl md:flex">
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
            'group flex cursor-pointer items-center gap-3 truncate rounded-xl px-3 py-3 text-sm transition-all duration-200',
            currentSessionId === item.session_id
              ? 'bg-indigo-600/20 text-white ring-1 ring-indigo-400/30'
              : 'text-gray-400 hover:bg-slate-800 hover:text-gray-100'
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
            {{ userInitial }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-gray-200">{{ userId || '未登录用户' }}</p>
          </div>
        </div>
      </div>
    </aside>

    <main class="relative flex h-full flex-1 flex-col bg-white/70 backdrop-blur-sm">
      <header class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/85 px-4 py-3 backdrop-blur-md">
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
        class="scroll-smooth flex-1 space-y-6 overflow-y-auto bg-gradient-to-b from-transparent to-white/40 p-4 md:p-6"
      >
        <div
          v-if="messages.length === 0"
          class="animate-fade-in-up flex h-full flex-col items-center justify-center space-y-6 text-center opacity-0"
          style="animation-fill-mode: forwards;"
        >
          <div class="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
            <BotIcon class="h-8 w-8 text-gray-800" />
          </div>
          <h2 class="text-2xl font-semibold text-gray-800">你好！{{ userId || '同学' }}</h2>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="[
            'mx-auto flex w-full max-w-4xl gap-4',
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
              'relative max-w-[86%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm md:max-w-[76%]',
              msg.role === 'user'
                ? 'rounded-br-none bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-indigo-200'
                : 'rounded-bl-none border border-white/80 bg-white text-gray-800 shadow-gray-200'
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
            class="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white shadow-sm"
          >
            {{ userInitial }}
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

      <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-6 pt-10">
        <div class="relative mx-auto max-w-4xl">
          <div class="relative flex items-end gap-2 rounded-2xl border border-gray-200/80 bg-white/95 p-2 shadow-xl transition-all focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-200">
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
                {{ getCardBadgeText(card.type) }}
              </span>
              <PlayCircleIcon class="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 class="line-clamp-1 text-sm font-semibold text-gray-800">{{ card.title }}</h3>
            <p class="mt-1 line-clamp-2 text-xs text-gray-500 leading-relaxed">{{ card.summary }}</p>
          </article>
        </div>
      </div>
    </aside>

    <div v-if="activeModalPayload && activeModalType !== 'graph'" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300">
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
        <div v-else-if="activeModalType === 'analysis'" class="flex w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 px-5 py-4">
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold text-gray-800">{{ activeModalPayload.title || '学情回顾' }}</h3>
              <p class="truncate text-xs text-gray-500">{{ activeModalPayload.summary || '基于近期作答记录的学习分析' }}</p>
            </div>
            <button
              @click="closeFeatureCard"
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              关闭
            </button>
          </div>
          <div class="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div class="rounded-xl border border-gray-100 bg-gradient-to-br from-blue-50 to-white p-3">
                <p class="text-[11px] font-semibold tracking-wider text-gray-400">作答总数</p>
                <p class="mt-1 text-2xl font-bold text-gray-800">{{ analysisOverview.total }}</p>
              </div>
              <div class="rounded-xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-white p-3">
                <p class="text-[11px] font-semibold tracking-wider text-gray-400">正确数</p>
                <p class="mt-1 text-2xl font-bold text-emerald-600">{{ analysisOverview.correct }}</p>
              </div>
              <div class="rounded-xl border border-gray-100 bg-gradient-to-br from-rose-50 to-white p-3">
                <p class="text-[11px] font-semibold tracking-wider text-gray-400">错误数</p>
                <p class="mt-1 text-2xl font-bold text-rose-500">{{ analysisOverview.wrong }}</p>
              </div>
              <div class="rounded-xl border border-gray-100 bg-gradient-to-br from-violet-50 to-white p-3">
                <p class="text-[11px] font-semibold tracking-wider text-gray-400">正确率</p>
                <p class="mt-1 text-2xl font-bold text-violet-600">{{ analysisAccuracyText }}</p>
              </div>
            </div>
            <div class="rounded-xl border border-gray-100 bg-white p-4">
              <div class="mb-2 flex items-center justify-between">
                <p class="text-xs font-semibold text-gray-700">近期正确率趋势</p>
                <p class="text-[11px] text-gray-400">{{ analysisTrend.length }} 天</p>
              </div>
              <div class="h-36 rounded-lg border border-gray-100 bg-gray-50 p-2">
                <svg viewBox="0 0 680 140" class="h-full w-full" preserveAspectRatio="none">
                  <polyline
                    :points="analysisTrendLinePoints"
                    fill="none"
                    stroke="#4f46e5"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle
                    v-for="(point, idx) in analysisTrendPoints"
                    :key="`trend-point-${idx}`"
                    :cx="point.x"
                    :cy="point.y"
                    r="3.5"
                    fill="#4f46e5"
                  />
                </svg>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div class="rounded-xl border border-rose-100 bg-rose-50/30 p-4">
                <p class="text-xs font-semibold text-rose-700">弱势项</p>
                <div class="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  <div v-for="(item, idx) in analysisWeakStats" :key="`weak-${idx}`" class="rounded-lg bg-white p-3">
                    <p class="text-sm leading-relaxed text-gray-700 break-words">{{ item.brief }}</p>
                    <p class="mt-1 text-xs text-gray-500">作答 {{ item.attempts }} 次，正确 {{ item.correct }} 次</p>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                <p class="text-xs font-semibold text-emerald-700">强势项</p>
                <div class="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  <div v-for="(item, idx) in analysisStrongStats" :key="`strong-${idx}`" class="rounded-lg bg-white p-3">
                    <p class="text-sm leading-relaxed text-gray-700 break-words">{{ item.brief }}</p>
                    <p class="mt-1 text-xs text-gray-500">作答 {{ item.attempts }} 次，正确 {{ item.correct }} 次</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div class="rounded-xl border border-gray-100 bg-white p-4">
                <p class="text-xs font-semibold text-gray-700">弱势诊断</p>
                <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-gray-600">
                  <li v-for="(item, idx) in analysisInsights.weak_items" :key="`weak-insight-${idx}`">{{ item }}</li>
                </ul>
              </div>
              <div class="rounded-xl border border-gray-100 bg-white p-4">
                <p class="text-xs font-semibold text-gray-700">强势表现</p>
                <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-gray-600">
                  <li v-for="(item, idx) in analysisInsights.strong_items" :key="`strong-insight-${idx}`">{{ item }}</li>
                </ul>
              </div>
              <div class="rounded-xl border border-gray-100 bg-white p-4">
                <p class="text-xs font-semibold text-gray-700">学习建议</p>
                <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-gray-600">
                  <li v-for="(item, idx) in analysisInsights.learning_suggestions" :key="`suggestion-${idx}`">{{ item }}</li>
                </ul>
              </div>
            </div>
            <div class="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm leading-relaxed text-gray-700">
              {{ analysisInsights.overall_summary || '继续保持每日小步快跑的练习节奏，学情分析会随作答数据持续更新。' }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="activeModalPayload && activeModalType === 'graph'"
      class="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-[1px]"
      @click.self="closeFeatureCard"
    >
      <div
        class="absolute rounded-2xl border border-gray-200 bg-white shadow-2xl"
        :style="graphModalStyle"
      >
        <div
          class="flex cursor-move items-center justify-between rounded-t-2xl border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3"
          @mousedown="startGraphDrag"
        >
          <div class="min-w-0">
            <h3 class="truncate text-sm font-semibold text-gray-800">{{ activeModalPayload.title || '知识图谱' }}</h3>
            <p class="truncate text-xs text-gray-500">{{ activeModalPayload.summary || '拖拽窗口可移动，点击关系可快速浏览。' }}</p>
          </div>
          <button
            @click="closeFeatureCard"
            class="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            关闭
          </button>
        </div>
        <div class="grid grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-12" :style="graphBodyStyle">
          <div class="lg:col-span-4">
            <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p class="text-[11px] font-semibold tracking-wider text-gray-400">中心节点</p>
              <p class="mt-1 break-all text-sm font-semibold text-gray-800">{{ activeModalPayload.focusNode || '未识别' }}</p>
              <p class="mt-3 text-[11px] font-semibold tracking-wider text-gray-400">检索问题</p>
              <p class="mt-1 break-all text-xs text-gray-600">{{ activeModalPayload.queryText || '无' }}</p>
            </div>
            <div class="mt-3 rounded-xl border border-gray-100 bg-white p-3">
              <p class="text-[11px] font-semibold tracking-wider text-gray-400">节点总览</p>
              <div class="custom-scrollbar mt-2 flex max-h-48 flex-wrap gap-2 overflow-auto">
                <span
                  v-for="node in graphNodeList"
                  :key="node"
                  class="rounded-full border px-2.5 py-1 text-[11px] text-gray-700"
                >
                  {{ node }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex min-h-0 flex-col lg:col-span-8">
            <div class="mb-2 flex items-center justify-between">
              <p class="text-[11px] font-semibold tracking-wider text-gray-400">知识图谱</p>
              <p class="text-xs text-gray-500">{{ graphEdges.length }} 条关系，{{ graphLayout.nodes.length }} 个节点</p>
            </div>
            <div
              class="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-slate-50 via-white to-blue-50"
              @wheel.prevent="handleGraphWheel"
              @mousedown="startGraphViewDrag"
            >
              <div class="absolute left-3 top-3 z-10 rounded-md border border-gray-200 bg-white/90 px-2 py-1 text-[11px] text-gray-500">
                滚轮缩放 · 拖动画布
              </div>
              <div
                class="h-full w-full transition-transform duration-75"
                :style="graphCanvasStyle"
              >
                <svg
                  viewBox="0 0 900 520"
                  class="h-full w-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <marker
                      id="graph-arrow"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="5"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  <g v-for="(edge, idx) in graphLayout.edges" :key="`edge-${idx}`">
                    <line
                      :x1="edge.x1"
                      :y1="edge.y1"
                      :x2="edge.x2"
                      :y2="edge.y2"
                      stroke="#94a3b8"
                      stroke-width="1.4"
                      stroke-opacity="0.85"
                      marker-end="url(#graph-arrow)"
                    />
                    <rect
                      :x="(edge.x1 + edge.x2) / 2 - 28"
                      :y="(edge.y1 + edge.y2) / 2 - 9"
                      width="56"
                      height="16"
                      rx="6"
                      fill="white"
                      fill-opacity="0.92"
                    />
                    <text
                      :x="(edge.x1 + edge.x2) / 2"
                      :y="(edge.y1 + edge.y2) / 2 + 3"
                      text-anchor="middle"
                      font-size="10"
                      fill="#475569"
                    >
                      {{ edge.relation }}
                    </text>
                  </g>

                  <g v-for="node in graphLayout.nodes" :key="`node-${node.id}`">
                    <circle
                      :cx="node.x"
                      :cy="node.y"
                      :r="node.isFocus ? node.radius + 3 : node.radius"
                      :fill="node.isFocus ? '#2563eb' : '#4f46e5'"
                      :fill-opacity="node.isFocus ? 0.92 : 0.82"
                      stroke="white"
                      stroke-width="2.5"
                    />
                    <text
                      :x="node.x"
                      :y="node.y + 4"
                      text-anchor="middle"
                      font-size="11"
                      fill="white"
                    >
                      {{ node.shortLabel }}
                    </text>
                    <title>{{ node.id }}</title>
                  </g>
                </svg>
              </div>
              <div v-if="graphEdges.length === 0" class="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                未检索到可展示的关系数据
              </div>
            </div>
          </div>
        </div>
        <div
          class="absolute bottom-1.5 right-1.5 h-4 w-4 cursor-se-resize rounded-sm border border-gray-300 bg-white/90"
          @mousedown.stop="startGraphResize"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import 'katex/dist/katex.min.css';
import {
  PlusIcon, 
  MessageSquareIcon, 
  ArrowLeftIcon,
  MenuIcon, 
  RotateCcwIcon, 
  BotIcon, 
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
const floatingNotice = reactive({
  visible: false,
  message: '',
  type: 'info',
  mode: 'toast',
  onConfirm: null,
  timer: null,
});

const userInitial = computed(() => {
  const normalized = (userId.value || '').toString().trim();
  if (!normalized) return 'U';
  return normalized.slice(0, 1).toUpperCase();
});

const activeModalPayload = ref(null);
const activeModalType = ref('');
const graphModalPosition = reactive({ x: 0, y: 0 });
const graphDragState = reactive({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
const graphModalSize = reactive({ width: 980, height: 660 });
const graphResizeState = reactive({ active: false, startX: 0, startY: 0, baseWidth: 0, baseHeight: 0 });
const graphViewState = reactive({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0, offsetX: 0, offsetY: 0, scale: 1 });

const analysisContent = computed(() => {
  if (!activeModalPayload.value || activeModalType.value !== 'analysis') {
    return {};
  }
  const body = activeModalPayload.value.analysis;
  return body && typeof body === 'object' ? body : {};
});

const analysisOverview = computed(() => {
  const overview = analysisContent.value.overview || {};
  return {
    total: Number(overview.total || 0),
    correct: Number(overview.correct || 0),
    wrong: Number(overview.wrong || 0),
    accuracy: Number(overview.accuracy || 0),
  };
});

const analysisAccuracyText = computed(() => `${Math.round(Math.max(0, Math.min(1, analysisOverview.value.accuracy)) * 1000) / 10}%`);

const analysisWeakStats = computed(() => {
  const rows = Array.isArray(analysisContent.value.weak_stats) ? analysisContent.value.weak_stats : [];
  return rows.slice(0, 6).map((item) => ({
    brief: (item?.brief || '未命名题目').toString(),
    attempts: Math.max(0, Number(item?.attempts || 0)),
    correct: Math.max(0, Number(item?.correct || 0)),
  }));
});

const analysisStrongStats = computed(() => {
  const rows = Array.isArray(analysisContent.value.strong_stats) ? analysisContent.value.strong_stats : [];
  return rows.slice(0, 6).map((item) => ({
    brief: (item?.brief || '未命名题目').toString(),
    attempts: Math.max(0, Number(item?.attempts || 0)),
    correct: Math.max(0, Number(item?.correct || 0)),
  }));
});

const analysisTrend = computed(() => {
  const rows = Array.isArray(analysisContent.value.trend) ? analysisContent.value.trend : [];
  return rows.slice(-14).map((item) => ({
    date: (item?.date || '').toString(),
    accuracy: Math.max(0, Math.min(1, Number(item?.accuracy || 0))),
  }));
});

const analysisTrendPoints = computed(() => {
  const rows = analysisTrend.value;
  if (!rows.length) {
    return [
      { x: 20, y: 120 },
      { x: 660, y: 120 },
    ];
  }
  if (rows.length === 1) {
    return [
      { x: 340, y: 120 - rows[0].accuracy * 100 },
    ];
  }
  return rows.map((item, index) => {
    const x = 20 + (640 * index) / (rows.length - 1);
    const y = 120 - item.accuracy * 100;
    return { x, y };
  });
});

const analysisTrendLinePoints = computed(() => analysisTrendPoints.value.map((point) => `${point.x},${point.y}`).join(' '));

const analysisInsights = computed(() => {
  const body = analysisContent.value.insights || {};
  const weakItems = Array.isArray(body.weak_items) ? body.weak_items : [];
  const strongItems = Array.isArray(body.strong_items) ? body.strong_items : [];
  const suggestions = Array.isArray(body.learning_suggestions) ? body.learning_suggestions : [];
  return {
    weak_items: weakItems.slice(0, 5),
    strong_items: strongItems.slice(0, 5),
    learning_suggestions: suggestions.slice(0, 5),
    overall_summary: (body.overall_summary || '').toString(),
  };
});

const graphEdges = computed(() => {
  if (!activeModalPayload.value || activeModalType.value !== 'graph') return [];
  const rows = Array.isArray(activeModalPayload.value.graph) ? activeModalPayload.value.graph : [];
  return rows
    .map((edge) => ({
      node1: (edge?.node1 || '').toString(),
      node2: (edge?.node2 || '').toString(),
      relation: (edge?.relation || '').toString(),
    }))
    .filter((edge) => edge.node1 && edge.node2 && edge.relation);
});

const graphNodeList = computed(() => {
  const nodeSet = new Set();
  graphEdges.value.forEach((edge) => {
    nodeSet.add(edge.node1);
    nodeSet.add(edge.node2);
  });
  return Array.from(nodeSet);
});

const graphLayout = computed(() => {
  const width = 900;
  const height = 520;
  const padding = 44;
  const centerX = width / 2;
  const centerY = height / 2;
  const nodes = [...graphNodeList.value].sort((a, b) => a.localeCompare(b));
  const focus = (activeModalPayload.value?.focusNode || '').toString();
  if (!nodes.length) {
    return { nodes: [], edges: [] };
  }
  const adjacency = new Map();
  nodes.forEach((node) => adjacency.set(node, new Set()));
  graphEdges.value.forEach((edge) => {
    if (!adjacency.has(edge.node1)) adjacency.set(edge.node1, new Set());
    if (!adjacency.has(edge.node2)) adjacency.set(edge.node2, new Set());
    adjacency.get(edge.node1).add(edge.node2);
    adjacency.get(edge.node2).add(edge.node1);
  });
  const root = adjacency.has(focus) ? focus : nodes[0];
  const levels = new Map([[root, 0]]);
  const queue = [root];
  while (queue.length) {
    const current = queue.shift();
    const currentLevel = levels.get(current) || 0;
    (adjacency.get(current) || []).forEach((nextNode) => {
      if (!levels.has(nextNode)) {
        levels.set(nextNode, currentLevel + 1);
        queue.push(nextNode);
      }
    });
  }
  let disconnectedLevel = levels.size ? (Math.max(...Array.from(levels.values())) || 0) + 1 : 1;
  nodes.forEach((node) => {
    if (!levels.has(node)) {
      levels.set(node, disconnectedLevel);
      disconnectedLevel += 1;
    }
  });
  const grouped = new Map();
  nodes.forEach((node) => {
    const level = levels.get(node) || 0;
    if (!grouped.has(level)) grouped.set(level, []);
    grouped.get(level).push(node);
  });
  const positions = new Map();
  Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([level, levelNodes]) => {
      if (level === 0) {
        positions.set(levelNodes[0], { x: centerX, y: centerY });
        return;
      }
      const radius = Math.min(70 + level * 92, 230);
      const count = levelNodes.length;
      levelNodes.forEach((node, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(1, count) - Math.PI / 2;
        positions.set(node, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      });
    });
  const nodeMeta = nodes.map((node, index) => {
    const position = positions.get(node) || {
      x: centerX + ((index % 7) - 3) * 26,
      y: centerY + (Math.floor(index / 7) - 2) * 26,
    };
    const radius = Math.max(24, Math.min(34, 18 + node.length * 1.3));
    return {
      id: node,
      x: position.x,
      y: position.y,
      r: radius,
      vx: 0,
      vy: 0,
    };
  });
  const edgePairs = graphEdges.value
    .map((edge) => {
      const sourceIndex = nodeMeta.findIndex((node) => node.id === edge.node1);
      const targetIndex = nodeMeta.findIndex((node) => node.id === edge.node2);
      if (sourceIndex < 0 || targetIndex < 0) return null;
      return { sourceIndex, targetIndex };
    })
    .filter(Boolean);
  const focusIndex = nodeMeta.findIndex((node) => node.id === root);
  const nodeCount = nodeMeta.length;
  const iterations = nodeCount > 80 ? 90 : nodeCount > 50 ? 130 : 180;
  const damping = 0.86;
  const baseRepulsion = nodeCount > 70 ? 2100 : 2800;
  const baseSpring = 0.025;
  for (let step = 0; step < iterations; step += 1) {
    for (let i = 0; i < nodeMeta.length; i += 1) {
      const a = nodeMeta[i];
      for (let j = i + 1; j < nodeMeta.length; j += 1) {
        const b = nodeMeta[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.0001) {
          dx = (i + 1) * 0.01;
          dy = (j + 1) * 0.01;
          dist = Math.hypot(dx, dy);
        }
        const minDistance = a.r + b.r + 26;
        const repulse = baseRepulsion / (dist * dist);
        const ux = dx / dist;
        const uy = dy / dist;
        a.vx -= ux * repulse;
        a.vy -= uy * repulse;
        b.vx += ux * repulse;
        b.vy += uy * repulse;
        if (dist < minDistance) {
          const push = (minDistance - dist) * 0.28;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }
    edgePairs.forEach(({ sourceIndex, targetIndex }) => {
      const source = nodeMeta[sourceIndex];
      const target = nodeMeta[targetIndex];
      let dx = target.x - source.x;
      let dy = target.y - source.y;
      let dist = Math.hypot(dx, dy);
      if (dist < 0.0001) dist = 0.0001;
      const desired = Math.max(86, source.r + target.r + 34);
      const ux = dx / dist;
      const uy = dy / dist;
      const springForce = (dist - desired) * baseSpring;
      source.vx += ux * springForce;
      source.vy += uy * springForce;
      target.vx -= ux * springForce;
      target.vy -= uy * springForce;
    });
    if (focusIndex >= 0) {
      const focusNode = nodeMeta[focusIndex];
      focusNode.vx += (centerX - focusNode.x) * 0.04;
      focusNode.vy += (centerY - focusNode.y) * 0.04;
    }
    const avgX = nodeMeta.reduce((acc, node) => acc + node.x, 0) / nodeMeta.length;
    const avgY = nodeMeta.reduce((acc, node) => acc + node.y, 0) / nodeMeta.length;
    const driftX = (centerX - avgX) * 0.01;
    const driftY = (centerY - avgY) * 0.01;
    nodeMeta.forEach((node) => {
      node.vx += driftX;
      node.vy += driftY;
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
      const minX = padding + node.r;
      const maxX = width - padding - node.r;
      const minY = padding + node.r;
      const maxY = height - padding - node.r;
      if (node.x < minX) {
        node.x = minX;
        node.vx *= -0.35;
      } else if (node.x > maxX) {
        node.x = maxX;
        node.vx *= -0.35;
      }
      if (node.y < minY) {
        node.y = minY;
        node.vy *= -0.35;
      } else if (node.y > maxY) {
        node.y = maxY;
        node.vy *= -0.35;
      }
    });
  }
  const nodeById = new Map(nodeMeta.map((node) => [node.id, node]));
  const renderedNodes = nodeMeta.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
    radius: node.r,
    isFocus: node.id === root,
    shortLabel: node.id.length > 6 ? `${node.id.slice(0, 6)}…` : node.id,
  }));
  const renderedEdges = graphEdges.value
    .map((edge) => {
      const source = nodeById.get(edge.node1);
      const target = nodeById.get(edge.node2);
      if (!source || !target) return null;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(0.001, Math.hypot(dx, dy));
      const ux = dx / dist;
      const uy = dy / dist;
      return {
        ...edge,
        x1: source.x + ux * source.r,
        y1: source.y + uy * source.r,
        x2: target.x - ux * target.r,
        y2: target.y - uy * target.r,
      };
    })
    .filter(Boolean);
  return {
    nodes: renderedNodes,
    edges: renderedEdges,
  };
});

const graphModalStyle = computed(() => ({
  left: `${graphModalPosition.x}px`,
  top: `${graphModalPosition.y}px`,
  width: `${graphModalSize.width}px`,
  height: `${graphModalSize.height}px`,
}));

const graphCanvasStyle = computed(() => ({
  transform: `translate(${graphViewState.offsetX}px, ${graphViewState.offsetY}px) scale(${graphViewState.scale})`,
  transformOrigin: 'center center',
}));

const graphBodyStyle = computed(() => ({
  height: `${Math.max(320, graphModalSize.height - 56)}px`,
}));

const getGraphModalConstraints = () => ({
  minWidth: 760,
  maxWidth: Math.max(760, Math.min(window.innerWidth - 24, 1400)),
  minHeight: 520,
  maxHeight: Math.max(520, Math.min(window.innerHeight - 24, 920)),
});

const centerGraphModal = () => {
  const { minWidth, maxWidth, minHeight, maxHeight } = getGraphModalConstraints();
  graphModalSize.width = Math.max(minWidth, Math.min(maxWidth, graphModalSize.width));
  graphModalSize.height = Math.max(minHeight, Math.min(maxHeight, graphModalSize.height));
  graphModalPosition.x = Math.max(12, (window.innerWidth - graphModalSize.width) / 2);
  graphModalPosition.y = Math.max(12, (window.innerHeight - graphModalSize.height) / 2);
};

const onGraphDragging = (event) => {
  if (graphResizeState.active) {
    const { minWidth, maxWidth, minHeight, maxHeight } = getGraphModalConstraints();
    const nextWidth = graphResizeState.baseWidth + (event.clientX - graphResizeState.startX);
    const nextHeight = graphResizeState.baseHeight + (event.clientY - graphResizeState.startY);
    graphModalSize.width = Math.max(minWidth, Math.min(maxWidth, nextWidth));
    graphModalSize.height = Math.max(minHeight, Math.min(maxHeight, nextHeight));
    const maxX = Math.max(12, window.innerWidth - graphModalSize.width - 12);
    const maxY = Math.max(12, window.innerHeight - graphModalSize.height - 12);
    graphModalPosition.x = Math.min(maxX, Math.max(12, graphModalPosition.x));
    graphModalPosition.y = Math.min(maxY, Math.max(12, graphModalPosition.y));
    return;
  }
  if (graphViewState.active) {
    const nextX = graphViewState.baseX + (event.clientX - graphViewState.startX);
    const nextY = graphViewState.baseY + (event.clientY - graphViewState.startY);
    graphViewState.offsetX = Math.max(-240, Math.min(240, nextX));
    graphViewState.offsetY = Math.max(-200, Math.min(200, nextY));
    return;
  }
  if (!graphDragState.active) return;
  const nextX = graphDragState.baseX + (event.clientX - graphDragState.startX);
  const nextY = graphDragState.baseY + (event.clientY - graphDragState.startY);
  const maxX = Math.max(12, window.innerWidth - graphModalSize.width - 12);
  const maxY = Math.max(12, window.innerHeight - graphModalSize.height - 12);
  graphModalPosition.x = Math.min(maxX, Math.max(12, nextX));
  graphModalPosition.y = Math.min(maxY, Math.max(12, nextY));
};

const stopGraphDrag = () => {
  graphDragState.active = false;
  graphResizeState.active = false;
  graphViewState.active = false;
};

const startGraphDrag = (event) => {
  graphDragState.active = true;
  graphDragState.startX = event.clientX;
  graphDragState.startY = event.clientY;
  graphDragState.baseX = graphModalPosition.x;
  graphDragState.baseY = graphModalPosition.y;
};

const startGraphResize = (event) => {
  graphResizeState.active = true;
  graphResizeState.startX = event.clientX;
  graphResizeState.startY = event.clientY;
  graphResizeState.baseWidth = graphModalSize.width;
  graphResizeState.baseHeight = graphModalSize.height;
};

const startGraphViewDrag = (event) => {
  if (event.target.closest('.cursor-move')) return;
  graphViewState.active = true;
  graphViewState.startX = event.clientX;
  graphViewState.startY = event.clientY;
  graphViewState.baseX = graphViewState.offsetX;
  graphViewState.baseY = graphViewState.offsetY;
};

const handleGraphWheel = (event) => {
  if (!activeModalPayload.value || activeModalType.value !== 'graph') return;
  const delta = event.deltaY < 0 ? 0.08 : -0.08;
  const nextScale = Math.max(0.6, Math.min(1.8, graphViewState.scale + delta));
  graphViewState.scale = Number(nextScale.toFixed(2));
};

const handleWindowResize = () => {
  if (!activeModalPayload.value || activeModalType.value !== 'graph') return;
  const { minWidth, maxWidth, minHeight, maxHeight } = getGraphModalConstraints();
  graphModalSize.width = Math.max(minWidth, Math.min(maxWidth, graphModalSize.width));
  graphModalSize.height = Math.max(minHeight, Math.min(maxHeight, graphModalSize.height));
  const maxX = Math.max(12, window.innerWidth - graphModalSize.width - 12);
  const maxY = Math.max(12, window.innerHeight - graphModalSize.height - 12);
  graphModalPosition.x = Math.min(maxX, Math.max(12, graphModalPosition.x));
  graphModalPosition.y = Math.min(maxY, Math.max(12, graphModalPosition.y));
};

const getCardBadgeText = (type) => {
  if (type === 'questions') return '习题推荐';
  if (type === 'graph') return '知识图谱';
  if (type === 'analysis') return '学情回顾';
  return '例题';
};

const openFeatureCard = (card) => {
  if (!card || !card.payload) return;
  activeModalPayload.value = card.payload;
  activeModalType.value = card.type || 'example_card';
  if (activeModalType.value === 'graph') {
    centerGraphModal();
    graphViewState.offsetX = 0;
    graphViewState.offsetY = 0;
    graphViewState.scale = 1;
  }
};

const closeFeatureCard = () => {
  activeModalPayload.value = null;
  activeModalType.value = '';
  stopGraphDrag();
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

const closeFloatingNotice = () => {
  if (floatingNotice.timer) {
    window.clearTimeout(floatingNotice.timer);
    floatingNotice.timer = null;
  }
  floatingNotice.visible = false;
  floatingNotice.message = '';
  floatingNotice.type = 'info';
  floatingNotice.mode = 'toast';
  floatingNotice.onConfirm = null;
};

const showFloatingToast = (message, type = 'info', duration = 2600) => {
  closeFloatingNotice();
  floatingNotice.visible = true;
  floatingNotice.message = (message || '').toString();
  floatingNotice.type = type;
  floatingNotice.mode = 'toast';
  floatingNotice.timer = window.setTimeout(() => {
    closeFloatingNotice();
  }, duration);
};

const showFloatingConfirm = (message, onConfirm) => {
  closeFloatingNotice();
  floatingNotice.visible = true;
  floatingNotice.message = (message || '').toString();
  floatingNotice.type = 'info';
  floatingNotice.mode = 'confirm';
  floatingNotice.onConfirm = typeof onConfirm === 'function' ? onConfirm : null;
};

const cancelFloatingNotice = () => {
  closeFloatingNotice();
};

const confirmFloatingNotice = async () => {
  const action = floatingNotice.onConfirm;
  closeFloatingNotice();
  if (action) {
    await action();
  }
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
  window.addEventListener('mousemove', onGraphDragging);
  window.addEventListener('mouseup', stopGraphDrag);
  window.addEventListener('resize', handleWindowResize);
  userId.value = getStoredUserId() || '';
  await loadCourseOptions();
  await loadHistory();
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onGraphDragging);
  window.removeEventListener('mouseup', stopGraphDrag);
  window.removeEventListener('resize', handleWindowResize);
  closeFloatingNotice();
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
      if (currentSessionId.value) {
        const currentSession = historyList.value.find((item) => item.session_id === currentSessionId.value);
        if (currentSession) {
          currentSessionTitle.value = currentSession.title || '';
        }
      }
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
    showFloatingToast(`创建学习对话失败：${error.message}`, 'error');
  }
};

const removeSession = async (item) => {
  if (!item?.session_id) return;
  showFloatingConfirm(`确定删除对话“${item.title}”吗？`, async () => {
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
      showFloatingToast('对话已删除', 'success');
    } catch (error) {
      console.error('Delete session failed:', error);
      showFloatingToast(`删除对话失败：${error.message}`, 'error');
    }
  });
};

const clearContext = () => {
  showFloatingConfirm('确定要清空当前对话上下文吗？', async () => {
    messages.value = [];
    showFloatingToast('已清空当前上下文', 'success');
  });
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
        showFloatingToast(`无法创建新会话：${e.message}`, 'error');
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
          } else if (event.result.type === 'graph' && Array.isArray(event.result.content)) {
             featureCards.value.push({
               id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
               title: event.result.card_title || '知识图谱',
               summary: event.result.summary || '点击查看图谱关系',
               type: 'graph',
               payload: {
                 title: event.result.card_title || '知识图谱',
                 summary: event.result.summary || '',
                 focusNode: event.result.focus_node || '',
                 queryText: event.result.query_text || '',
                 graph: event.result.content,
               }
             });
          } else if (event.result.type === 'analysis' && event.result.content && typeof event.result.content === 'object') {
             featureCards.value.push({
               id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
               title: event.result.card_title || '学情回顾',
               summary: event.result.summary || '点击查看学习分析',
               type: 'analysis',
               payload: {
                 title: event.result.card_title || '学情回顾',
                 summary: event.result.summary || '',
                 analysis: event.result.content,
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
    await loadHistory();
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




