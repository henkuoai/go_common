package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config 保存应用配置
type Config struct {
	Port           string
	DBPath         string
	LLMProvider    string
	LLMBaseURL     string
	LLMAPIKey      string
	LLMModel       string
	RequestTimeout int
	AllowedOrigins []string
}

// Load 从环境变量加载配置
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Printf("[config] .env 未加载（使用环境变量）: %v", err)
	}

	cfg := &Config{
		Port:           getEnv("APP_PORT", "8080"),
		DBPath:         getEnv("DB_PATH", "./data/translation.db"),
		LLMProvider:    getEnv("LLM_PROVIDER", "openai"),
		LLMBaseURL:     getEnv("LLM_BASE_URL", "https://api.minimax.chat/v1"),
		LLMAPIKey:      getEnv("LLM_API_KEY", ""),
		LLMModel:       getEnv("LLM_MODEL", "MiniMax-M3"),
		RequestTimeout: getEnvInt("REQUEST_TIMEOUT", 60),
		AllowedOrigins: []string{"http://localhost:5173", "http://127.0.0.1:5173"},
	}
	return cfg
}

func getEnv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}

func getEnvInt(key string, def int) int {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return def
}
