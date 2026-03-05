import { LinksService } from './links.service';
import type { Response } from 'express';
export declare class LinksController {
    private readonly linksService;
    constructor(linksService: LinksService);
    shorten(body: {
        url: string;
        customAlias?: string;
        userId: string;
    }): Promise<{
        originalUrl: string;
        shortId: string;
        userId: string;
        createdAt: FirebaseFirestore.FieldValue;
        clicks: number;
    }>;
    getUserLinks(userId: string): Promise<{
        id: string;
    }[]>;
    deleteLink(shortId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getAnalytics(userId: string): Promise<{
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
        averageClicks: string | number;
    }>;
    redirect(shortId: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
}
