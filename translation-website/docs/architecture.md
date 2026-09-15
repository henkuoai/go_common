# 架构图（文字版）

```
[Vue UI]  --(POST /api/translate json)-->  [Gin] --> [TranslationService]
                                                       |
                                              1) 查 SQLite 缓存
                                                       |
                                              2) 命中则直接返回
                                                       |
                                              3) 未命中 -> TranslatorAgent
                                                       |
                                              4) 返回结果 + 写回 SQLite
```

- 鉴权 API（/api/v1/*）额外走 `APIKeyAuth` 中间件
- LLM 调用通过 `openai.New(WithBaseURL(MiniMaxM3))` 走 OpenAI 兼容协议
