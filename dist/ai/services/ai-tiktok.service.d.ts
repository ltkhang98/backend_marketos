import { AiBaseService } from './ai-base.service';
export declare class AiTikTokService {
    private readonly base;
    private readonly CACHE_TTL;
    private cache;
    constructor(base: AiBaseService);
    analyzeTikTokChannel(uniqueId: string, userId: string): Promise<any>;
    generateTikTokAIAnalysis(user: any, stats: any, videos: any[], retryCount?: number): Promise<any>;
    private getDefaultAIAnalysis;
    getTikTokUserVideos(uniqueId: string, userIdOrSecUid?: string): Promise<any>;
    private calculateHealthScore;
    generateTikTokVideoScript(uniqueId: string, niche: string, userId: string): Promise<any>;
    getTikTokTrending(region?: string, count?: number, refresh?: boolean, category?: string, userId?: string): Promise<any>;
    downloadTikTokVideo(url: string, userId: string): Promise<any>;
    private callTikWM;
}
