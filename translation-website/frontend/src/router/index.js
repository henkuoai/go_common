import { createRouter, createWebHistory } from 'vue-router'
import TranslateView from '@/views/TranslateView.vue'
import ApiView from '@/views/ApiView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'translate', component: TranslateView },
    { path: '/api', name: 'api', component: ApiView }
  ],
  scrollBehavior() { return { top: 0 } }
})

export default router
