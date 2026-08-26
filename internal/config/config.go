package config

import (
	"os"
	"strconv"
)

// Config holds runtime settings sourced from environment variables. Command
// line flags may override these at startup.
type Config struct {
	VaultPath        string
	MaxSearchResults int
	LogLevel         string
	Transport        string // stdio | http
	HTTPAddr         string
}

// Load reads configuration from the environment, applying defaults.
func Load() Config {
	return Config{
		VaultPath:        os.Getenv("OBSIDIAN_VAULT_PATH"),
		MaxSearchResults: envInt("MAX_SEARCH_RESULTS", 50),
		LogLevel:         envStr("LOG_LEVEL", "info"),
		Transport:        envStr("MCP_TRANSPORT", "stdio"),
		HTTPAddr:         envStr("MCP_HTTP_ADDR", ":8080"),
	}
}

func envStr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}
