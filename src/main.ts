import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod } from '@nestjs/common';
import { json, urlencoded, text } from 'express';
import { FirestoreLogger } from './common/logger/firestore-logger.service';
import * as admin from 'firebase-admin';

async function bootstrap() {
  // Khởi tạo Firebase Admin sớm để bắt log ngay lập tức từ đầu
  if (!admin.apps.length) {
    let serviceAccount: any;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // Local path relative to the built main.js usually needs adjustment
      // but in dev/src it's here
      try {
        serviceAccount = require('../firebase-adminsdk.json');
      } catch (e) {
        // Fallback or handle error
        console.error('Không tìm thấy file firebase-adminsdk.json');
      }
    }
    
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'marketos-9b845',
        storageBucket: 'marketos-9b845.firebasestorage.app'
      });
    }
  }

  // Bật bắt log từ stdout/stderr
  FirestoreLogger.initInterceptors();
  
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

  // Phục vụ file tĩnh từ thư mục uploads
  const express = require('express');
  const path = require('path');
  const fs = require('fs');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Tạo thư mục uploads nếu chưa có
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    // Tạo thêm các thư mục con cần thiết
    fs.mkdirSync(path.join(uploadsDir, 'avatars'), { recursive: true });
    fs.mkdirSync(path.join(uploadsDir, 'ai_generated'), { recursive: true });
  }
  
  app.use('/uploads', express.static(uploadsDir));

  // Sử dụng Firestore Logger cho NestJS
  const firestoreLogger = app.get(FirestoreLogger);
  app.useLogger(firestoreLogger);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
