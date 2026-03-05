"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const express_1 = require("express");
const platform_express_1 = require("@nestjs/platform-express");
const express_2 = __importDefault(require("express"));
const expressApp = (0, express_2.default)();
let app;
async function bootstrap() {
    if (!app) {
        const nestApp = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp));
        nestApp.enableCors({
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
        nestApp.setGlobalPrefix('api', {
            exclude: [
                'payments/sepay-webhook',
                'sepay-webhook',
                'payments'
            ],
        });
        nestApp.use((0, express_1.json)({ limit: '50mb' }));
        nestApp.use((0, express_1.urlencoded)({ extended: true, limit: '50mb' }));
        nestApp.use((0, express_1.text)({ type: ['text/html', 'text/plain'], limit: '50mb' }));
        await nestApp.init();
        app = nestApp;
    }
    return expressApp;
}
exports.default = async (req, res) => {
    const server = await bootstrap();
    server(req, res);
};
//# sourceMappingURL=index.js.map