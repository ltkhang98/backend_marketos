import * as admin from 'firebase-admin';
export declare class LandingPagesService {
    private firebaseApp;
    private db;
    constructor(firebaseApp: admin.app.App);
    savePage(userId: string, pageData: any): Promise<any>;
    getPagesByUser(userId: string): Promise<{
        id: string;
    }[]>;
    getPageById(pageId: string): Promise<admin.firestore.DocumentData | null | undefined>;
    deletePage(pageId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
