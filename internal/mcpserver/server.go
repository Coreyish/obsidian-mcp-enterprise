// Package mcpserver wires the Obsidian vault operations to MCP tools.
package mcpserver

import (
	"context"
	"encoding/json"
	"sort"

	"github.com/Coreyish/obsidian-mcp-enterprise/internal/vault"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// New builds an MCP server exposing the vault's note operations as tools. The
// returned server is transport-agnostic; the caller chooses stdio or HTTP.
func New(v *vault.Vault) *server.MCPServer {
	s := server.NewMCPServer(
		"obsidian-mcp-enterprise",
		"0.2.0",
		server.WithToolCapabilities(true),
	)

	registerReadNote(s, v)
	registerWriteNote(s, v)
	registerListNotes(s, v)
	registerSearchNotes(s, v)
	registerGetNoteMetadata(s, v)
	registerUpdateNote(s, v)
	registerAppendToNote(s, v)
	registerDeleteNote(s, v)
	registerGetVaultStats(s, v)

	return s
}

// jsonResult marshals any value into a JSON text tool result.
func jsonResult(v any) (*mcp.CallToolResult, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return mcp.NewToolResultError("failed to encode result: " + err.Error()), nil
	}
	return mcp.NewToolResultText(string(b)), nil
}

func registerReadNote(s *server.MCPServer, v *vault.Vault) {
	tool := mcp.NewTool("read_note",
		mcp.WithDescription("Read the content of an Obsidian note including frontmatter and tags."),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithOpenWorldHintAnnotation(false),
		mcp.WithString("path", mcp.Required(), mcp.Description("Relative path to the note from vault root")),
	)
	s.AddTool(tool, func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		path, err := req.RequireString("path")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		note, err := v.ReadNote(path)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonResult(note)
	})
}

func registerWriteNote(s *server.MCPServer, v *vault.Vault) {
	tool := mcp.NewTool("write_note",
		mcp.WithDescription("Create or overwrite a note. Auto-creates parent directories."),
		mcp.WithOpenWorldHintAnnotation(false),
		mcp.WithString("path", mcp.Required(), mcp.Description("Relative path to the note from vault root")),
		mcp.WithString("content", mcp.Required(), mcp.Description("Full content to write")),
	)
	s.AddTool(tool, func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		path, err := req.RequireString("path")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		content, err := req.RequireString("content")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		written, err := v.WriteNote(path, content)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonResult(map[string]any{"path": written})
	})
}

func registerListNotes(s *server.MCPServer, v *vault.Vault) {
	tool := mcp.NewTool("list_notes",
		mcp.WithDescription("List notes in the vault, optionally scoped to a subdirectory."),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithOpenWorldHintAnnotation(false),
		mcp.WithString("directory", mcp.Description("Optional subdirectory relative to vault root")),
	)
	s.AddTool(tool, func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		notes, err := v.ListNotes(req.GetString("directory", ""))
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonResult(map[string]any{"notes": notes})
	})
}

func registerSearchNotes(s *server.MCPServer, v *vault.Vault) {
	tool := mcp.NewTool("search_notes",
		mcp.WithDescription("Search notes by filename, title, tags, and content."),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithOpenWorldHintAnnotation(false),
		mcp.WithString("query", mcp.Required(), mcp.Description("Search query")),
		mcp.WithNumber("limit", mcp.Description("Maximum number of results (default 50)")),
	)
	s.AddTool(tool, func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		query, err := req.RequireString("query")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		res, err := v.Search(query, req.GetInt("limit", 50))
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonResult(res)
	})
}

func registerGetNoteMetadata(s *server.MCPServer, v *vault.Vault) {
	tool := mcp.NewTool("get_note_metadata",
		mcp.WithDescription("Get metadata and tags for a single note."),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithOpenWorldHintAnnotation(false),
		mcp.WithString("path", mcp.Required(), mcp.Description("Relative path to the note from vault root")),
	)
	s.AddTool(tool, func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		path, err := req.RequireString("path")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		meta, err := v.GetNoteMetadata(path)
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		return jsonResult(meta)
	})
}

func registerUpdateNote(s *server.MCPServer, v *vault.Vault) {
	tool := mcp.NewTool("update_note",
		mcp.WithDescription("Update a note's body, preserving existing frontmatter by default. Creates the note if missing."),
		mcp.WithOpenWorldHintAnnotation(false),
		mcp.WithString("path", mcp.Required(), mcp.Description("Relative path to the note from vault root")),
		mcp.WithString("content", mcp.Required(), mcp.Description("New note body")),
		mcp.WithBoolean("preserveFrontmatter", mcp.Description("Preserve existing frontmatter (default true)")),
	)
	s.AddTool(tool, func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		path, err := req.RequireString("path")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		content, err := req.RequireString("content")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		preserve := req.GetBool("preserveFrontmatter", true)

		if preserve {
			if existing, rerr := v.ReadNote(path); rerr == nil {
				body, _ := vault.ParseFrontmatter(content)
				merged := vault.StringifyFrontmatter(body, existing.Frontmatter)
				if written, werr := v.WriteNote(path, merged); werr == nil {
					return jsonResult(map[string]any{"path": written, "updated": true})
				} else {
					return mcp.NewToolResultError(werr.Error()), nil
				}
			}
		}
		// Note missing (or frontmatter not preserved): write as-is.
		written, werr := v.WriteNote(path, content)
		if werr != nil {
			return mcp.NewToolResultError(werr.Error()), nil
		}
		return jsonResult(map[string]any{"path": written, "updated": preserve})
	})
}

func registerAppendToNote(s *server.MCPServer, v *vault.Vault) {
	tool := mcp.NewTool("append_to_note",
		mcp.WithDescription("Append content to the end of an existing note (creates it if missing)."),
		mcp.WithOpenWorldHintAnnotation(false),
		mcp.WithString("path", mcp.Required(), mcp.Description("Relative path to the note from vault root")),
		mcp.WithString("content", mcp.Required(), mcp.Description("Content to append")),
	)
	s.AddTool(tool, func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		path, err := req.RequireString("path")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		content, err := req.RequireString("content")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		if existing, rerr := v.ReadNote(path); rerr == nil {
			merged := vault.StringifyFrontmatter(existing.Content+"\n\n"+content, existing.Frontmatter)
			if written, werr := v.WriteNote(path, merged); werr == nil {
				return jsonResult(map[string]any{"path": written, "appended": true})
			} else {
				return mcp.NewToolResultError(werr.Error()), nil
			}
		}
		written, werr := v.WriteNote(path, content)
		if werr != nil {
			return mcp.NewToolResultError(werr.Error()), nil
		}
		return jsonResult(map[string]any{"path": written, "appended": false})
	})
}

func registerDeleteNote(s *server.MCPServer, v *vault.Vault) {
	tool := mcp.NewTool("delete_note",
		mcp.WithDescription("Delete a note from the vault."),
		mcp.WithDestructiveHintAnnotation(true),
		mcp.WithOpenWorldHintAnnotation(false),
		mcp.WithString("path", mcp.Required(), mcp.Description("Relative path to the note from vault root")),
	)
	s.AddTool(tool, func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		path, err := req.RequireString("path")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		if err := v.DeleteNote(path); err != nil {
			return jsonResult(map[string]any{"deleted": false, "path": path, "error": err.Error()})
		}
		return jsonResult(map[string]any{"deleted": true, "path": path})
	})
}

func registerGetVaultStats(s *server.MCPServer, v *vault.Vault) {
	tool := mcp.NewTool("get_vault_stats",
		mcp.WithDescription("Get vault-wide statistics: note count, total size, and recent activity."),
		mcp.WithReadOnlyHintAnnotation(true),
		mcp.WithDestructiveHintAnnotation(false),
		mcp.WithOpenWorldHintAnnotation(false),
	)
	s.AddTool(tool, func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		notes, err := v.ListNotes("")
		if err != nil {
			return mcp.NewToolResultError(err.Error()), nil
		}
		sort.Slice(notes, func(i, j int) bool {
			return notes[i].Modified.After(notes[j].Modified)
		})

		var totalSize int64
		for _, n := range notes {
			totalSize += n.Size
		}

		recent := notes
		if len(recent) > 10 {
			recent = recent[:10]
		}
		activity := make([]map[string]any, 0, len(recent))
		for _, n := range recent {
			activity = append(activity, map[string]any{
				"path":     n.Path,
				"title":    n.Title,
				"modified": n.Modified,
				"size":     n.Size,
			})
		}

		return jsonResult(map[string]any{
			"totalNotes":     len(notes),
			"totalSize":      totalSize,
			"recentActivity": activity,
		})
	})
}
