<template>
  <div class="flex gap-2 border-b border-deepl-border pb-3">
    <button
      v-for="t in tabs"
      :key="t.key"
      :disabled="t.disabled"
      @click="$emit('change', t.key)"
      :class="[
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition',
        active === t.key
          ? 'border border-deepl-blue bg-white text-deepl-blue shadow-sm'
          : 'text-deepl-text/80 hover:text-deepl-blue',
        t.disabled && 'cursor-not-allowed opacity-50 hover:text-deepl-text/80'
      ]"
    >
      <span v-html="t.icon" />
      <span>{{ t.label }}</span>
      <span v-if="t.badge" class="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-semibold text-emerald-700">{{ t.badge }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  active: { type: String, default: 'text' }
})
defineEmits(['change'])

const tabs = [
  {
    key: 'text', label: '翻译文本',
    icon: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h12M4 10h8M4 14h6M16 14l3 3-3 3M19 17h-6M20 22l-3-3 3-3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  {
    key: 'file', label: '翻译文件', disabled: true,
    icon: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>'
  },
  {
    key: 'voice', label: '翻译语音', disabled: true,
    icon: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>'
  },
  {
    key: 'api', label: '使用 API',
    icon: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6l-5 6 5 6M16 6l5 6-5 6M14 4l-4 16" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  }
]
</script>
