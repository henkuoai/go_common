package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"translation-website/internal/repository"
)

// APIKeyAuth 校验请求头 Authorization: Bearer <key>
func APIKeyAuth(repo *repository.APIKeyRepo) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := c.GetHeader("Authorization")
		key := strings.TrimSpace(strings.TrimPrefix(raw, "Bearer "))
		if raw == "" {
			key = strings.TrimSpace(c.GetHeader("X-API-Key"))
		}
		if key == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "缺少 Authorization: Bearer <key> 或 X-API-Key 请求头",
			})
			return
		}
		k, err := repo.GetByKey(key)
		if err != nil || k == nil || !k.Enabled {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_api_key",
				"message": "API Key 无效或已禁用",
			})
			return
		}
		_ = repo.IncrementUsage(key)
		c.Set("api_key", k)
		c.Next()
	}
}
