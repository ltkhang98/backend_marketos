import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class LandingPagesService {
    private db: admin.firestore.Firestore;

    constructor(@Inject('FIREBASE_ADMIN') private firebaseApp: admin.app.App) {
        this.db = firebaseApp.firestore();
    }

    async savePage(userId: string, pageData: any) {
        const pageId = pageData.id || this.db.collection('landing_pages').doc().id;

        const data = {
            ...pageData,
            id: pageId,
            userId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: pageData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        };

        await this.db.collection('landing_pages').doc(pageId).set(data);
        return data;
    }

    async getPagesByUser(userId: string) {
        try {
            const snapshot = await this.db.collection('landing_pages')
                .where('userId', '==', userId)
                // .orderBy('createdAt', 'desc') // Removed to avoid index requirement for now
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error in getPagesByUser:', error);
            throw error;
        }
    }

    async getPageById(pageId: string) {
        const doc = await this.db.collection('landing_pages').doc(pageId).get();
        return doc.exists ? doc.data() : null;
    }

    async deletePage(pageId: string, userId: string) {
        const doc = await this.db.collection('landing_pages').doc(pageId).get();
        const data = doc.data();
        if (!doc.exists || !data || data.userId !== userId) {
            throw new Error('Unauthorized or not found');
        }
        await this.db.collection('landing_pages').doc(pageId).delete();
        return { success: true };
    }

}
