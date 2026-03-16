# Obsidian MCP Enterprise

> ⚠️ **Work in progress** — this repository is still under active development and is not a complete production-ready project.

A lightweight, **enterprise-grade MCP server** for Obsidian vaults. This project exposes Obsidian notes through the **Model Context Protocol (MCP)** so that LLM agents and other MCP-aware clients can read, write, search, and manage notes. Testing new MCP capability to provide context and "memories" faster !


---

## Main Features

- Exposes an Obsidian vault over **MCP (Model Context Protocol)**
- Supports common note operations:
  - Read / write notes (including frontmatter)
  - List notes and metadata
  - Search notes by filename, content, and tags
  - Append, update, and delete notes
  - Vault stats (note count, size, recent activity)
- Designed for **Node.js (>= 18.18)** and TypeScript

---

## 🚀 Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Point to your Obsidian vault

The server will automatically discover a vault in the current working directory, but you can also explicitly set it with an environment variable:

```bash
export OBSIDIAN_VAULT_PATH="/path/to/your/vault"
```

### 3) Run in development mode

```bash
npm run dev
```

### 4) Build and run the compiled server

```bash
npm run build
npm start
```

---

## 🧰 Exposed MCP Tools

This server registers the following MCP tools (via `@modelcontextprotocol/sdk`):

- `read_note` — read note content + frontmatter
- `write_note` — create or overwrite a note
- `list_notes` — list notes (optionally within a directory)
- `search_notes` — search by filename/content/tags
- `get_note_metadata` — fetch metadata for a single note
- `update_note` — update a note, optionally preserving frontmatter
- `append_to_note` — append text to an existing note
- `delete_note` — delete a note from the vault
- `get_vault_stats` — vault-wide stats (count, size, recent activity)

---

## 🧩 Packaging

This project is shipped as an npm package and exports a CLI:

- `obsidian-mcp-enterprise` (from `dist/cli.js`)

---

## 📝 Notes (WIP)

- This project is written in TypeScript and compiled to `dist/`.
- Ensure `node >= 18.18` is used (required by the MCP SDK that i'm working with).
- The API tool behavior may change as development continues.
- Some edge cases, validation, and error handling are still being improved.

---

## 📄 License

MIT
