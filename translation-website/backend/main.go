package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"translation-website/internal/agents"
	"translation-website/internal/config"
	"translation-website/internal/database"
	"translation-website/internal/handlers"
	"translation-website/internal/repository"
	"translation-website/internal/routes"
	"translation-website/internal/services"
)

func main() {
	cfg := config.Load()

	// 1. 数据库
	db, err := database.Init(cfg.DBPath)
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	defer db.Close()

	translationRepo := repository.NewTranslationRepo(db)
	apiKeyRepo := repository.NewAPIKeyRepo(db)

	// 2. 翻译 Agent（LLM 调用）
	agent, err := agents.NewTranslatorAgent(agents.Config{
		APIKey:  cfg.LLMAPIKey,
		BaseURL: cfg.LLMBaseURL,
		Model:   cfg.LLMModel,
	})
	if err != nil {
		log.Printf("[warn] 翻译 Agent 初始化失败（/api/translate 仍可工作但会返回错误）: %v", err)
	}

	// 3. Service
	svc := services.NewTranslationService(translationRepo, agent)

	// 4. Handlers
	th := handlers.NewTranslationHandler(svc)
	ah := handlers.NewAPIHandler(svc)

	// 5. Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	routes.Register(r, cfg, th, ah, apiKeyRepo)

	// 6. Server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("==============================================")
		log.Printf(" 翻译服务已启动")
		log.Printf("   监听端口: %s", cfg.Port)
		log.Printf("   数据库 : %s", cfg.DBPath)
		log.Printf("   LLM   : %s @ %s", cfg.LLMModel, cfg.LLMBaseURL)
		log.Printf("   Web UI  -> http://localhost:%s", cfg.Port)
		log.Printf("==============================================")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("服务异常退出: %v", err)
		}
	}()

	// 7. 优雅退出
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("\n正在关闭服务...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}
