package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"translation-website/internal/config"
	"translation-website/internal/handlers"
	"translation-website/internal/middleware"
	"translation-website/internal/repository"
)

// Register 注册所有路由
func Register(
	r *gin.Engine,
	cfg *config.Config,
	th *handlers.TranslationHandler,
	ah *handlers.APIHandler,
	apiKeyRepo *repository.APIKeyRepo,
) {
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-API-Key"},
		AllowCredentials: true,
	}))

	r.GET("/api/health", th.Health)

	// 页面（无需鉴权）
	r.POST("/api/translate", th.Translate)
	r.GET("/api/languages", th.Languages)

	// 开发者 API（鉴权）
	v1 := r.Group("/api/v1")
	v1.Use(middleware.APIKeyAuth(apiKeyRepo))
	{
		v1.POST("/translate", ah.Translate)
		v1.GET("/languages", ah.Languages)
		v1.GET("/whoami", ah.Whoami)
	}
}
