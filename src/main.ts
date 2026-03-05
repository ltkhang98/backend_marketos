import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded, text } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [
        'https://marketos-9b845.web.app',
        'http://localhost:5173',
        'https://vibe-code.vercel.app',
      ];
      // Kiểm tra nếu origin (đã xóa dấu / ở cuối) nằm trong danh sách cho phép
      const sanitizedOrigin = origin?.replace(/\/$/, '');
      if (!origin || (sanitizedOrigin && allowedOrigins.includes(sanitizedOrigin))) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
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
