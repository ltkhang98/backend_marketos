import { AiBaseService } from './ai-base.service';
export declare class AiFacebookService {
    private readonly base;
    constructor(base: AiBaseService);
    analyzeFacebookAd(url: string, userId: string): Promise<any>;
    getAdsAnalysisHistory(userId: string): Promise<{
        id: string;
    }[]>;
    compareAds(analysisA: any, analysisB: any, userId: string): Promise<any>;
    fetchContentFromUrl(url: string, userId: string, skipDeduction?: boolean): Promise<string>;
    searchKeywordDiscovery(keyword: string, cursor: number | undefined, userId: string): Promise<any>;
    getKeywordDetail(keyword: string, userId: string): Promise<any>;
    getTrendingKeywords(category: string, userId: string, type?: string): Promise<any[]>;
    evaluateAndImproveContent(content: string, platform: string, userId: string): Promise<any>;
    generateSocialContent(body: any, userId: string): Promise<any>;
}
