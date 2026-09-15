<template>
  <aside class="panel flex h-[360px] flex-col p-4">
    <button class="mb-3 flex items-center gap-2 text-deepl-text">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v6H4zM4 14h10v6H4z"/></svg>
    </button>
    <div class="mb-3 text-sm font-medium text-deepl-text">编辑工具</div>

    <button class="mb-2 flex items-center justify-between rounded-lg bg-deepl-panel px-3 py-2 text-sm text-deepl-muted">
      <span class="flex items-center gap-2">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
        翻译语气
      </span>
      <span class="pro-pill">Pro</span>
    </button>

    <div class="mt-3 text-sm font-medium text-deepl-text">自定义</div>

    <button class="mb-2 mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-deepl-muted hover:bg-deepl-panel">
      <span class="flex items-center gap-2">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18M7 15l3-3 4 4 5-7"/></svg>
        风格配置
      </span>
      <span class="pro-pill">Pro</span>
    </button>

    <button class="mb-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-deepl-text hover:bg-deepl-panel">
      <span class="flex items-center gap-2">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M4 12h10M4 18h16"/></svg>
        术语表
      </span>
      <span class="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-200">
        <span class="absolute left-0.5 h-4 w-4 rounded-full bg-white transition"></span>
      </span>
    </button>

    <button class="mb-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm text-deepl-muted hover:bg-deepl-panel">
      <span class="flex items-center gap-2">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18l6-6-6-6"/></svg>
        风格规则
      </span>
      <span class="pro-pill">Pro</span>
    </button>

    <div class="mt-auto rounded-lg border border-dashed border-deepl-border px-3 py-3 text-xs text-deepl-muted">
      <div class="mb-1 font-medium text-deepl-text">💡 缓存已开启</div>
      重复请求会直接命中 SQLite，已大幅降低 LLM 费用。
    </div>
  </aside>
</template>
