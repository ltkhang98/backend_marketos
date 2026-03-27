import { AiFacebookService } from '../services/ai-facebook.service';
export declare class AiFacebookController {
    private readonly facebookService;
    constructor(facebookService: AiFacebookService);
    generateContent(body: any, req: any): Promise<any>;
    fbAdAnalysis(body: {
        url: string;
    }, req: any): Promise<any>;
    getAdsAnalysisHistory(req: any): Promise<{
        id: string;
    }[]>;
    fbAdComparison(body: {
        analysisA: any;
        analysisB: any;
    }, req: any): Promise<any>;
    fetchSocialContent(body: {
        url: string;
    }, req: any): Promise<string>;
    discoveryKeyword(body: {
        keyword: string;
    }, req: any): Promise<any>;
    getKeywordDetail(keyword: string, req: any): Promise<any>;
    getTrendingKeywords(body: {
        category: string;
        type: string;
    }, req: any): Promise<any[]>;
    evaluateContent(body: {
        content: string;
        platform: string;
    }, req: any): Promise<any>;
}
