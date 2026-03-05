import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded, text } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

const createNestServer = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

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

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.use(text({ type: ['text/html', 'text/plain'], limit: '50mb' }));

  await app.init();
  return app;
};

// Khởi tạo NestJS server
createNestServer().then(() => {
  // Chỉ listen khi chạy local (không phải Vercel)
  if (!process.env.VERCEL) {
    server.listen(process.env.PORT ?? 3000, () => {
      console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
    });
  }
});

// Export cho Vercel Serverless
export default server;
