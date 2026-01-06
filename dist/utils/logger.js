import winston from 'winston';
const { combine, timestamp, json, splat, errors } = winston.format;
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), errors({ stack: true }), splat(), json()),
    transports: [
        new winston.transports.Console()
    ]
});
export function logDuration(label, fn) {
    const start = Date.now();
    return fn().finally(() => {
        const duration = Date.now() - start;
        logger.debug('duration', { label, duration });
    });
}
//# sourceMappingURL=logger.js.map