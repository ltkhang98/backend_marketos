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
                'https://marketos-9b845.web.app',
                'http://localhost:5173',
                'https://vibe-code.vercel.app',
            ];
            if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        optionsSuccessStatus: 204,
    });
    app.setGlobalPrefix('api', {
        exclude: [
            'payments/sepay-webhook',
            'sepay-webhook',
            'payments'
        ],
    });
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '50mb' }));
    app.use((0, express_1.text)({ type: ['text/html', 'text/plain'], limit: '50mb' }));
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map