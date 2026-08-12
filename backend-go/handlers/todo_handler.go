package handlers

import (
	"ai-todo-backend/models"
	"ai-todo-backend/services"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TodoHandler struct {
	DB *gorm.DB
}

func NewTodoHandler(db *gorm.DB) *TodoHandler {
	return &TodoHandler{DB: db}
}

// GetAllTodos GET /api/todos - WITH FILTERS
func (h *TodoHandler) GetAllTodos(c *gin.Context) {
	userId, _ := c.Get("userId")
	
	// Query params
	search := c.Query("search")
	status := c.Query("status") // all, active, completed
	priority := c.Query("priority") // high, medium, low
	category := c.Query("category") // work, personal, study, health, other
	sort := c.Query("sort") // created_at, priority, deadline, title
	
	query := h.DB.Where("user_id = ?", userId)
	
	// SEARCH
	if search != "" {
		query = query.Where("LOWER(title) LIKE ?", "%"+strings.ToLower(search)+"%")
	}
	
	// STATUS FILTER
	switch status {
case "active":
    query = query.Where("completed = ?", false)
case "completed":
    query = query.Where("completed = ?", true)
}
	// PRIORITY FILTER
	if priority != "" && priority != "all" {
		query = query.Where("priority = ?", priority)
	}
	
	// CATEGORY FILTER
	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}
	
	// SORTING
	switch sort {
	case "priority":
		query = query.Order(`
			CASE priority 
				WHEN 'high' THEN 1 
				WHEN 'medium' THEN 2 
				WHEN 'low' THEN 3 
				ELSE 4 
			END
		`)
	case "deadline":
		query = query.Order("deadline ASC NULLS LAST")
	case "title":
		query = query.Order("title ASC")
	default: // created_at
		query = query.Order("created_at DESC")
	}
	
	var todos []models.Todo
	query.Find(&todos)
	
	// Statistik
	var total, completed, pending int64
	h.DB.Model(&models.Todo{}).Where("user_id = ?", userId).Count(&total)
	h.DB.Model(&models.Todo{}).Where("user_id = ? AND completed = ?", userId, true).Count(&completed)
	pending = total - completed

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    todos,
		"meta": gin.H{
			"total":    total,
			"completed": completed,
			"pending":  pending,
		},
	})
}

// CreateTodo POST /api/todos - WITH PRIORITY & CATEGORY
func (h *TodoHandler) CreateTodo(c *gin.Context) {
	userId, _ := c.Get("userId")

	var req struct {
		Title    string     `json:"title" binding:"required"`
		Priority string     `json:"priority"`
		Category string     `json:"category"`
		Deadline *time.Time `json:"deadline"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Validasi gagal: " + err.Error(),
		})
		return
	}

	// Default values
	if req.Priority == "" {
		req.Priority = "medium"
	}
	if req.Category == "" {
		req.Category = "personal"
	}

	suggestion, _ := services.GetAISuggestion(req.Title)

	newTodo := models.Todo{
		UserID:     userId.(uint),
		Title:      req.Title,
		Suggestion: suggestion,
		Completed:  false,
		Priority:   req.Priority,
		Category:   req.Category,
		Deadline:   req.Deadline,
	}

	result := h.DB.Create(&newTodo)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Gagal menyimpan todo",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    newTodo,
	})
}

// UpdateTodo - SAMA KAYAK SEBELUMNYA
func (h *TodoHandler) UpdateTodo(c *gin.Context) {
	userId, _ := c.Get("userId")
	id := c.Param("id")

	var req struct {
		Completed bool `json:"completed"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	var todo models.Todo
	result := h.DB.Where("id = ? AND user_id = ?", id, userId).First(&todo)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Todo tidak ditemukan",
		})
		return
	}

	todo.Completed = req.Completed
	h.DB.Save(&todo)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    todo,
	})
}

// DeleteTodo - SAMA
func (h *TodoHandler) DeleteTodo(c *gin.Context) {
	userId, _ := c.Get("userId")
	id := c.Param("id")

	result := h.DB.Where("id = ? AND user_id = ?", id, userId).Delete(&models.Todo{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Todo tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Todo berhasil dihapus",
	})
}

// UpdateFullTodo PUT /api/todos/:id - UPDATE SEMUA FIELD
func (h *TodoHandler) UpdateFullTodo(c *gin.Context) {
	userId, _ := c.Get("userId")
	id := c.Param("id")

	var req struct {
		Title     string `json:"title" binding:"required"`
		Priority  string `json:"priority"`
		Category  string `json:"category"`
		Deadline  string `json:"deadline"`  // TERIMA STRING
		Completed bool   `json:"completed"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Validasi gagal: " + err.Error(),
		})
		return
	}

	// Default values
	if req.Priority == "" {
		req.Priority = "medium"
	}
	if req.Category == "" {
		req.Category = "personal"
	}

	// Cari todo
	var todo models.Todo
	result := h.DB.Where("id = ? AND user_id = ?", id, userId).First(&todo)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Todo tidak ditemukan",
		})
		return
	}

	// PARSE DEADLINE - FIX INI
	var deadline *time.Time
	if req.Deadline != "" {
		// Parse format "2006-01-02T15:04" (tanpa timezone)
		parsedTime, err := time.Parse("2006-01-02T15:04", req.Deadline)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "Format deadline tidak valid. Gunakan format: YYYY-MM-DDTHH:MM",
			})
			return
		}
		deadline = &parsedTime
	}

	// Update fields
	todo.Title = req.Title
	todo.Priority = req.Priority
	todo.Category = req.Category
	todo.Deadline = deadline
	todo.Completed = req.Completed

	h.DB.Save(&todo)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    todo,
	})
}