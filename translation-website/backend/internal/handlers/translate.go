package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"translation-website/internal/models"
	"translation-website/internal/services"
)

// TranslationHandler 页面用翻译接口
type TranslationHandler struct {
	svc *services.TranslationService
}

func NewTranslationHandler(svc *services.TranslationService) *TranslationHandler {
	return &TranslationHandler{svc: svc}
}

// Translate POST /api/translate
func (h *TranslationHandler) Translate(c *gin.Context) {
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

// Languages GET /api/languages
func (h *TranslationHandler) Languages(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": models.SupportedLanguages()})
}

// Health GET /api/health
func (h *TranslationHandler) Health(c *gin.Context) {
	stats, err := h.svc.CacheStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "cache": stats})
}
