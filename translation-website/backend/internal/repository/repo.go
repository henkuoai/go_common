package repository

import (
	"database/sql"
	"errors"
	"time"

	"translation-website/internal/models"
)

// ErrNotFound 数据库无匹配记录
var ErrNotFound = errors.New("记录未找到")

// TranslationRepo 封装翻译表的 CRUD
type TranslationRepo struct {
	db *sql.DB
}

func NewTranslationRepo(db *sql.DB) *TranslationRepo {
	return &TranslationRepo{db: db}
}

// Find 查询缓存（命中返回 true）
func (r *TranslationRepo) Find(sourceText, sourceLang, targetLang string) (*models.Translation, error) {
	row := r.db.QueryRow(
		`SELECT id, source_text, source_lang, target_lang, translated, detected_lang, created_at
		  FROM translations
		 WHERE source_text = ? AND source_lang = ? AND target_lang = ?
		 LIMIT 1`,
		sourceText, sourceLang, targetLang,
	)

	var t models.Translation
	var detected sql.NullString
	var createdAt time.Time
	if err := row.Scan(&t.ID, &t.SourceText, &t.SourceLang, &t.TargetLang,
		&t.TranslatedText, &detected, &createdAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	t.CreatedAt = createdAt
	if detected.Valid {
		// 仅在内存中临时携带，DB 字段保留
	}
	return &t, nil
}

// Insert 保存新翻译（遇到冲突时使用 ON CONFLICT 覆盖更新）
func (r *TranslationRepo) Insert(t *models.Translation) error {
	_, err := r.db.Exec(
		`INSERT INTO translations(source_text, source_lang, target_lang, translated, detected_lang)
		 VALUES(?,?,?,?,?)
		 ON CONFLICT(source_text, source_lang, target_lang)
		 DO UPDATE SET translated = excluded.translated,
		               detected_lang = excluded.detected_lang`,
		t.SourceText, t.SourceLang, t.TargetLang, t.TranslatedText, "",
	)
	return err
}

// Count 总缓存条目数
func (r *TranslationRepo) Count() (int64, error) {
	var n int64
	if err := r.db.QueryRow("SELECT COUNT(*) FROM translations").Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

// ---------- API Key ----------

type APIKeyRepo struct {
	db *sql.DB
}

func NewAPIKeyRepo(db *sql.DB) *APIKeyRepo {
	return &APIKeyRepo{db: db}
}

func (r *APIKeyRepo) GetByKey(key string) (*models.APIKey, error) {
	row := r.db.QueryRow(
		`SELECT id, key, name, enabled, call_count, last_used_at, created_at
		  FROM api_keys WHERE key = ? LIMIT 1`, key)
	var k models.APIKey
	var enabled int
	var lastUsed sql.NullTime
	if err := row.Scan(&k.ID, &k.Key, &k.Name, &enabled, &k.CallCount, &lastUsed, &k.CreatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	k.Enabled = enabled == 1
	if lastUsed.Valid {
		k.LastUsedAt = lastUsed.Time
	}
	return &k, nil
}

// IncrementUsage 更新调用次数与最近使用时间
func (r *APIKeyRepo) IncrementUsage(key string) error {
	_, err := r.db.Exec(
		`UPDATE api_keys SET call_count = call_count + 1, last_used_at = ?
		 WHERE key = ?`, time.Now(), key)
	return err
}
