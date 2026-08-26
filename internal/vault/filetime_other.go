//go:build !darwin

package vault

import (
	"os"
	"time"
)

// fileCreated falls back to modification time on platforms without a portable
// birth-time field.
func fileCreated(info os.FileInfo) time.Time {
	return info.ModTime()
}
