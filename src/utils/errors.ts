export class VaultError extends Error {
    public code: string;
    public context?: Record<string, unknown>;

    constructor(message: string, code: string, context?: Record<string, unknown>) {
        super(message);
        this.name = 'VaultError';
        this.code = code;
        this.context = context;
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}


