// Command obsidian-mcp-enterprise is an MCP server exposing an Obsidian vault
// over either the stdio or Streamable HTTP transport.
package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/Coreyish/obsidian-mcp-enterprise/internal/config"
	"github.com/Coreyish/obsidian-mcp-enterprise/internal/mcpserver"
	"github.com/Coreyish/obsidian-mcp-enterprise/internal/vault"
	"github.com/mark3labs/mcp-go/server"
)

func main() {
	cfg := config.Load()

	transport := flag.String("transport", cfg.Transport, "transport to serve: stdio or http")
	httpAddr := flag.String("http-addr", cfg.HTTPAddr, "listen address for the http transport")
	vaultPath := flag.String("vault", cfg.VaultPath, "path to the Obsidian vault (overrides OBSIDIAN_VAULT_PATH)")
	flag.Parse()

	path := *vaultPath
	if path == "" {
		path = vault.DiscoverVault()
	}
	if path == "" {
		log.Fatal("no Obsidian vault found: set OBSIDIAN_VAULT_PATH, pass --vault, or place a .obsidian folder under ~/Documents or ~/Obsidian")
	}

	v, err := vault.New(path)
	if err != nil {
		log.Fatalf("vault error: %v", err)
	}
	if err := v.Initialize(); err != nil {
		log.Fatalf("failed to initialize vault: %v", err)
	}

	s := mcpserver.New(v)

	switch *transport {
	case "stdio":
		fmt.Fprintf(os.Stderr, "obsidian-mcp-enterprise: serving %s over stdio\n", v.Path())
		if err := server.ServeStdio(s); err != nil {
			log.Fatalf("stdio server error: %v", err)
		}
	case "http", "streamable-http":
		fmt.Fprintf(os.Stderr, "obsidian-mcp-enterprise: serving %s over Streamable HTTP on %s\n", v.Path(), *httpAddr)
		httpServer := server.NewStreamableHTTPServer(s)
		if err := httpServer.Start(*httpAddr); err != nil {
			log.Fatalf("http server error: %v", err)
		}
	default:
		log.Fatalf("unknown transport %q (use \"stdio\" or \"http\")", *transport)
	}
}
