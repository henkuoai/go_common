<template>
  <section class="py-6">
    <TabBar :active="'text'" @change="onTabChange" />

    <div class="mt-4">
      <LanguageSelector
        :languages="languages"
        :sourceLang="sourceLang"
        :targetLang="targetLang"
        @update:sourceLang="v => sourceLang = v"
        @update:targetLang="v => targetLang = v"
        @swap="onSwap"
      />
    </div>

    <TranslationPanels
      class="mt-3"
      v-model:sourceText="sourceText"
      :result="result"
      :loading="loading"
      :maxLen="5000"
      :placeholder="'输入要翻译的文本…'"
      :emptyHint="'译文将出现在这里'"
    >
      <template #tools>
        <EditToolsSidebar />
      </template>
    </TranslationPanels>
  </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '@/components/TabBar.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import TranslationPanels from '@/components/TranslationPanels.vue'
import EditToolsSidebar from '@/components/EditToolsSidebar.vue'
import { fetchLanguages, translate } from '@/api/translation'

const router = useRouter()

const sourceText = ref('')
const sourceLang = ref('auto')
const targetLang = ref('zh')
const languages = ref([])
const result = ref(null)
const loading = ref(false)
let debounce = null

onMounted(async () => {
  try {
    languages.value = await fetchLanguages()
  } catch (e) {
    console.error('加载语言失败', e)
  }
})

function onTabChange(key) {
  if (key === 'api') router.push({ name: 'api' })
}

function onSwap() {
  if (sourceLang.value === 'auto') {
    sourceLang.value = targetLang.value
  } else {
    const tmp = sourceLang.value
    sourceLang.value = targetLang.value
    targetLang.value = tmp
  }
}

watch(sourceText, (val) => {
  if (debounce) clearTimeout(debounce)
  if (!val || !val.trim()) { result.value = null; return }
  debounce = setTimeout(() => doTranslate(val), 800)
})

async function doTranslate(text) {
  loading.value = true
  try {
    const res = await translate({
      source_text: text,
      source_lang: sourceLang.value,
      target_lang: targetLang.value
    })
    result.value = res
  } catch (e) {
    console.error('翻译失败', e)
    result.value = {
      translated_text: '⚠️ ' + (e?.response?.data?.message || e.message || '翻译失败'),
      from_cache: false
    }
  } finally {
    loading.value = false
  }
}

watch([sourceLang, targetLang], () => {
  if (sourceText.value && sourceText.value.trim()) {
    doTranslate(sourceText.value)
  }
})
</script>
