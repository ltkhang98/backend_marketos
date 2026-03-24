"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FirestoreLogger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreLogger = void 0;
const common_1 = require("@nestjs/common");
const admin = __importStar(require("firebase-admin"));
let FirestoreLogger = class FirestoreLogger {
    static { FirestoreLogger_1 = this; }
    firebaseAdmin;
    static db;
    static isIntercepting = false;
    static logBuffer = [];
    static flushTimeout = null;
    constructor(firebaseAdmin) {
        this.firebaseAdmin = firebaseAdmin;
        FirestoreLogger_1.db = this.firebaseAdmin.firestore();
        FirestoreLogger_1.initInterceptors();
    }
    static initInterceptors() {
        if (this.isIntercepting)
            return;
        this.isIntercepting = true;
        const originalStdoutWrite = process.stdout.write.bind(process.stdout);
        const originalStderrWrite = process.stderr.write.bind(process.stderr);
        process.stdout.write = (chunk, encoding, callback) => {
            const message = chunk.toString();
            this.queueLog('info', message);
            return originalStdoutWrite(chunk, encoding, callback);
        };
        process.stderr.write = (chunk, encoding, callback) => {
            const message = chunk.toString();
            this.queueLog('error', message);
            return originalStderrWrite(chunk, encoding, callback);
        };
    }
    static queueLog(level, message) {
        const cleanMessage = message.trim();
        if (!cleanMessage || !this.db)
            return;
        const lowerMsg = cleanMessage.toLowerCase();
        const skipKeywords = [
            'google-cloud', 'firestore', 'grpc', 'firebase',
            'identitytoolkit', 'auth', 'access_token',
            'credential', 'adminsdk', 'batch error',
            'routerexplorer', 'routesresolver', 'instance-loader',
            'firestorelogger', 'quota exceeded'
        ];
        if (skipKeywords.some(k => lowerMsg.includes(k)))
            return;
        this.logBuffer.push({
            level,
            message: cleanMessage,
            context: 'VPS Server',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString(),
        });
        if (!this.flushTimeout) {
            this.flushTimeout = setTimeout(() => this.flushLogs(), 1000);
        }
    }
    static async flushLogs() {
        this.flushTimeout = null;
        if (this.logBuffer.length === 0 || !this.db)
            return;
        const batch = this.db.batch();
        const logsToProcess = [...this.logBuffer];
        this.logBuffer = [];
        try {
            logsToProcess.forEach(log => {
                const docRef = this.db.collection('server_logs').doc();
                batch.set(docRef, log);
            });
            await batch.commit();
        }
        catch (error) {
            process.stdout.write(`[FirestoreLogger Skip] Lỗi flush log: ${error.message}\n`);
        }
    }
    log(message, context) {
        process.stdout.write(`[${context || 'Log'}] ${message}\n`);
    }
    error(message, stack, context) {
        process.stderr.write(`[${context || 'Error'}] ${message} ${stack || ''}\n`);
    }
    warn(message, context) {
        process.stdout.write(`[${context || 'Warn'}] ${message}\n`);
    }
    debug(message, context) { }
    verbose(message, context) { }
};
exports.FirestoreLogger = FirestoreLogger;
exports.FirestoreLogger = FirestoreLogger = FirestoreLogger_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('FIREBASE_ADMIN')),
    __metadata("design:paramtypes", [Object])
], FirestoreLogger);
//# sourceMappingURL=firestore-logger.service.js.map