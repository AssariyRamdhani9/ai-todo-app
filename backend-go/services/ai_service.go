package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

type GroqRequest struct {
	Messages []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"messages"`
	Model       string  `json:"model"`
	Temperature float64 `json:"temperature"`
	MaxTokens   int     `json:"max_tokens"`
}

type GroqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error struct {
		Message string `json:"message"`
	} `json:"error"`
}

func GetAISuggestion(taskTitle string) (string, error) {
	apiKey := os.Getenv("GROQ_API_KEY")

	// LOG API KEY (Cuma buat debugging)
	log.Printf("🔑 API Key length: %d", len(apiKey))

	if apiKey == "" {
		log.Println("❌ API Key kosong!")
		return "💡 Coba mulai dengan langkah kecil hari ini!", nil
	}

	url := "https://api.groq.com/openai/v1/chat/completions"

	requestBody := GroqRequest{
		Messages: []struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		}{
			{
				Role: "system",
				Content: `Kamu adalah asisten produktivitas yang ahli memberikan tips praktis. 
Berikan saran singkat (maksimal 20 kata) tentang cara menyelesaikan tugas 
dengan efisien. Jawab dalam bahasa Indonesia dengan nada positif dan 
mendukung.`,
			},
			{
				Role:    "user",
				Content: fmt.Sprintf("Tugas: %s", taskTitle),
			},
		},
		Model:       "llama-3.1-8b-instant",
		Temperature: 0.7,
		MaxTokens:   80,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		log.Println("❌ Error marshaling:", err)
		return "💡 Fokus pada satu langkah kecil sekarang!", nil
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println("❌ Error creating request:", err)
		return "💡 Fokus pada satu langkah kecil sekarang!", nil
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("❌ Error calling Groq API:", err)
		return "💡 Fokus pada satu langkah kecil sekarang!", nil
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("❌ Error reading response:", err)
		return "💡 Fokus pada satu langkah kecil sekarang!", nil
	}

	// LOG response status dan body
	log.Printf("📡 Groq API Status: %d", resp.StatusCode)
	log.Printf("📡 Response: %s", string(body))

	var groqResp GroqResponse
	err = json.Unmarshal(body, &groqResp)
	if err != nil {
		log.Println("❌ Error unmarshaling:", err)
		return "💡 Fokus pada satu langkah kecil sekarang!", nil
	}

	// Cek error dari Groq
	if groqResp.Error.Message != "" {
		log.Printf("❌ Groq Error: %s", groqResp.Error.Message)
		return "💡 Fokus pada satu langkah kecil sekarang!", nil
	}

	if len(groqResp.Choices) > 0 {
		suggestion := groqResp.Choices[0].Message.Content
		log.Printf("✅ AI Suggestion: %s", suggestion)
		return suggestion, nil
	}

	return "💡 Coba mulai dengan langkah kecil hari ini!", nil
}
