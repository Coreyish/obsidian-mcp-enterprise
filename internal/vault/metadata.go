package vault

import (
	"fmt"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

var (
	frontmatterRegex = regexp.MustCompile(`(?s)^---\s*\n(.*?)\n---\s*\n?(.*)$`)
	tagRegex         = regexp.MustCompile(`(^|\s)#([\w\-/]+)`)
)

// ParseFrontmatter splits YAML frontmatter from the note body. If no
// frontmatter is present the raw content is returned with an empty map.
func ParseFrontmatter(raw string) (content string, data map[string]any) {
	data = map[string]any{}
	raw = strings.ReplaceAll(raw, "\r\n", "\n")
	m := frontmatterRegex.FindStringSubmatch(raw)
	if m == nil {
		return raw, data
	}
	_ = yaml.Unmarshal([]byte(m[1]), &data)
	if data == nil {
		data = map[string]any{}
	}
	return m[2], data
}

// StringifyFrontmatter serializes frontmatter back into a note. When the map
// is empty the body is returned unchanged.
func StringifyFrontmatter(content string, data map[string]any) string {
	if len(data) == 0 {
		return content
	}
	b, err := yaml.Marshal(data)
	if err != nil {
		return content
	}
	return "---\n" + string(b) + "---\n" + content
}

// ExtractTagsFromContent finds inline #tags in the note body.
func ExtractTagsFromContent(content string) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, m := range tagRegex.FindAllStringSubmatch(content, -1) {
		tag := m[2]
		if !seen[tag] {
			seen[tag] = true
			out = append(out, tag)
		}
	}
	return out
}

// MergeTags combines frontmatter tags (list or comma string) with inline tags,
// deduplicating while preserving order.
func MergeTags(frontmatter map[string]any, contentTags []string) []string {
	seen := map[string]bool{}
	out := []string{}
	add := func(t string) {
		t = strings.TrimSpace(t)
		if t != "" && !seen[t] {
			seen[t] = true
			out = append(out, t)
		}
	}

	switch v := frontmatter["tags"].(type) {
	case []any:
		for _, e := range v {
			add(fmt.Sprintf("%v", e))
		}
	case []string:
		for _, e := range v {
			add(e)
		}
	case string:
		for _, e := range strings.Split(v, ",") {
			add(e)
		}
	}
	for _, t := range contentTags {
		add(t)
	}
	return out
}

// titleFromFilename derives a display title from a note filename.
func titleFromFilename(filename string) string {
	base := strings.TrimSuffix(filename, ".md")
	base = strings.TrimSuffix(base, ".MD")
	base = strings.NewReplacer("-", " ", "_", " ").Replace(base)
	return strings.TrimSpace(base)
}
