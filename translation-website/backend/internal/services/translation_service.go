package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"log"
	"strings"
	"time"

	"translation-website/internal/agents"
	"translation-website/internal/models"
	"translation-website/internal/repository"
)

// TranslationService 业务编排：缓存优先 + Agent 兜底
type TranslationService struct {
	repo  *repository.TranslationRepo
	agent *agents.TranslatorAgent
}

func NewTranslationService(repo *repository.TranslationRepo, agent *agents.TranslatorAgent) *TranslationService {
	return &TranslationService{repo: repo, agent: agent}
}

// Translate 优先查 SQLite，命中直接返回；未命中调用翻译 Agent 并写入缓存
func (s *TranslationService) Translate(ctx context.Context, req *models.TranslateRequest) (*models.TranslateResponse, error) {
	req.SourceText = strings.TrimSpace(req.SourceText)
	if req.SourceText == "" {
		return nil, errors.New("待翻译文本不能为空")
	}
	if req.TargetLang == "" {
		return nil, errors.New("目标语言不能为空")
	}
	if req.SourceLang == "" {
		req.SourceLang = "auto"
	}

	// 1) 查缓存
	normKey := normalize(req.SourceText)
	if cached, err := s.repo.Find(normKey, req.SourceLang, req.TargetLang); err == nil && cached != nil {
		log.Printf("[svc] 缓存命中 src=%s tgt=%s len=%d", req.SourceLang, req.TargetLang, len(req.SourceText))
		return &models.TranslateResponse{
			SourceText:     req.SourceText,
			SourceLang:     req.SourceLang,
			TargetLang:     req.TargetLang,
			TranslatedText: cached.TranslatedText,
			FromCache:      true,
		}, nil
	}

	// 2) 缓存未命中 → 调 Agent
	log.Printf("[svc] 缓存未命中，调用 Agent：src=%s tgt=%s len=%d", req.SourceLang, req.TargetLang, len(req.SourceText))
	if s.agent == nil {
		return nil, errors.New("翻译 Agent 未初始化，请检查 LLM_API_KEY 等配置")
	}
	translated, err := s.agent.Translate(ctx, req.SourceText, req.SourceLang, req.TargetLang)
	if err != nil {
		return nil, err
	}
	translated = strings.TrimSpace(translated)

	// 3) 写入缓存
	rec := &models.Translation{
		SourceText:     normKey,
		SourceLang:     req.SourceLang,
		TargetLang:     req.TargetLang,
		TranslatedText: translated,
	}
	if err := s.repo.Insert(rec); err != nil {
		log.Printf("[svc] 写入缓存失败（不影响主流程）: %v", err)
	}

	return &models.TranslateResponse{
		SourceText:     req.SourceText,
		SourceLang:     req.SourceLang,
		TargetLang:     req.TargetLang,
		TranslatedText: translated,
		FromCache:      false,
	}, nil
}

// normalize 对原文做轻度规范化（去首尾空白、合并连续空白），便于缓存命中
func normalize(s string) string {
	s = strings.TrimSpace(s)
	// 合并连续空白为单个空格，避免 "abc  def" 与 "abc def" 漏命中
	spaceRule := strings.NewReplacer(
		"	", " ", "
", "
", "", "",
	)
	s = spaceRule.Replace(s)
	for strings.Contains(s, "  ") {
		s = strings.ReplaceAll(s, "  ", " ")
	}
	return s
}

// Hash 仅用于日志 / 调试
func Hash(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:8])
}

// CacheStats 返回缓存统计
func (s *TranslationService) CacheStats(ctx context.Context) (map[string]any, error) {
	n, err := s.repo.Count()
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"entries":   n,
		"checkedAt": time.Now().Format(time.RFC3339),
	}, nil
}
