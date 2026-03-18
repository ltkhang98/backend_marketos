import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod } from '@nestjs/common';
import { json, urlencoded, text } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
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
      } else {
        // Trả về false thay vì Error object để NestJS xử lý CORS header chuẩn hơn
        callback(null, false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
  });

  // Rewrite URL for misconfigured webhooks
  app.use((req: any, res: any, next: any) => {
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

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.use(text({ type: ['text/html', 'text/plain'], limit: '50mb' }));

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
