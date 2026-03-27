import { AiBaseService } from './ai-base.service';
import { AiFacebookService } from './ai-facebook.service';
import { AiTikTokService } from './ai-tiktok.service';
import { AiMediaService } from './ai-media.service';
export declare class AiAutomationService {
    private readonly base;
    private readonly facebook;
    private readonly tiktok;
    private readonly media;
    private readonly logger;
    constructor(base: AiBaseService, facebook: AiFacebookService, tiktok: AiTikTokService, media: AiMediaService);
    runAutomationById(id: string, userId: string, isTest?: boolean): Promise<any>;
    private processSingleTask;
    generateLandingPage(prompt: string, userId?: string): Promise<any>;
    scrapeProductData(url: string, userId: string): Promise<any>;
    generateMarketingPlan(body: any, userId: string): Promise<any>;
}
