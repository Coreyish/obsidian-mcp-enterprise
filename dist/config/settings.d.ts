import { z } from 'zod';
declare const ConfigSchema: z.ZodObject<{
    vaultPath: z.ZodOptional<z.ZodString>;
    maxSearchResults: z.ZodDefault<z.ZodNumber>;
    searchTimeoutMs: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
}, "strip", z.ZodTypeAny, {
    maxSearchResults: number;
    searchTimeoutMs: number;
    logLevel: "info" | "error" | "debug" | "warn";
    vaultPath?: string | undefined;
}, {
    vaultPath?: string | undefined;
    maxSearchResults?: number | undefined;
    searchTimeoutMs?: number | undefined;
    logLevel?: "info" | "error" | "debug" | "warn" | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare function loadConfig(): Config;
export {};
