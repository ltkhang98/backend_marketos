import { Module, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Global()
@Module({
    providers: [
        {
            provide: 'FIREBASE_ADMIN',
            useFactory: () => {
                let serviceAccount: any;

                // Trên Vercel: dùng Environment Variable
                if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                } else {
                    // Local dev: dùng file JSON
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
