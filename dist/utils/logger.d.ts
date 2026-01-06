import winston from 'winston';
export declare const logger: winston.Logger;
export declare function logDuration<T>(label: string, fn: () => Promise<T>): Promise<T>;
