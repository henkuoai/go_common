<template>
  <section class="py-6">
    <TabBar :active="'api'" @change="onTabChange" />

    <div class="mt-6 grid gap-6 lg:grid-cols-3">
      <article class="panel p-6 lg:col-span-2">
        <h1 class="mb-2 text-2xl font-semibold text-deepl-text">开发者 API</h1>
        <p class="mb-6 text-sm text-deepl-muted">
          通过 HTTPS 调用 MiniMax M3 翻译官 Agent，把翻译能力嵌入你的应用。
          所有请求都需要在请求头携带 API Key。
        </p>

        <h2 class="mt-6 mb-2 text-lg font-semibold">认证</h2>
        <p class="text-sm text-deepl-muted">
          请求头 <code class="rounded bg-deepl-panel px-1.5 py-0.5 text-deepl-text">{{ "Authorization: Bearer <YOUR_API_KEY>" }}</code>
        </p>

        <h2 class="mt-6 mb-2 text-lg font-semibold">POST /api/v1/translate</h2>
        <p class="mb-2 text-sm text-deepl-muted">请求 Body（JSON）</p>
        <pre class="overflow-auto rounded-lg bg-deepl-panel p-4 text-xs leading-relaxed text-deepl-text">{{ requestExample }}</pre>

        <p class="mb-2 mt-4 text-sm text-deepl-muted">响应示例</p>
        <pre class="overflow-auto rounded-lg bg-deepl-panel p-4 text-xs leading-relaxed text-deepl-text">{{ responseExample }}</pre>

        <h2 class="mt-6 mb-2 text-lg font-semibold">支持的错误码</h2>
        <ul class="list-disc space-y-1 pl-5 text-sm text-deepl-muted">
          <li><b>401 unauthorized</b>：缺少 API Key 或 Key 无效</li>
          <li><b>400 bad_request</b>：请求体字段缺失或非法</li>
          <li><b>500 translate_failed</b>：后端翻译流程异常（多为上游 LLM 失败）</li>
        </ul>
      </article>

      <aside class="panel p-6">
        <h2 class="mb-1 text-lg font-semibold">在线调试</h2>
        <p class="mb-4 text-xs text-deepl-muted">输入 API Key 与文本，立刻看到返回结果。</p>

        <label class="text-xs text-deepl-muted">API Key</label>
        <input
          v-model="apiKey"
          @change="onSaveKey"
          type="text"
          placeholder="Bearer token"
          class="input-base mt-1 rounded-lg border border-deepl-border px-3 py-2 text-sm"
        />

        <label class="mt-4 block text-xs text-deepl-muted">源语言</label>
        <select v-model="srcLang" class="input-base mt-1 rounded-lg border border-deepl-border px-3 py-2 text-sm">
          <option v-for="l in languages" :key="l.code" :value="l.code">{{ l.name }}</option>
        </select>

        <label class="mt-4 block text-xs text-deepl-muted">目标语言</label>
        <select v-model="tgtLang" class="input-base mt-1 rounded-lg border border-deepl-border px-3 py-2 text-sm">
          <option v-for="l in languages.filter(x => x.code !== 'auto')" :key="l.code" :value="l.code">{{ l.name }}</option>
        </select>

        <label class="mt-4 block text-xs text-deepl-muted">请求体</label>
        <textarea v-model="bodyText" rows="6" class="input-base mt-1 rounded-lg border border-deepl-border px-3 py-2 text-sm font-mono"></textarea>

        <button
          @click="runRequest"
          :disabled="loading"
          class="btn-primary mt-4 w-full"
        >
          {{ loading ? '请求中...' : '发送请求' }}
        </button>

        <label class="mt-4 block text-xs text-deepl-muted">响应</label>
        <pre class="mt-1 max-h-72 overflow-auto rounded-lg bg-deepl-panel p-3 text-xs leading-relaxed text-deepl-text">{{ responseText }}</pre>

        <button class="btn-ghost mt-3 w-full" @click="copyAsCurl">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
          复制为 curl
        </button>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '@/components/TabBar.vue'
import { fetchLanguages, v1Translate, setApiKey, getApiKey } from '@/api/translation'

const router = useRouter()

const apiKey = ref(getApiKey())
const srcLang = ref('auto')
const tgtLang = ref('zh')
const languages = ref([])
const bodyText = ref('{
  "source_text": "Hello, world!",
  "source_lang": "auto",
  "target_lang": "zh"
}')
const responseText = ref('')
const loading = ref(false)

const requestExample = computed(() => '{
  "source_text": "Hello, world!",
  "source_lang": "auto",
  "target_lang": "zh"
}')
const responseExample = computed(() => '{
  "data": {
    "source_text": "Hello, world!",
    "source_lang": "auto",
    "target_lang": "zh",
    "translated_text": "你好，世界！",
    "from_cache": false
  }
}')

function onSaveKey() { setApiKey(apiKey.value) }
function onTabChange(key) { if (key === 'text') router.push({ name: 'translate' }) }

onMounted(async () => {
  try { languages.value = await fetchLanguages() } catch (e) { console.error(e) }
})

watch([srcLang, tgtLang], () => {
  try {
    const obj = JSON.parse(bodyText.value || '{}')
    obj.source_lang = srcLang.value
    obj.target_lang = tgtLang.value
    bodyText.value = JSON.stringify(obj, null, 2)
  } catch {}
})

async function runRequest() {
  if (!apiKey.value) { responseText.value = '⚠️ 请先填写 API Key'; return }
  let payload
  try { payload = JSON.parse(bodyText.value) }
  catch { responseText.value = '⚠️ 请求体不是合法 JSON'; return }
  loading.value = true
  try {
    const res = await v1Translate(payload)
    responseText.value = JSON.stringify({ data: res }, null, 2)
  } catch (e) {
    responseText.value = JSON.stringify({
      error: e?.response?.data?.error || 'request_failed',
      message: e?.response?.data?.message || e.message
    }, null, 2)
  } finally {
    loading.value = false
  }
}

function copyAsCurl() {
  const lines = [
    'curl -X POST http://localhost:8080/api/v1/translate \\',
    '  -H "Authorization: Bearer ' + (apiKey.value || '<YOUR_KEY>') + '" \\',
    '  -H "Content-Type: application/json" \\',
    "  -d '" + bodyText.value + "'"
  ]
  navigator.clipboard.writeText(lines.join('\n'))
}
</script>
