import { z } from 'zod';

const ConfigSchema = z.object({
    vaultPath: z.string().optional(),
    maxSearchResults: z.number().int().positive().default(50),
    searchTimeoutMs: z.number().int().positive().default(5000),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
    const raw = {
        vaultPath: process.env.OBSIDIAN_VAULT_PATH,
        maxSearchResults: parseInt(process.env.MAX_SEARCH_RESULTS || '50', 10),
        searchTimeoutMs: parseInt(process.env.SEARCH_TIMEOUT_MS || '5000', 10),
        logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info'
    };
    return ConfigSchema.parse(raw);
}


