<template>
  <div class="grid gap-3 lg:grid-cols-[1fr_280px_1fr]">
    <!-- 源文本 -->
    <div class="panel relative flex h-[360px] flex-col">
      <textarea
        :value="sourceText"
        @input="onInput"
        :placeholder="placeholder"
        class="h-full w-full resize-none rounded-xl bg-transparent p-5 pb-12 text-base leading-relaxed outline-none placeholder:text-gray-400"
      ></textarea>
      <div class="pointer-events-none absolute bottom-3 left-5 text-xs text-deepl-muted">
        {{ sourceText.length }} / {{ maxLen }} 字符
      </div>
      <div v-if="sourceText" class="absolute bottom-3 right-3 flex gap-2">
        <button @click="copySource" class="rounded-md border border-deepl-border p-1.5 text-deepl-muted hover:text-deepl-blue" title="复制">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
        </button>
        <button @click="clearSource" class="rounded-md border border-deepl-border p-1.5 text-deepl-muted hover:text-red-500" title="清空">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </button>
      </div>
    </div>

    <!-- 中间编辑工具栏（页面上其实是右侧，这里把侧栏放在中间是为了桌面端三列布局） -->
    <slot name="tools" />

    <!-- 译文 -->
    <div class="panel relative flex h-[360px] flex-col">
      <div
        class="h-full w-full overflow-auto whitespace-pre-wrap break-words p-5 pb-12 text-base leading-relaxed text-deepl-text"
      >
        <div v-if="loading" class="flex h-full items-center justify-center gap-2 text-deepl-muted">
          <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" stroke-opacity="0.2"/>
            <path d="M21 12a9 9 0 0 0-9-9"/>
          </svg>
          正在翻译中...
        </div>
        <div v-else-if="!result" class="h-full text-deepl-muted">
          {{ emptyHint }}
        </div>
        <template v-else>
          <div>{{ result.translated_text }}</div>
          <div v-if="result.from_cache" class="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-1 13l-4-4 1.4-1.4L9 11.2l4.6-4.6L15 8l-6 6z"/></svg>
            来自缓存
          </div>
          <div v-else class="mt-3 inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
            <svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-11h2v3h3v2h-3v3H9v-3H6v-2h3V7z"/></svg>
            大模型翻译
          </div>
        </template>
      </div>
      <div v-if="result && !loading" class="absolute bottom-3 right-3 flex gap-2">
        <button @click="copyResult" class="rounded-md border border-deepl-border p-1.5 text-deepl-muted hover:text-deepl-blue" title="复制译文">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
        </button>
      </div>
    </div>
  </div>

  <!-- 词典 -->
  <DictionarySection />
</template>

<script setup>
import { ref } from 'vue'
import DictionarySection from '@/components/DictionarySection.vue'

const props = defineProps({
  sourceText: { type: String, default: '' },
  result: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  maxLen: { type: Number, default: 5000 },
  placeholder: { type: String, default: '输入要翻译的文本…' },
  emptyHint: { type: String, default: '译文将出现在这里' }
})
const emit = defineEmits(['update:sourceText'])

function onInput(e) {
  emit('update:sourceText', e.target.value)
}

function copySource() { navigator.clipboard.writeText(props.sourceText) }
function clearSource() { emit('update:sourceText', '') }
function copyResult() {
  if (props.result) navigator.clipboard.writeText(props.result.translated_text)
}
</script>
