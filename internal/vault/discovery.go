package vault

import (
	"io/fs"
	"os"
	"path/filepath"
)

// DiscoverVault resolves a vault path from the environment, falling back to
// scanning common locations for an Obsidian ".obsidian" directory.
func DiscoverVault() string {
	if env := os.Getenv("OBSIDIAN_VAULT_PATH"); env != "" {
		return env
	}
	if found := FindObsidianVaults(); len(found) > 0 {
		return found[0]
	}
	return ""
}

// FindObsidianVaults scans ~/Documents, ~/Obsidian, and OBSIDIAN_VAULT_PATH for
// directories containing a ".obsidian" folder.
func FindObsidianVaults() []string {
	home, _ := os.UserHomeDir()
	bases := []string{
		filepath.Join(home, "Documents"),
		filepath.Join(home, "Obsidian"),
	}
	if env := os.Getenv("OBSIDIAN_VAULT_PATH"); env != "" {
		bases = append(bases, env)
	}

	seen := map[string]bool{}
	out := []string{}
	for _, base := range bases {
		if base == "" {
			continue
		}
		_ = filepath.WalkDir(base, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return nil // skip inaccessible entries
			}
			if d.IsDir() && d.Name() == ".obsidian" {
				vaultDir := filepath.Dir(path)
				if !seen[vaultDir] {
					seen[vaultDir] = true
					out = append(out, vaultDir)
				}
				return filepath.SkipDir
			}
			return nil
		})
	}
	return out
}
