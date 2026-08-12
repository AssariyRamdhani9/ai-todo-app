package handlers

import (
	"ai-todo-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	DB *gorm.DB
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{DB: db}
}

// GetDashboardStats GET /api/dashboard/stats
func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
	userId, _ := c.Get("userId")
	now := time.Now()

	// Total stats
	var total, completed, pending, overdue int64
	h.DB.Model(&models.Todo{}).Where("user_id = ?", userId).Count(&total)
	h.DB.Model(&models.Todo{}).Where("user_id = ? AND completed = ?", userId, true).Count(&completed)
	pending = total - completed

	// Overdue: pending + deadline < now
	h.DB.Model(&models.Todo{}).
		Where("user_id = ? AND completed = ? AND deadline IS NOT NULL AND deadline < ?", userId, false, now).
		Count(&overdue)

	// Category distribution
	type CategoryCount struct {
		Category string `json:"category"`
		Count    int64  `json:"count"`
	}
	var categoryDistribution []CategoryCount
	h.DB.Model(&models.Todo{}).
		Select("category, COUNT(*) as count").
		Where("user_id = ?", userId).
		Group("category").
		Scan(&categoryDistribution)

	// Priority distribution
	type PriorityCount struct {
		Priority string `json:"priority"`
		Count    int64  `json:"count"`
	}
	var priorityDistribution []PriorityCount
	h.DB.Model(&models.Todo{}).
		Select("priority, COUNT(*) as count").
		Where("user_id = ?", userId).
		Group("priority").
		Scan(&priorityDistribution)

	// Completion rate (percentage)
	completionRate := float64(0)
	if total > 0 {
		completionRate = float64(completed) / float64(total) * 100
	}

	// Recent activity (last 5 todos)
	var recentTodos []models.Todo
	h.DB.Where("user_id = ?", userId).
		Order("created_at DESC").
		Limit(5).
		Find(&recentTodos)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total":     total,
			"completed": completed,
			"pending":   pending,
			"overdue":   overdue,
			"completionRate": gin.H{
				"value": completionRate,
				"label": "Completion Rate",
			},
			"categoryDistribution":  categoryDistribution,
			"priorityDistribution": priorityDistribution,
			"recentActivity":        recentTodos,
		},
	})
}

// GetWeeklyProgress GET /api/dashboard/weekly
func (h *DashboardHandler) GetWeeklyProgress(c *gin.Context) {
    userId, _ := c.Get("userId")
    now := time.Now()
    
    // ❌ Baris weekAgo := now.AddDate(0, 0, -7) DIHAPUS dari sini karena tidak terpakai

    type DailyProgress struct {
        Date  string `json:"date"`
        Total int64  `json:"total"`
        Done  int64  `json:"done"`
    }

    var progress []DailyProgress

    // Query untuk 7 hari terakhir
    for i := 6; i >= 0; i-- {
        day := now.AddDate(0, 0, -i)
        startOfDay := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, day.Location())
        endOfDay := startOfDay.AddDate(0, 0, 1)

        var total, done int64
        h.DB.Model(&models.Todo{}).
            Where("user_id = ? AND created_at >= ? AND created_at < ?", userId, startOfDay, endOfDay).
            Count(&total)
        h.DB.Model(&models.Todo{}).
            Where("user_id = ? AND completed = ? AND created_at >= ? AND created_at < ?", userId, true, startOfDay, endOfDay).
            Count(&done)

        progress = append(progress, DailyProgress{
            Date:  day.Format("Mon"),
            Total: total,
            Done:  done,
        })
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    progress,
    })
}