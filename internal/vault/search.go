package vault

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/sahilm/fuzzy"
)

// SearchEngine performs fuzzy filename/title/tag matching plus substring
// content matching over an in-memory note index.
type SearchEngine struct {
	vaultPath string
	notes     []NoteMetadata
	targets   []string
}

// NewSearchEngine builds an engine over the given note index.
func NewSearchEngine(vaultPath string, notes []NoteMetadata) *SearchEngine {
	e := &SearchEngine{vaultPath: vaultPath, notes: notes}
	e.rebuildTargets()
	return e
}

// UpdateIndex replaces the note collection.
func (e *SearchEngine) UpdateIndex(notes []NoteMetadata) {
	e.notes = notes
	e.rebuildTargets()
}

func (e *SearchEngine) rebuildTargets() {
	e.targets = make([]string, len(e.notes))
	for i, n := range e.notes {
		e.targets[i] = n.Filename + " " + n.Title + " " + strings.Join(n.Tags, " ")
	}
}

// Search combines filename and content matches, ranked by relevance.
func (e *SearchEngine) Search(query string, limit int) *SearchResponse {
	start := time.Now()

	filenameResults := e.searchFilenames(query, limit)
	contentResults := e.searchContent(query, limit)
	combined := mergeAndRank(filenameResults, contentResults, limit)

	return &SearchResponse{
		Results:      combined,
		TotalResults: len(combined),
		SearchTime:   time.Since(start).Milliseconds(),
	}
}

func (e *SearchEngine) searchFilenames(query string, limit int) []SearchResultItem {
	out := []SearchResultItem{}
	matches := fuzzy.Find(query, e.targets)
	for i, m := range matches {
		if i >= limit {
			break
		}
		n := e.notes[m.Index]
		title := n.Title
		if title == "" {
			title = n.Filename
		}
		out = append(out, SearchResultItem{
			Path:  n.Path,
			Title: title,
			// Higher rank -> higher relevance; keep top hits above the fixed
			// content-match score (0.75) so exact title matches win.
			RelevanceScore: 1.0 / (1.0 + float64(i)*0.5),
			MatchType:      "filename",
		})
	}
	return out
}

func (e *SearchEngine) searchContent(query string, limit int) []SearchResultItem {
	lower := strings.ToLower(query)
	out := []SearchResultItem{}
	for _, n := range e.notes {
		if len(out) >= limit {
			break
		}
		raw, err := os.ReadFile(filepath.Join(e.vaultPath, filepath.FromSlash(n.Path)))
		if err != nil {
			continue
		}
		text := string(raw)
		idx := strings.Index(strings.ToLower(text), lower)
		if idx == -1 {
			continue
		}
		title := n.Title
		if title == "" {
			title = n.Filename
		}
		out = append(out, SearchResultItem{
			Path:           n.Path,
			Title:          title,
			Excerpt:        buildExcerpt(text, idx, len(query)),
			RelevanceScore: 0.75,
			MatchType:      "content",
		})
	}
	return out
}

func buildExcerpt(content string, index, matchLen int) string {
	start := index - 60
	if start < 0 {
		start = 0
	}
	end := index + matchLen + 60
	if end > len(content) {
		end = len(content)
	}
	prefix := ""
	if start > 0 {
		prefix = "…"
	}
	suffix := ""
	if end < len(content) {
		suffix = "…"
	}
	snippet := strings.ReplaceAll(content[start:end], "\n", " ")
	return prefix + snippet + suffix
}

func mergeAndRank(a, b []SearchResultItem, limit int) []SearchResultItem {
	byPath := map[string]SearchResultItem{}
	for _, r := range a {
		if ex, ok := byPath[r.Path]; !ok || r.RelevanceScore > ex.RelevanceScore {
			byPath[r.Path] = r
		}
	}
	for _, r := range b {
		if ex, ok := byPath[r.Path]; !ok || r.RelevanceScore > ex.RelevanceScore {
			byPath[r.Path] = r
		}
	}
	out := make([]SearchResultItem, 0, len(byPath))
	for _, r := range byPath {
		out = append(out, r)
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].RelevanceScore > out[j].RelevanceScore
	})
	if len(out) > limit {
		out = out[:limit]
	}
	return out
}
