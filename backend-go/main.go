package main

import (
	"log"
	"os"

	"ai-todo-backend/handlers"
	"ai-todo-backend/middleware" // <-- Tambahkan ini
	"ai-todo-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ .env not found, using default values")
	}

	// Koneksi Database
	dbHost := os.Getenv("DB_HOST")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbPort := os.Getenv("DB_PORT")

	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbUser == "" {
		dbUser = "postgres"
	}
	if dbPassword == "" {
		dbPassword = "postgres"
	}
	if dbName == "" {
		dbName = "todo_app_ai"
	}
	if dbPort == "" {
		dbPort = "5432"
	}

	dsn := "host=" + dbHost +
		" user=" + dbUser +
		" password=" + dbPassword +
		" dbname=" + dbName +
		" port=" + dbPort +
		" sslmode=disable"

	log.Printf("📡 Connecting to: host=%s dbname=%s user=%s", dbHost, dbName, dbUser)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Gagal konek ke PostgreSQL:", err)
	}

	// Auto migrate - TAMBAHKAN USER MODEL
	err = db.AutoMigrate(&models.User{}, &models.Todo{}) // <-- Tambahkan User
	if err != nil {
		log.Fatal("❌ Gagal migrate database:", err)
	}
	log.Println("✅ Database PostgreSQL connected & migrated!")

	// Setup Gin
	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Mengizinkan semua frontend (misal: localhost:3000)
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"}, // <-- Wajib ada Authorization untuk JWT!
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "OK",
			"message": "AI Todo Backend Running with PostgreSQL! 🚀",
		})
	})

	// AUTH HANDLER
	authHandler := handlers.NewAuthHandler(db)

	// AUTH ROUTES (Public)
	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
	}

	// DASHBOARD HANDLER
		dashboardHandler := handlers.NewDashboardHandler(db)

		// DASHBOARD ROUTES (Protected)
		dashboardGroup := r.Group("/api/dashboard")
		dashboardGroup.Use(middleware.AuthMiddleware())
		{
			dashboardGroup.GET("/stats", dashboardHandler.GetDashboardStats)
			dashboardGroup.GET("/weekly", dashboardHandler.GetWeeklyProgress)
		}

	// TODO HANDLER
	todoHandler := handlers.NewTodoHandler(db)
	// TODO HANDLER


  

	// TODO ROUTES (Protected by Auth)
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware()) // ✅ BENAR: Tanpa tanda kurung ()
	{
		api.GET("/todos", todoHandler.GetAllTodos)
		api.POST("/todos", todoHandler.CreateTodo)
		api.PUT("/todos/:id", todoHandler.UpdateTodo)
		api.DELETE("/todos/:id", todoHandler.DeleteTodo)          // Toggle completed (existing)
		api.PUT("/todos/:id/full", todoHandler.UpdateFullTodo) 

	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("🚀 Backend running at http://localhost:%s", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("❌ Failed to start server:", err)
	}
}
