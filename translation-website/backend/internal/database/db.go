package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

// Init 初始化 SQLite 数据库连接
// SQLite 通过 modernc.org/sqlite（纯 Go 实现，CGO-free）
func Init(dbPath string) (*sql.DB, error) {
	// 确保目录存在
	if dir := filepath.Dir(dbPath); dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, fmt.Errorf("创建数据目录失败: %w", err)
		}
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("打开数据库失败: %w", err)
	}

	// SQLite 串行写 + WAL 提升并发
	db.SetMaxOpenConns(1)
	if _, err := db.Exec("PRAGMA journal_mode=WAL;"); err != nil {
		log.Printf("[db] WAL 设置失败: %v", err)
	}

	if err := migrate(db); err != nil {
		return nil, fmt.Errorf("数据库迁移失败: %w", err)
	}

	log.Printf("[db] 数据库已就绪: %s", dbPath)
	return db, nil
}

func migrate(db *sql.DB) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS translations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			source_text   TEXT NOT NULL,
			source_lang   TEXT NOT NULL,
			target_lang   TEXT NOT NULL,
			translated    TEXT NOT NULL,
			detected_lang TEXT DEFAULT '',
			created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(source_text, source_lang, target_lang)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_src
			ON translations(source_text, source_lang, target_lang);`,
		`CREATE TABLE IF NOT EXISTS api_keys (
			id          TEXT PRIMARY KEY,
			key         TEXT NOT NULL UNIQUE,
			name        TEXT NOT NULL,
			enabled     INTEGER NOT NULL DEFAULT 1,
			call_count  INTEGER NOT NULL DEFAULT 0,
			last_used_at DATETIME,
			created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
	}

	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			return fmt.Errorf("执行 %q 失败: %w", s[:40], err)
		}
	}
	return nil
}
