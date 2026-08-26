package vault

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// Vault provides safe read/write/search access to an Obsidian vault directory.
type Vault struct {
	path   string
	search *SearchEngine
}

// New creates a Vault rooted at path. Call Initialize before use.
func New(path string) (*Vault, error) {
	if path == "" {
		return nil, errors.New("vault path is required; set OBSIDIAN_VAULT_PATH or pass --vault")
	}
	abs, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}
	return &Vault{path: abs}, nil
}

// Path returns the absolute vault root.
func (v *Vault) Path() string { return v.path }

// Initialize validates the vault path and builds the search index.
func (v *Vault) Initialize() error {
	info, err := os.Stat(v.path)
	if err != nil {
		return fmt.Errorf("vault path does not exist or is inaccessible: %s", v.path)
	}
	if !info.IsDir() {
		return fmt.Errorf("vault path is not a directory: %s", v.path)
	}
	notes, err := v.walkNotes(v.path)
	if err != nil {
		return err
	}
	v.search = NewSearchEngine(v.path, notes)
	return nil
}

// resolve joins a vault-relative path and guarantees it stays inside the vault,
// guarding against path-traversal (e.g. "../../etc/passwd").
func (v *Vault) resolve(notePath string) (string, error) {
	clean := filepath.Clean("/" + strings.TrimPrefix(filepath.ToSlash(notePath), "/"))
	full := filepath.Join(v.path, filepath.FromSlash(clean))
	rel, err := filepath.Rel(v.path, full)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(os.PathSeparator)) {
		return "", fmt.Errorf("path escapes vault: %s", notePath)
	}
	return full, nil
}

// walkNotes indexes all Markdown files under root, skipping hidden directories.
func (v *Vault) walkNotes(root string) ([]NoteMetadata, error) {
	notes := []NoteMetadata{}
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			if path != v.path && strings.HasPrefix(d.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(strings.ToLower(d.Name()), ".md") {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return nil
		}
		rel, err := filepath.Rel(v.path, path)
		if err != nil {
			return nil
		}
		notes = append(notes, NoteMetadata{
			Path:     filepath.ToSlash(rel),
			Filename: d.Name(),
			Title:    titleFromFilename(d.Name()),
			Tags:     []string{},
			Size:     info.Size(),
			Modified: info.ModTime(),
		})
		return nil
	})
	return notes, err
}

// ReadNote reads a note's content, frontmatter, tags, and stats.
func (v *Vault) ReadNote(notePath string) (*NoteContent, error) {
	full, err := v.resolve(notePath)
	if err != nil {
		return nil, err
	}
	raw, err := os.ReadFile(full)
	if err != nil {
		return nil, fmt.Errorf("note not found: %s (ensure the path is relative to the vault and ends in .md)", notePath)
	}
	body, data := ParseFrontmatter(string(raw))
	tags := MergeTags(data, ExtractTagsFromContent(string(raw)))
	info, err := os.Stat(full)
	if err != nil {
		return nil, err
	}
	return &NoteContent{
		Content:     body,
		Frontmatter: data,
		Tags:        tags,
		Path:        notePath,
		Stats: FileStats{
			Size:     info.Size(),
			Created:  fileCreated(info),
			Modified: info.ModTime(),
		},
	}, nil
}

// WriteNote creates or overwrites a note, creating parent directories.
func (v *Vault) WriteNote(notePath, content string) (string, error) {
	full, err := v.resolve(notePath)
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", fmt.Errorf("failed to create directory for note: %w", err)
	}
	if err := os.WriteFile(full, []byte(content), 0o644); err != nil {
		return "", fmt.Errorf("failed to write note: %w", err)
	}
	return notePath, nil
}

// ListNotes lists notes across the vault or within an optional subdirectory.
func (v *Vault) ListNotes(directory string) ([]NoteMetadata, error) {
	root := v.path
	if directory != "" {
		r, err := v.resolve(directory)
		if err != nil {
			return nil, err
		}
		root = r
	}
	return v.walkNotes(root)
}

// GetNoteMetadata returns metadata and tags for a single note.
func (v *Vault) GetNoteMetadata(notePath string) (*NoteMetadata, error) {
	full, err := v.resolve(notePath)
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(full)
	if err != nil {
		return nil, fmt.Errorf("failed to read note metadata: %s", notePath)
	}
	raw, err := os.ReadFile(full)
	if err != nil {
		return nil, fmt.Errorf("failed to read note metadata: %s", notePath)
	}
	_, data := ParseFrontmatter(string(raw))
	tags := MergeTags(data, ExtractTagsFromContent(string(raw)))
	return &NoteMetadata{
		Path:     notePath,
		Filename: filepath.Base(notePath),
		Title:    titleFromFilename(filepath.Base(notePath)),
		Tags:     tags,
		Size:     info.Size(),
		Modified: info.ModTime(),
	}, nil
}

// DeleteNote removes a note from the vault.
func (v *Vault) DeleteNote(notePath string) error {
	full, err := v.resolve(notePath)
	if err != nil {
		return err
	}
	return os.Remove(full)
}

// Search runs a combined filename + content search, lazily initializing the
// index if needed.
func (v *Vault) Search(query string, limit int) (*SearchResponse, error) {
	if limit <= 0 {
		limit = 50
	}
	if v.search == nil {
		if err := v.Initialize(); err != nil {
			return nil, err
		}
	}
	return v.search.Search(query, limit), nil
}
