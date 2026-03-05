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

    async getAnalytics(userId: string, shortId?: string) {
        try {
            // 1. Lấy tất cả link của user
            const linksSnapshot = await this.db.collection('short_links')
                .where('userId', '==', userId)
                .get();

            const links = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
            const currentLink = shortId ? links.find(l => l.shortId === shortId) : null;

            const totalLinks = links.length;
            const totalClicks = shortId && currentLink ? (currentLink.clicks || 0) : links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

            // 2. Lấy dữ liệu click (Chỉ lọc theo userId để tránh lỗi Index)
            // Lọc theo thời gian và shortId sẽ thực hiện trong bộ nhớ
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setHours(0, 0, 0, 0);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const clicksSnapshot = await this.db.collection('link_clicks')
                .where('userId', '==', userId)
                .get();

            const clicksByDate: Record<string, number> = {};

            clicksSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!data.timestamp) return;

                const clickDate = (data.timestamp as admin.firestore.Timestamp).toDate();

                // Lọc theo thời gian (30 ngày gần nhất)
                if (clickDate < thirtyDaysAgo) return;

                // Lọc theo shortId nếu có yêu cầu
                if (shortId && data.shortId !== shortId) return;

                // Format ngày DD/MM/YYYY cố định
                const day = clickDate.getDate().toString().padStart(2, '0');
                const month = (clickDate.getMonth() + 1).toString().padStart(2, '0');
                const year = clickDate.getFullYear();
                const dateKey = `${day}/${month}/${year}`;

                clicksByDate[dateKey] = (clicksByDate[dateKey] || 0) + 1;
            });

            // 3. Tạo dữ liệu timeline cho biểu đồ
            const timelineData = [];
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const day = d.getDate().toString().padStart(2, '0');
                const month = (d.getMonth() + 1).toString().padStart(2, '0');
                const year = d.getFullYear();
                const dateKey = `${day}/${month}/${year}`;

                timelineData.push({
                    date: dateKey,
                    clicks: clicksByDate[dateKey] || 0
                });
            }

            const topLinks = [...links]
                .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
                .slice(0, 10)
                .map(l => ({
                    shortId: l.shortId,
                    originalUrl: l.originalUrl,
                    clicks: l.clicks || 0
                }));

            return {
                totalLinks,
                totalClicks,
                timelineData,
                topLinks,
                linksList: links.map(l => ({ shortId: l.shortId, originalUrl: l.originalUrl })),
                averageClicks: totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : 0,
                currentLink: currentLink ? {
                    shortId: currentLink.shortId,
                    originalUrl: currentLink.originalUrl,
                    createdAt: currentLink.createdAt
                } : null
            };
        } catch (error) {
            console.error("Lỗi getAnalytics:", error);
            throw error;
        }
    }
}
