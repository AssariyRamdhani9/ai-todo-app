package middleware


import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ambil token dari header Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Token diperlukan",
			})
			c.Abort()
			return
		}

		// Format: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Format token invalid",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Verifikasi token
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "rahasia_default_ganti_di_production"
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Token tidak valid atau kadaluarsa",
			})
			c.Abort()
			return
		}

		// Ambil userId dari token
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Token invalid",
			})
			c.Abort()
			return
		}

		userId, ok := claims["userId"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "User ID tidak ditemukan di token",
			})
			c.Abort()
			return
		}

		// Simpan userId di context
		c.Set("userId", uint(userId))
		c.Next()
	}
}