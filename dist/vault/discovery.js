import os from 'os';
import path from 'path';
import fg from 'fast-glob';
export function findObsidianVaults() {
    const candidates = [
        path.join(os.homedir(), 'Documents'),
        path.join(os.homedir(), 'Obsidian'),
        process.env.OBSIDIAN_VAULT_PATH || ''
    ].filter(Boolean);
    const unique = new Set();
    for (const base of candidates) {
        try {
            const matches = fg.sync('**/.obsidian', { cwd: base, absolute: true, dot: true, onlyDirectories: true });
            for (const obsidianDir of matches) {
                unique.add(path.dirname(obsidianDir));
            }
        }
        catch {
            // ignore errors from inaccessible dirs
        }
    }
    return Array.from(unique);
}
export function discoverVault() {
    const env = process.env.OBSIDIAN_VAULT_PATH;
    if (env && env.length > 0)
        return env;
    const found = findObsidianVaults();
    return found[0];
}
//# sourceMappingURL=discovery.js.map