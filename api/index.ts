import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { json, urlencoded, text } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import express from 'express';

const expressApp = express();
let app: any;

async function bootstrap() {
    if (!app) {
        const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

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
    return expressApp;
}

export default async (req: Request, res: Response) => {
    const server = await bootstrap();
    server(req, res);
};
