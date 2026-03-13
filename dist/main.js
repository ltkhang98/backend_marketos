"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                'https://marketos.vn',
                'https://www.marketos.vn',
                'https://marketos-9b845.web.app',
                'https://marketos-9b845.firebaseapp.com',
                'http://localhost:5173'
            ];
            if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Authorization, Accept, X-Requested-With',
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
    await app.listen(process.env.PORT ?? 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map