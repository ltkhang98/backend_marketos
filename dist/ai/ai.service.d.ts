import { AiBaseService } from './services/ai-base.service';
import { AiFacebookService } from './services/ai-facebook.service';
import { AiTikTokService } from './services/ai-tiktok.service';
import { AiMediaService } from './services/ai-media.service';
import { AiAutomationService } from './services/ai-automation.service';
import { AiVideoProcessorService } from './services/ai-video-processor.service';
export declare class AiService {
    private readonly base;
    private readonly facebook;
    private readonly tiktok;
    private readonly media;
    private readonly automation;
    private readonly video;
    private readonly logger;
    constructor(base: AiBaseService, facebook: AiFacebookService, tiktok: AiTikTokService, media: AiMediaService, automation: AiAutomationService, video: AiVideoProcessorService);
    generateContent(body: any, userId: string): Promise<any>;
    generateSpeech(body: any, userId: string): Promise<any>;
    generateImageMockup(prompt: string, productImg: any, logoImg: any, modelImg: any, ratio: any, userId: string): Promise<any>;
    generateKocProductImage(kocId: string, productImg: string, prompt: string, userId: string, modelOverride?: string, bgImg?: string): Promise<{
        url: string | null;
        urls: string[];
    }>;
    generateKocVisual(body: any, userId: string): Promise<{
        url: string | null;
        urls: string[];
    }>;
    generateSmartBanner(body: any, userId: string): Promise<{
        url: string;
    }>;
    removeBackground(url: string, userId: string): Promise<any>;
    enhanceImage(url: string, userId: string): Promise<any>;
    generateVisualClone(modelImg: string, prompt: string, userId: string, templateImg?: string, count?: number, fidelity?: number, creativity?: number): Promise<any>;
    getAiKocs(userId: string): Promise<any[]>;
    createAiKoc(data: any, userId: string): Promise<any>;
    deleteAiKoc(id: string, userId: string): Promise<any>;
    analyzeFacebookAd(url: string, userId: string): Promise<any>;
    getAdsAnalysisHistory(userId: string): Promise<{
        id: string;
    }[]>;
    compareFacebookAds(a: any, b: any, userId: string): Promise<any>;
    fetchContentFromUrl(url: string, userId: string): Promise<string>;
    searchKeywordDiscovery(kw: string, limit: number, userId: string): Promise<any>;
    getKeywordDetail(kw: string, userId: string): Promise<any>;
    getTrendingKeywords(cat: string, userId: string, type: string): Promise<any[]>;
    evaluateAndImproveContent(content: string, platform: string, userId: string): Promise<any>;
    analyzeTikTokChannel(id: string, userId: string): Promise<any>;
    generateTikTokVideoScript(id: string, niche: string, userId: string): Promise<any>;
    getTikTokTrending(region: string, count: number, refresh: boolean, category: any, userId: string): Promise<any>;
    downloadTikTokVideo(url: string, userId: string): Promise<any>;
    generateVideoScript(body: any, userId: string): Promise<any>;
    runAutomationById(id: string, userId: string, isTest: boolean): Promise<any>;
    generateLandingPage(prompt: string): Promise<any>;
    scrapeProductData(url: string, userId: string): Promise<any>;
    generateMarketingPlan(body: any, userId: string): Promise<any>;
    generateAutoSubtitles(file: any, src: string, target: string, style: string, size: number, y: number, userId: string, color?: string, bgColor?: string): Promise<{
        success: boolean;
        videoId: string;
        srtContent: string;
        burnSuccess: boolean;
        message: string;
    }>;
    renderAutomationVideo(resId: string, userId: string, wfId?: string): Promise<{
        success: boolean;
        videoUrl: string;
    }>;
    generateVideoDubbing(file: any, voice: string, lang: string, userId: string, bg: number, dub: number, sub: boolean, style: any): Promise<{
        jobId: string | undefined;
        message: string;
    }>;
    generateKolVideo(img: string, vid: string, userId: string): Promise<{
        jobId: string;
        message: string;
    }>;
    processAutoSubJob(job: any): Promise<{
        success: boolean;
    }>;
    processDubbingJob(job: any): Promise<{
        success: boolean;
        videoId: string;
    }>;
    processKolVideoJob(job: any): Promise<{
        success: boolean;
    }>;
    processReburnJob(job: any): Promise<{
        success: boolean;
    }>;
    getJobStatus(jobId: string): Promise<{
        id: string;
        state: string;
    }>;
    getMembershipConfigs(): Promise<any>;
    downloadProxy(url: string): Promise<import("axios").AxiosResponse<any, any, {}>>;
}
