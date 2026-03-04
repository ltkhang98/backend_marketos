import { Module, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Global()
@Module({
    providers: [
        {
            provide: 'FIREBASE_ADMIN',
            useFactory: () => {
                // Ưu tiên đọc từ biến môi trường (Vercel / Production)
                if (process.env.FIREBASE_PRIVATE_KEY) {
                    return admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID || 'marketos-9b845',
                            privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
                            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        } as admin.ServiceAccount),
                        projectId: process.env.FIREBASE_PROJECT_ID || 'marketos-9b845',
                        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'marketos-9b845.firebasestorage.app',
                    });
                }

                // Fallback: đọc từ file JSON (dùng cho local development)
                const serviceAccount = require('../../firebase-adminsdk.json');
                return admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: 'marketos-9b845',
                    storageBucket: 'marketos-9b845.firebasestorage.app'
                });
            },
        },
    ],
    exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule { }
