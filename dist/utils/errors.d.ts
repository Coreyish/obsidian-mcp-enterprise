export declare class VaultError extends Error {
    code: string;
    context?: Record<string, unknown>;
    constructor(message: string, code: string, context?: Record<string, unknown>);
}
export declare class ValidationError extends Error {
    constructor(message: string);
}
