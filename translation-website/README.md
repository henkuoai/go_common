# 翻译官 · AI 翻译网站

仿 DeepL 风格的极简翻译网站：
- **后端**：Go + Gin + SQLite + langchaingo Agent
- **前端**：Vue 3 + Vite + TailwindCSS
- **大模型**：MiniMax-M3（OpenAI 兼容协议）
- **接口**：HTTP + JSON
- **缓存**：SQLite 命中直接返回，未命中再调 Agent

## 目录结构

```
translation-website/
├── backend/                    Go 后端
│   ├── main.go                 入口
│   ├── go.mod
│   ├── .env.example            环境变量模板
│   ├── data/                   SQLite 数据目录
│   └── internal/
│       ├── config/             配置加载
│       ├── database/           SQLite 初始化 + 迁移
│       ├── models/             数据模型
│       ├── repository/         DAO 层
│       ├── agents/             langchaingo 翻译官 Agent
│       ├── services/           业务编排（缓存优先 + Agent 兜底）
│       ├── handlers/           HTTP Handler
│       ├── middleware/         API Key 鉴权
│       └── routes/             路由注册
├── frontend/                   Vue 前端
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/favicon.svg
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── style.css
│       ├── router/
│       ├── api/                axios + JSON
│       ├── components/         NavBar / TabBar / LanguageSelector ...
│       └── views/              TranslateView / ApiView
└── docs/
```

## 快速启动

### 1. 后端

```bash
cd backend
cp .env.example .env
# 编辑 .env，至少填好 LLM_API_KEY

go mod tidy
go run .
# 监听 :8080
```

启动成功后会看到：

```
==============================================
 翻译服务已启动
   监听端口: 8080
   数据库 : ./data/translation.db
   LLM   : MiniMax-M3 @ https://api.minimax.chat/v1
==============================================
```

### 2. 前端

```bash
cd frontend
npm install
npm run dev
# 默认 http://127.0.0.1:5173 ，已自动代理 /api → :8080
```

## API 一览

### 页面（无鉴权）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/health         | 健康检查 + 缓存统计 |
| GET  | /api/languages      | 支持的语言 |
| POST | /api/translate      | 翻译（页面调用） |

请求：

```json
{
  "source_text": "Hello, world!",
  "source_lang": "auto",
  "target_lang": "zh"
}
```

### 开发者 API（需要 API Key）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/translate | 翻译 |
| GET  | /api/v1/languages | 语言列表 |
| GET  | /api/v1/whoami    | 当前 Key 调用次数 |

请求头：

```
Authorization: Bearer <YOUR_API_KEY>
```

### 初始化 API Key

```bash
# 使用 sqlite3 CLI
sqlite3 backend/data/translation.db   "INSERT INTO api_keys(id, key, name, enabled) VALUES('demo', 'demo-secret', '本地调试', 1);"
```

之后在网页 **使用 API** 页面里填入 `demo-secret` 即可在线调试。

## 缓存策略

1. 用户输入原文 → `service.Translate`
2. 先用 `(source_text, source_lang, target_lang)` 命中查询 SQLite
3. 命中 → 直接返回 `from_cache: true`
4. 未命中 → 调 langchaingo 翻译 Agent → 写入 SQLite → 返回

## langchaingo 翻译官 Agent

文件位于 `backend/internal/agents/translator.go`：

- 使用 `openai` provider（OpenAI 兼容协议指向 MiniMax-M3）
- 使用 `agents.NewOneShotAgent` + 自定义 `translate_text` Tool
- 通过 `chains.Run` 触发；Agent 决定如何调用 Tool 完成翻译

## 开发提示

- 想换模型？改 `.env` 的 `LLM_MODEL` 和 `LLM_BASE_URL` 即可
- 想接真实 LLM：填入 `LLM_API_KEY` 后重启
- 想做灰度：参考 `backend/internal/services/translation_service.go` 加入 `A/B`
- 词典 / 翻译文件 / 翻译语音 / Pro 工具栏当前为占位
