import { Module, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Global()
@Module({
    providers: [
        {
            provide: 'FIREBASE_ADMIN',
            useFactory: () => {
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
