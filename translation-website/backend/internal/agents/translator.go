package agents

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/tmc/langchaingo/agents"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
	"github.com/tmc/langchaingo/tools"
)

// translateInput 是 translate_text 工具的入参（Agent 传来的 JSON）
type translateInput struct {
	Text string `json:"text"`
	Src  string `json:"src_lang"`
	Tgt  string `json:"tgt_lang"`
}

// TranslateTool 实现 langchaingo 框架的 tools.Tool 接口
// 由 Agent 调度，专门负责单段文本的翻译
type TranslateTool struct {
	llm llms.LLM
}

func NewTranslateTool(llm llms.LLM) *TranslateTool {
	return &TranslateTool{llm: llm}
}

func (t *TranslateTool) Name() string { return "translate_text" }

func (t *TranslateTool) Description() string {
	return `用于将一段文本从源语言翻译为目标语言。
输入必须是严格的 JSON 字符串，包含三个字段：
  - "text":       待翻译的文本
  - "src_lang":   源语言代码（auto 表示自动检测）
  - "tgt_lang":   目标语言代码
工具会调用大模型完成翻译并把译文字符串原样返回。`
}

func (t *TranslateTool) Call(ctx context.Context, input string) (string, error) {
	cleaned := strings.TrimSpace(input)
	cleaned = strings.TrimPrefix(cleaned, "`")
	cleaned = strings.TrimSuffix(cleaned, "`")

	var args translateInput
	if err := json.Unmarshal([]byte(cleaned), &args); err != nil {
		return "", fmt.Errorf("translate_text 入参解析失败: %w", err)
	}

	prompt := buildPrompt(args.Text, args.Src, args.Tgt)
	out, err := llms.GenerateFromSinglePrompt(ctx, t.llm, prompt)
	if err != nil {
		return "", fmt.Errorf("调用大模型失败: %w", err)
	}
	return strings.TrimSpace(out), nil
}

// buildPrompt 生成稳定的翻译 Prompt
func buildPrompt(text, src, tgt string) string {
	srcName := langName(src)
	tgtName := langName(tgt)
	if src == "auto" || src == "" {
		return fmt.Sprintf(
			"你是一名专业翻译官，请将下面这段文本自动检测源语言后翻译为 %s。\n"+
				"要求：\n"+
				"1. 只输出译文本身，不要任何解释、注释或引号\n"+
				"2. 保留原文中换行、空格、Markdown 等格式\n"+
				"3. 专有名词按业内通用译法\n\n原文：\n%s",
			tgtName, text)
	}
	return fmt.Sprintf(
		"你是一名专业翻译官，请将下面这段文本从 %s 翻译为 %s。\n"+
			"要求：\n"+
			"1. 只输出译文本身，不要任何解释、注释或引号\n"+
			"2. 保留原文中换行、空格、Markdown 等格式\n"+
			"3. 专有名词按业内通用译法\n\n原文：\n%s",
		srcName, tgtName, text)
}

func langName(code string) string {
	m := map[string]string{
		"auto":  "自动检测",
		"zh":    "中文（简体）",
		"zh-TW": "中文（繁体）",
		"en":    "英语",
		"ja":    "日语",
		"ko":    "韩语",
		"fr":    "法语",
		"de":    "德语",
		"es":    "西班牙语",
		"ru":    "俄语",
		"it":    "意大利语",
		"pt":    "葡萄牙语",
		"ar":    "阿拉伯语",
		"th":    "泰语",
		"vi":    "越南语",
	}
	if v, ok := m[code]; ok {
		return v
	}
	return code
}

// Config 启动 Agent 所需的配置
type Config struct {
	APIKey  string
	BaseURL string
	Model   string
}

// TranslatorAgent 基于 langchaingo 的 OneShot Agent + 自定义 Tool
type TranslatorAgent struct {
	executor *agents.Executor
}

func NewTranslatorAgent(cfg Config) (*TranslatorAgent, error) {
	if cfg.APIKey == "" {
		return nil, fmt.Errorf("LLM_API_KEY 未配置")
	}

	opts := []openai.Option{
		openai.WithToken(cfg.APIKey),
		openai.WithModel(cfg.Model),
	}
	if cfg.BaseURL != "" {
		opts = append(opts, openai.WithBaseURL(cfg.BaseURL))
	}
	llm, err := openai.New(opts...)
	if err != nil {
		return nil, fmt.Errorf("初始化 LLM 失败: %w", err)
	}

	tool := NewTranslateTool(llm)
	agent := agents.NewOneShotAgent(llm,
		[]tools.Tool{tool},
		agents.WithMaxIterations(3),
	)
	executor := agents.NewExecutor(agent,
		agents.WithExecutorVerbose(false),
	)
	return &TranslatorAgent{executor: executor}, nil
}

// Translate 让 Agent 完成一次翻译
func (a *TranslatorAgent) Translate(ctx context.Context, text, srcLang, tgtLang string) (string, error) {
	prompt := fmt.Sprintf(
		"请使用 translate_text 工具把下面的原文翻译为目标语言。\n"+
			"- 源语言：%s\n"+
			"- 目标语言：%s\n"+
			"- 原文：%s\n\n"+
			"注意：只调用一次工具，把工具返回的译文原样输出，不要再加工。",
		srcLang, tgtLang, text,
	)

	raw, err := a.executor.Call(ctx, map[string]any{"input": prompt})
	if err != nil {
		return "", err
	}
	output, _ := raw["output"].(string)
	if output == "" {
		// 兼容老版本可能用 "text" key
		output, _ = raw["text"].(string)
	}
	return strings.TrimSpace(output), nil
}
