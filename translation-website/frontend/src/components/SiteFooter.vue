<template>
  <footer class="mt-auto border-t border-deepl-border bg-white py-6">
    <div class="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 text-center text-sm text-deepl-muted">
      <p class="text-base font-medium text-deepl-text">全球已有 20 万+ 开发者信赖</p>
      <p>© {{ year }} 翻译官 · 基于 langchaingo + MiniMax M3 · 仅用于演示</p>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>
