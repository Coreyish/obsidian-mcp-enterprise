# Obsidian MCP

> ⚠️ **Work in progress** — under active development.

A lightweight, **MCP server** for Obsidian vaults, written in **Go**. It exposes Obsidian notes over the **Model Context Protocol (MCP)** so that LLM agents and other MCP-aware clients can read, write, search, and manage notes — giving an agent fast, structured "memory" backed by your vault.

Ships as a **single static binary** and can serve over either **stdio** (local subprocess) or **Streamable HTTP** (networked).

---

## Features

- Exposes an Obsidian vault over **MCP**
- Two transports, selectable at runtime: **stdio** and **Streamable HTTP**
- Common note operations:
  - Read / write notes (including frontmatter)
  - List notes and metadata
  - Search by filename, title, tags, and content
  - Append, update, and delete notes
  - Vault stats (note count, total size, recent activity)
- **Path-traversal protection** — note paths cannot escape the vault root
- Single dependency-free binary; no runtime to install

---

## Requirements

- **Go 1.23+** (only to build; the resulting binary is standalone)

---

## Quick Start

### 1) Build

```bash
go build -o obsidian-mcp-enterprise .
```

### 2) Point to your vault

The server auto-discovers a vault (scanning `~/Documents` and `~/Obsidian` for a
`.obsidian` folder), or you can set it explicitly:

```bash
export OBSIDIAN_VAULT_PATH="/path/to/your/vault"
```

### 3) Run

**stdio** (default — for local clients like Claude Desktop / Cursor):

```bash
./obsidian-mcp-enterprise --transport stdio
```

**Streamable HTTP** (for networked / hosted use):

```bash
./obsidian-mcp-enterprise --transport http --http-addr :8080
# MCP endpoint: http://localhost:8080/mcp
```

---

## Configuration

Settings come from flags (which override) and environment variables:

| Flag | Env var | Default | Description |
|------|---------|---------|-------------|
| `--transport` | `MCP_TRANSPORT` | `stdio` | `stdio` or `http` |
| `--http-addr` | `MCP_HTTP_ADDR` | `:8080` | Listen address for HTTP transport |
| `--vault` | `OBSIDIAN_VAULT_PATH` | auto-discover | Path to the Obsidian vault |
| — | `MAX_SEARCH_RESULTS` | `50` | Default search result cap |
| — | `LOG_LEVEL` | `info` | Log verbosity |

---

## Exposed MCP Tools

- `read_note` — read note content + frontmatter + tags
- `write_note` — create or overwrite a note
- `list_notes` — list notes (optionally within a directory)
- `search_notes` — search by filename/title/tags/content
- `get_note_metadata` — metadata for a single note
- `update_note` — update a note, preserving frontmatter by default
- `append_to_note` — append text to an existing note
- `delete_note` — delete a note
- `get_vault_stats` — vault-wide stats

---

## Project Layout

```
main.go                     entrypoint; flag parsing + transport selection
internal/
  config/    config.go      env-var configuration
  vault/     types.go       core structs
             metadata.go    frontmatter + tag parsing
             discovery.go   vault auto-discovery
             operations.go  read/write/list/delete (+ path-traversal guard)
             search.go      fuzzy filename + substring content search
  mcpserver/ server.go      MCP tool registration
```

---

## License

MIT
