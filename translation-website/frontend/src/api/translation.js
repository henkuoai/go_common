import axios from 'axios'

const http = axios.create({ baseURL: '/api', timeout: 90000 })

export async function translate({ source_text, source_lang = 'auto', target_lang }) {
  const { data } = await http.post('/translate', { source_text, source_lang, target_lang })
  return data.data
}

export async function fetchLanguages() {
  const { data } = await http.get('/languages')
  return data.data
}

export async function fetchHealth() {
  const { data } = await http.get('/health')
  return data
}

export function setApiKey(key) { localStorage.setItem('api_key', key || '') }
export function getApiKey() { return localStorage.getItem('api_key') || '' }

export function apiV1Client() {
  return axios.create({
    baseURL: '/api/v1',
    timeout: 90000,
    headers: { Authorization: 'Bearer ' + getApiKey() }
  })
}

export async function v1Translate(payload) {
  const { data } = await apiV1Client().post('/translate', payload)
  return data.data
}
export async function v1Languages() {
  const { data } = await apiV1Client().get('/languages')
  return data.data
}
export async function v1Whoami() {
  const { data } = await apiV1Client().get('/whoami')
  return data.data
}
