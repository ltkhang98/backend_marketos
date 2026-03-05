"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_1 = require("express");
const platform_express_1 = require("@nestjs/platform-express");
const express_2 = __importDefault(require("express"));
const server = (0, express_2.default)();
const createNestServer = async () => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server));
    app.enableCors({
        origin: [
            'https://marketos-9b845.web.app',
            'http://localhost:5173',
            'https://vibe-code.vercel.app',
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: [
            'X-CSRF-Token',
            'X-Requested-With',
            'Accept',
            'Accept-Version',
            'Content-Length',
            'Content-MD5',
            'Content-Type',
            'Date',
            'X-Api-Version',
            'Authorization',
        ],
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
    await app.init();
    return app;
};
createNestServer().then(() => {
    if (!process.env.VERCEL) {
        server.listen(process.env.PORT ?? 3000, () => {
            console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
        });
    }
});
exports.default = server;
//# sourceMappingURL=main.js.map