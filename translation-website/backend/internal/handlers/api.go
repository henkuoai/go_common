package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"translation-website/internal/models"
	"translation-website/internal/services"
)

// APIHandler 面向开发者 API 的接口（需要 API Key）
type APIHandler struct {
	svc *services.TranslationService
}

func NewAPIHandler(svc *services.TranslationService) *APIHandler {
	return &APIHandler{svc: svc}
}

// Translate POST /api/v1/translate
func (h *APIHandler) Translate(c *gin.Context) {
	var req models.TranslateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "bad_request",
			"message": err.Error(),
		})
		return
	}
	resp, err := h.svc.Translate(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "translate_failed",
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// Languages GET /api/v1/languages
func (h *APIHandler) Languages(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": models.SupportedLanguages()})
}

// Whoami GET /api/v1/whoami —— 返回当前 Key 的使用情况
func (h *APIHandler) Whoami(c *gin.Context) {
	if v, ok := c.Get("api_key"); ok {
		c.JSON(http.StatusOK, gin.H{"data": v})
		return
	}
	c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
}
