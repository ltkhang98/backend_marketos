import { Injectable, LoggerService, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreLogger implements LoggerService {
    private static db: admin.firestore.Firestore;
    private static isIntercepting = false;
    private static logBuffer: any[] = [];
    private static flushTimeout: NodeJS.Timeout | null = null;

    constructor(@Inject('FIREBASE_ADMIN') private firebaseAdmin: admin.app.App) {
        FirestoreLogger.db = this.firebaseAdmin.firestore();
        FirestoreLogger.initInterceptors();
    }

    /**
     * Khởi tạo bắt log từ stdout/stderr
     */
    static initInterceptors() {
        if (this.isIntercepting) return;
        this.isIntercepting = true;

        const originalStdoutWrite = process.stdout.write.bind(process.stdout);
        const originalStderrWrite = process.stderr.write.bind(process.stderr);

        process.stdout.write = (chunk: any, encoding?: any, callback?: any): boolean => {
            const message = chunk.toString();
            this.queueLog('info', message);
            return originalStdoutWrite(chunk, encoding, callback);
        };

        process.stderr.write = (chunk: any, encoding?: any, callback?: any): boolean => {
            const message = chunk.toString();
            this.queueLog('error', message);
            return originalStderrWrite(chunk, encoding, callback);
        };
    }

    /**
     * Đưa log vào hàng đợi để gửi hàng loạt (batching)
     */
    private static queueLog(level: string, message: string) {
        const cleanMessage = message.trim();
        if (!cleanMessage || !this.db) return;

        // Tránh vòng lặp vô tận và lọc bớt log hệ thống của Firebase không cần thiết
        const lowerMsg = cleanMessage.toLowerCase();
        const skipKeywords = [
            'google-cloud', 'firestore', 'grpc', 'firebase',
            'identitytoolkit', 'auth', 'access_token',
            'credential', 'adminsdk', 'batch error',
            'routerexplorer', 'routesresolver', 'instance-loader',
            'firestorelogger', 'quota exceeded'
        ];
        
        if (skipKeywords.some(k => lowerMsg.includes(k))) return;

        this.logBuffer.push({
            level,
            message: cleanMessage,
            context: 'VPS Server',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
        });

        if (!this.flushTimeout) {
            this.flushTimeout = setTimeout(() => this.flushLogs(), 1000); // Flush mỗi giây
        }
    }

    /**
     * Gửi toàn bộ log trong buffer lên Firestore
     */
    private static async flushLogs() {
        this.flushTimeout = null;
        if (this.logBuffer.length === 0 || !this.db) return;

        const batch = this.db.batch();
        const logsToProcess = [...this.logBuffer];
        this.logBuffer = [];

        try {
            logsToProcess.forEach(log => {
                const docRef = this.db.collection('server_logs').doc();
                batch.set(docRef, log);
            });
            await batch.commit();
        } catch (error) {
            // In lặng lẽ để không kích hoạt interceptor (bằng cách in không kèm context "firestorelogger")
            // Tuy nhiên hàm write đã bị intercept, ta dùng chính name của nó để skipKeywords loại bỏ
            process.stdout.write(`[FirestoreLogger Skip] Lỗi flush log: ${error.message}\n`);
        }
    }

    // Các hàm của LoggerService
    log(message: any, context?: string) {
        process.stdout.write(`[${context || 'Log'}] ${message}\n`);
    }

    error(message: any, stack?: string, context?: string) {
        process.stderr.write(`[${context || 'Error'}] ${message} ${stack || ''}\n`);
    }

    warn(message: any, context?: string) {
        process.stdout.write(`[${context || 'Warn'}] ${message}\n`);
    }

    debug(message: any, context?: string) {}
    verbose(message: any, context?: string) {}
}
