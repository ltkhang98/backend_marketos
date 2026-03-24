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
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_1 = require("express");
const firestore_logger_service_1 = require("./common/logger/firestore-logger.service");
const admin = __importStar(require("firebase-admin"));
async function bootstrap() {
    if (!admin.apps.length) {
        let serviceAccount;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        }
        else {
            try {
                serviceAccount = require('../firebase-adminsdk.json');
            }
            catch (e) {
                console.error('Không tìm thấy file firebase-adminsdk.json');
            }
        }
        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: 'marketos-9b845',
                storageBucket: 'marketos-9b845.firebasestorage.app'
            });
        }
    }
    firestore_logger_service_1.FirestoreLogger.initInterceptors();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                'https://marketos.vn',
                'https://www.marketos.vn',
                'https://api.marketos.vn',
                'https://marketos-9b845.web.app',
                'https://marketos-9b845.firebaseapp.com',
            ];
            const isLocal = !origin || origin.includes('localhost') || origin.includes('127.0.0.1');
            if (isLocal || allowedOrigins.some(o => origin && origin.startsWith(o))) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
    });
    app.use((req, res, next) => {
        if (req.url === '/api/payments/webhook' || req.url === '/api/payments/sepay-webhook') {
            req.url = req.url.replace('/api/payments/', '/payments/');
        }
        next();
    });
    app.setGlobalPrefix('api', {
        exclude: [
            'payments/webhook',
            'payments/sepay-webhook',
            'webhook',
            'sepay-webhook',
            'payments'
        ],
    });
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '50mb' }));
    app.use((0, express_1.text)({ type: ['text/html', 'text/plain'], limit: '50mb' }));
    const firestoreLogger = app.get(firestore_logger_service_1.FirestoreLogger);
    app.useLogger(firestoreLogger);
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map