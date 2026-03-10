import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded, text } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Rewrite URL for misconfigured webhooks
  app.use((req: any, res: any, next: any) => {
    if (req.url === '/api/payments/webhook' || req.url === '/api/payments/sepay-webhook') {
      req.url = req.url.replace('/api/payments/', '/payments/');
    }
    next();
  });

  app.enableCors({
    origin: [
      'https://marketos-9b845.web.app',
      'https://marketos-9b845.firebaseapp.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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
