<template>
  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-deepl-border bg-white px-4 py-3">
    <!-- 源语言 -->
    <div class="relative">
      <button
        @click="openSrc = !openSrc; openTgt = false"
        class="flex w-full items-center justify-between text-sm text-deepl-text"
      >
        <span class="flex items-center gap-2">
          <span class="text-deepl-muted">{{ srcLangLabel }}</span>
        </span>
        <svg class="h-4 w-4 text-deepl-muted" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.5 7.5l4.5 4.5 4.5-4.5"/>
        </svg>
      </button>
      <div v-if="openSrc" class="absolute left-0 top-full z-20 mt-1 max-h-64 w-56 overflow-auto rounded-lg border border-deepl-border bg-white shadow-lg">
        <div
          v-for="l in languages"
          :key="'s-' + l.code"
          @click="selectSrc(l)"
          class="dropdown-item"
          :class="{ 'bg-deepl-panel font-medium text-deepl-blue': l.code === sourceLang }"
        >
          <span>{{ l.name }}</span>
          <span v-if="l.code === sourceLang" class="text-deepl-blue">
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z"/></svg>
          </span>
        </div>
      </div>
    </div>

    <!-- 交换按钮 -->
    <button
      @click="$emit('swap')"
      class="grid h-9 w-9 place-items-center rounded-full border border-deepl-border text-deepl-muted transition hover:border-deepl-blue hover:text-deepl-blue"
      title="交换源/目标语言"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 4l-4 4 4 4M3 8h14M17 20l4-4-4-4M21 16H7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- 目标语言 -->
    <div class="relative">
      <button
        @click="openTgt = !openTgt; openSrc = false"
        class="flex w-full items-center justify-between text-sm text-deepl-text"
      >
        <span class="flex items-center gap-2">
          <span>{{ tgtLangLabel }}</span>
        </span>
        <svg class="h-4 w-4 text-deepl-muted" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.5 7.5l4.5 4.5 4.5-4.5"/>
        </svg>
      </button>
      <div v-if="openTgt" class="absolute right-0 top-full z-20 mt-1 max-h-64 w-56 overflow-auto rounded-lg border border-deepl-border bg-white shadow-lg">
        <div
          v-for="l in languages.filter(x => x.code !== 'auto')"
          :key="'t-' + l.code"
          @click="selectTgt(l)"
          class="dropdown-item"
          :class="{ 'bg-deepl-panel font-medium text-deepl-blue': l.code === targetLang }"
        >
          <span>{{ l.name }}</span>
          <span v-if="l.code === targetLang" class="text-deepl-blue">
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0z"/></svg>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  languages: { type: Array, required: true },
  sourceLang: { type: String, default: 'auto' },
  targetLang: { type: String, default: 'zh' }
})
const emit = defineEmits(['update:sourceLang', 'update:targetLang', 'swap'])

const openSrc = ref(false)
const openTgt = ref(false)

const srcLangLabel = computed(() => {
  return props.languages.find(l => l.code === props.sourceLang)?.name || props.sourceLang
})
const tgtLangLabel = computed(() => {
  return props.languages.find(l => l.code === props.targetLang)?.name || props.targetLang
})

function selectSrc(l) { emit('update:sourceLang', l.code); openSrc.value = false }
function selectTgt(l) { emit('update:targetLang', l.code); openTgt.value = false }
</script>
