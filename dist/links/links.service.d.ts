import * as admin from 'firebase-admin';
export declare class LinksService {
    private firebaseApp;
    private db;
    constructor(firebaseApp: admin.app.App);
    createShortLink(originalUrl: string, userId: string, customAlias?: string): Promise<{
        originalUrl: string;
        shortId: string;
        userId: string;
        createdAt: admin.firestore.FieldValue;
        clicks: number;
    }>;
    getLinksByUser(userId: string): Promise<{
        id: string;
    }[]>;
    getOriginalUrl(shortId: string): Promise<any>;
    deleteLink(shortId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getAnalytics(userId: string, shortId?: string): Promise<{
        totalLinks: number;
        totalClicks: any;
        timelineData: {
            date: string;
            clicks: number;
        }[];
        topLinks: {
            shortId: any;
            originalUrl: any;
            clicks: any;
        }[];
        linksList: {
            shortId: any;
            originalUrl: any;
        }[];
        averageClicks: string | number;
        currentLink: {
            shortId: any;
            originalUrl: any;
            createdAt: any;
        } | null;
    }>;
}
