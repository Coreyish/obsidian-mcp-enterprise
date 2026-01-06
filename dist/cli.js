#!/usr/bin/env node
import { startServerStdio } from './server.js';
async function main() {
    await startServerStdio();
    // eslint-disable-next-line no-console
    console.error('Obsidian MCP Enterprise server started');
}
main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err?.stack || String(err));
    process.exit(1);
});
//# sourceMappingURL=cli.js.map