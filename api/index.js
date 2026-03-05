import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module';
import { json, urlencoded, text } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();
let app;

async function bootstrap() {
    if (!app) {
        const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server));

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

        nestApp.use(json({ limit: '50mb' }));
        nestApp.use(urlencoded({ extended: true, limit: '50mb' }));
        nestApp.use(text({ type: ['text/html', 'text/plain'], limit: '50mb' }));

        await nestApp.init();
        app = nestApp;
    }
    return server;
}

module.exports = async (req, res) => {
    const app = await bootstrap();
    app(req, res);
};
