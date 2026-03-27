import { AiTikTokService } from '../services/ai-tiktok.service';
export declare class AiTikTokController {
    private readonly tiktokService;
    constructor(tiktokService: AiTikTokService);
    tiktokAnalytics(body: {
        uniqueId: string;
    }, req: any): Promise<any>;
    tiktokGenerateScript(body: {
        uniqueId: string;
        niche: string;
    }, req: any): Promise<any>;
    generateVideoScript(body: {
        uniqueId: string;
        niche: string;
    }, req: any): Promise<any>;
    tiktokTrending(region: string, count: any, category: string | undefined, refresh: any, req: any): Promise<any>;
    tiktokDownload(body: {
        url: string;
    }, req: any): Promise<any>;
}
