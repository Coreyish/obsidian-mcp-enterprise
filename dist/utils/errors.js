export class VaultError extends Error {
    code;
    context;
    constructor(message, code, context) {
        super(message);
        this.name = 'VaultError';
        this.code = code;
        this.context = context;
    }
}
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
//# sourceMappingURL=errors.js.map