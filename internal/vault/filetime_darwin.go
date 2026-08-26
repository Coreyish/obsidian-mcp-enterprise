//go:build darwin

package vault

import (
	"os"
	"syscall"
	"time"
)

// fileCreated returns the file's birth time on macOS, falling back to mtime.
func fileCreated(info os.FileInfo) time.Time {
	if st, ok := info.Sys().(*syscall.Stat_t); ok {
		return time.Unix(st.Birthtimespec.Sec, st.Birthtimespec.Nsec)
	}
	return info.ModTime()
}
