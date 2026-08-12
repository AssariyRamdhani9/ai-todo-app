package models

import (
	"time"
	"gorm.io/gorm"
)

type Todo struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"userId" gorm:"index;not null"` // <-- TAMBAHKAN INI
	Title       string         `json:"title"`
	Suggestion  string         `json:"suggestion"`
	Completed   bool           `json:"completed"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Priority    string         `json:"priority" gorm:"default:'medium'"` // high, medium, low
	Category    string         `json:"category" gorm:"default:'personal'"`
	Deadline    *time.Time     `json:"deadline,omitempty"`
}

// MODEL USER - TAMBAHKAN
type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"unique;not null"`
	Email     string         `json:"email" gorm:"unique;not null"`
	Password  string         `json:"-" gorm:"not null"` // "-" = gak ditampilkan di JSON
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	Todos     []Todo         `json:"todos,omitempty" gorm:"foreignKey:UserID"`
}