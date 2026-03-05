import { Module, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Global()
@Module({
    providers: [
        {
            provide: 'FIREBASE_ADMIN',
            useFactory: () => {
                let serviceAccount: any;

                // Kiểm tra biến môi trường (cho Render/Vercel)
                if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                } else {
                    // Cấu hình chạy local
                    serviceAccount = require('../../firebase-adminsdk.json');
                }

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
