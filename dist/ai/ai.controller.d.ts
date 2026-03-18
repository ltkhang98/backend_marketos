import { AiService } from './ai.service';
import type { Response } from 'express';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    generateSocialContent(body: any, req: any): Promise<any>;
    textToSpeech(body: {
        text: string;
        voice: string;
        speed: number;
    }, req: any): Promise<any>;
    download(url: string, filename: string, res: Response): Promise<void>;
    generateMockup(body: {
        prompt: string;
        productImage?: string;
        logoImage?: string;
        modelImage?: string;
        aspectRatio?: string;
    }, req: any): Promise<{
        url: string;
    }>;
    generateSmartBanner(body: any, req: any): Promise<{
        url: string;
    }>;
    scrapeProduct(body: {
        url: string;
    }, req: any): Promise<any>;
    generateVideoConcept(body: any, req: any): Promise<any>;
    generatePlanning(body: any, req: any): Promise<any>;
    tiktokDownload(body: {
        url: string;
    }, req: any): Promise<any>;
    videoDownload(body: {
        url: string;
    }, req: any): Promise<any>;
    tiktokAnalytics(body: {
        uniqueId: string;
    }, req: any): Promise<any>;
    tiktokGenerateScript(body: {
        uniqueId: string;
        niche: string;
    }, req: any): Promise<any>;
    fbAdAnalysis(body: {
        url: string;
    }, req: any): Promise<any>;
    getAdsAnalysisHistory(req: any): Promise<any[]>;
    fbAdComparison(body: {
        analysisA: any;
        analysisB: any;
    }, req: any): Promise<any>;
    fetchSocialContent(body: {
        url: string;
    }, req: any): Promise<any>;
    discoveryKeyword(body: {
        keyword: string;
    }, req: any): Promise<any[]>;
    keywordDetail(body: {
        keyword: string;
    }, req: any): Promise<any>;
    trendingKeywords(body: {
        category: string;
        type?: 'hot' | 'potential';
    }, req: any): Promise<any[]>;
    evaluateImproveContent(body: {
        content: string;
        platform: string;
    }, req: any): Promise<any>;
    tiktokTrending(region: string, count: number, category: string | undefined, refresh: string | undefined, req: any): Promise<any>;
    generateLandingPage(body: {
        prompt: string;
    }): Promise<any>;
    autoSubtitles(file: any, srcLang: string, targetLang: string, style: string, fontSize: number, yPos: number, subColor: string, subBgColor: string, req: any): Promise<any>;
    streamBurnedVideo(id: string, req: any, res: Response): Promise<void>;
    downloadBurnedVideo(id: string, res: Response): Promise<void>;
    updateSubtitles(videoId: string, srtContent: string, style: string, fontSize: number, yPos: number, subColor: string, subBgColor: string, req: any): Promise<any>;
    runAutomation(id: string, body: {
        isTest?: boolean;
    }, req: any): Promise<void>;
    renderAutomationVideo(resultId: string, body: {
        workflowId?: string;
    }, req: any): Promise<{
        success: boolean;
        videoUrl: string;
    }>;
    streamDubbedVideo(jobId: string, req: any, res: Response): Promise<void>;
    videoDubbing(file: any, targetVoice: string, targetLang: string, bgVolume: string, dubVolume: string, showSubtitles: string, subColor: string, subFontSize: string, subBgColor: string, subVerticalPos: string, req: any): Promise<any>;
    getJobStatus(jobId: string): Promise<{
        id: string | undefined;
        state: import("bullmq").JobState | "unknown";
        progress: any;
        result: any;
        reason: string;
    }>;
}
