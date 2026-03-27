import { LinksService } from './links.service';
import type { Response } from 'express';
export declare class LinksController {
    private readonly linksService;
    constructor(linksService: LinksService);
    shorten(body: {
        url: string;
        customAlias?: string;
    }, req: any): Promise<{
        originalUrl: string;
        shortId: string;
        userId: string;
        createdAt: FirebaseFirestore.FieldValue;
        clicks: number;
    }>;
    getUserLinks(req: any): Promise<{
        id: string;
    }[]>;
    deleteLink(shortId: string, req: any): Promise<{
        success: boolean;
    }>;
    getAnalytics(req: any, shortId?: string): Promise<{
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
    redirect(shortId: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
}
