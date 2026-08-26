package vault

import "time"

// FileStats holds filesystem metadata for a note.
type FileStats struct {
	Size     int64     `json:"size"`
	Created  time.Time `json:"created"`
	Modified time.Time `json:"modified"`
}

// NoteContent is a note's body plus parsed frontmatter and tags.
type NoteContent struct {
	Content     string         `json:"content"`
	Frontmatter map[string]any `json:"frontmatter"`
	Tags        []string       `json:"tags"`
	Path        string         `json:"path"`
	Stats       FileStats      `json:"stats"`
}

// NoteMetadata is the lightweight index entry for a note.
type NoteMetadata struct {
	Path     string    `json:"path"`
	Filename string    `json:"filename"`
	Title    string    `json:"title"`
	Tags     []string  `json:"tags"`
	Size     int64     `json:"size"`
	Modified time.Time `json:"modified"`
}

// SearchResultItem is a single ranked search hit.
type SearchResultItem struct {
	Path           string  `json:"path"`
	Title          string  `json:"title"`
	Excerpt        string  `json:"excerpt"`
	RelevanceScore float64 `json:"relevanceScore"`
	MatchType      string  `json:"matchType"` // filename | content | tag
}

// SearchResponse is the full response for a search query.
type SearchResponse struct {
	Results      []SearchResultItem `json:"results"`
	TotalResults int                `json:"totalResults"`
	SearchTime   int64              `json:"searchTime"` // milliseconds
}
