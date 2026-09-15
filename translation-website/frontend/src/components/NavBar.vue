<template>
  <header class="sticky top-0 z-30 border-b border-deepl-border bg-white/90 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
      <router-link to="/" class="flex items-center gap-2">
        <div class="grid h-8 w-8 place-items-center rounded-lg bg-deepl-blue text-white">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 5h7M7 3v2M14 21l3-7 3 7M14.5 18h5M19 3h2v4a4 4 0 0 1-4 4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span class="text-lg font-semibold tracking-tight text-deepl-blue">翻译官</span>
      </router-link>

      <nav class="hidden md:flex items-center gap-6">
        <a class="nav-link" href="#">产品
          <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>
        </a>
        <a class="nav-link" href="#">解决方案
          <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>
        </a>
        <a class="nav-link" href="#">开发人员
          <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>
        </a>
        <a class="nav-link" href="#">价格</a>
        <a class="nav-link" href="#">应用程序
          <span class="ml-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">新</span>
          <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>
        </a>
        <a class="nav-link" href="#">资源
          <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 7.5l4.5 4.5 4.5-4.5"/></svg>
        </a>
      </nav>

      <div class="ml-auto flex items-center gap-4">
        <button class="text-deepl-text/70 hover:text-deepl-blue" title="通知">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <a class="hidden md:inline text-sm text-deepl-text/80 hover:text-deepl-blue" href="#">登录</a>
        <a class="btn-primary !px-4 !py-1.5 text-sm" href="#">开始免费试用</a>
      </div>
    </div>
  </header>
</template>
