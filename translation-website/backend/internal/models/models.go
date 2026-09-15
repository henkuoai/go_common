package models

import "time"

// Translation 表示一次翻译记录
type Translation struct {
	ID             int64     `json:"id"`
	SourceText     string    `json:"source_text"`
	SourceLang     string    `json:"source_lang"`
	TargetLang     string    `json:"target_lang"`
	TranslatedText string    `json:"translated_text"`
	FromCache      bool      `json:"from_cache"`
	CreatedAt      time.Time `json:"created_at"`
}

// TranslateRequest 是页面翻译请求体
type TranslateRequest struct {
	SourceText string `json:"source_text" binding:"required"`
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang" binding:"required"`
}

// TranslateResponse 是页面翻译响应
type TranslateResponse struct {
	SourceText     string `json:"source_text"`
	SourceLang     string `json:"source_lang"`
	TargetLang     string `json:"target_lang"`
	TranslatedText string `json:"translated_text"`
	DetectedLang   string `json:"detected_lang,omitempty"`
	FromCache      bool   `json:"from_cache"`
}

// APIKey 表示一个外部调用方使用的 API Key
type APIKey struct {
	ID         string    `json:"id"`
	Key        string    `json:"key"`
	Name       string    `json:"name"`
	Enabled    bool      `json:"enabled"`
	CallCount  int64     `json:"call_count"`
	LastUsedAt time.Time `json:"last_used_at"`
	CreatedAt  time.Time `json:"created_at"`
}

// Language 表示支持的语言
type Language struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

// SupportedLanguages 预置支持的语言列表
func SupportedLanguages() []Language {
	return []Language{
		{Code: "auto", Name: "检测语言"},
		{Code: "zh", Name: "中文(简体)"},
		{Code: "zh-TW", Name: "中文(繁体)"},
		{Code: "en", Name: "英语"},
		{Code: "ja", Name: "日语"},
		{Code: "ko", Name: "韩语"},
		{Code: "fr", Name: "法语"},
		{Code: "de", Name: "德语"},
		{Code: "es", Name: "西班牙语"},
		{Code: "ru", Name: "俄语"},
		{Code: "it", Name: "意大利语"},
		{Code: "pt", Name: "葡萄牙语"},
		{Code: "ar", Name: "阿拉伯语"},
		{Code: "th", Name: "泰语"},
		{Code: "vi", Name: "越南语"},
	}
}
