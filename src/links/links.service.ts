import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class LinksService {
    private db: admin.firestore.Firestore;

    constructor(@Inject('FIREBASE_ADMIN') private firebaseApp: admin.app.App) {
        this.db = firebaseApp.firestore();
    }

    async createShortLink(originalUrl: string, userId: string, customAlias?: string) {
        const shortId = customAlias || Math.random().toString(36).substring(2, 8);

        // Check if alias already exists if customAlias is provided
        if (customAlias) {
            const existing = await this.db.collection('short_links').doc(shortId).get();
            if (existing.exists) {
                throw new Error('Alias already exists');
            }
        }

        const linkData = {
            originalUrl,
            shortId,
            userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            clicks: 0,
        };

        await this.db.collection('short_links').doc(shortId).set(linkData);
        return linkData;
    }

    async getLinksByUser(userId: string) {
        const snapshot = await this.db.collection('short_links')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getOriginalUrl(shortId: string) {
        const doc = await this.db.collection('short_links').doc(shortId).get();
        const data = doc.data();
        if (!data) {
            return null;
        }

        // Increment clicks asynchronously
        this.db.collection('short_links').doc(shortId).update({
            clicks: admin.firestore.FieldValue.increment(1)
        }).catch(err => console.error('Error incrementing clicks:', err));

        // Log detailed click
        this.db.collection('link_clicks').add({
            shortId,
            userId: data.userId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(err => console.error('Error logging click:', err));

        return data.originalUrl;
    }

    async deleteLink(shortId: string, userId: string) {
        const doc = await this.db.collection('short_links').doc(shortId).get();
        const data = doc.data();
        if (!doc.exists || !data || data.userId !== userId) {
            throw new Error('Unauthorized or not found');
        }
        await this.db.collection('short_links').doc(shortId).delete();

        // Optionally delete logs (optional, maybe keep for history)
        return { success: true };
    }

    async getAnalytics(userId: string) {
        // Get all links for this user to calculate totals
        const linksSnapshot = await this.db.collection('short_links')
            .where('userId', '==', userId)
            .get();

        const links = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        const totalLinks = links.length;
        const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

        // Get clicks over time (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const clicksSnapshot = await this.db.collection('link_clicks')
            .where('userId', '==', userId)
            .where('timestamp', '>=', thirtyDaysAgo)
            .orderBy('timestamp', 'asc')
            .get();

        const clicksByDate: Record<string, number> = {};
        clicksSnapshot.docs.forEach(doc => {
            const date = (doc.data().timestamp as admin.firestore.Timestamp)?.toDate()?.toLocaleDateString('vi-VN') || 'N/A';
            clicksByDate[date] = (clicksByDate[date] || 0) + 1;
        });

        const timelineData = Object.entries(clicksByDate).map(([date, count]) => ({
            date,
            clicks: count
        }));

        // Sort links by clicks for top performing
        const topLinks = [...links]
            .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
            .slice(0, 5)
            .map(l => ({
                shortId: l.shortId,
                originalUrl: l.originalUrl,
                clicks: l.clicks
            }));

        return {
            totalLinks,
            totalClicks,
            timelineData,
            topLinks,
            averageClicks: totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : 0
        };
    }
}
