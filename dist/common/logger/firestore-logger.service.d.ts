import { LoggerService } from '@nestjs/common';
import * as admin from 'firebase-admin';
export declare class FirestoreLogger implements LoggerService {
    private firebaseAdmin;
    private static db;
    private static isIntercepting;
    private static logBuffer;
    private static flushTimeout;
    constructor(firebaseAdmin: admin.app.App);
    static initInterceptors(): void;
    private static queueLog;
    private static flushLogs;
    log(message: any, context?: string): void;
    error(message: any, stack?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    verbose(message: any, context?: string): void;
}
