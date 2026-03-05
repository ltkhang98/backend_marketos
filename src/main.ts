import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded, text } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://marketos-9b045.web.app',
      'http://localhost:5173',
      'https://vibe-code.vercel.app'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Khôi phục global prefix 'api' nhưng loại trừ các route sepay để tránh lỗi 404 từ SeePay
  app.setGlobalPrefix('api', {
    exclude: [
      'payments/sepay-webhook',
      'sepay-webhook',
      'payments'
    ],
  });

  // Tăng giới hạn dung lượng body để nhận ảnh base64 và HTML
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  // Thêm parser text/html và text/plain để xử lý destack save request
  app.use(text({ type: ['text/html', 'text/plain'], limit: '50mb' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
