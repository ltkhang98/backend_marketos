import { OnModuleInit } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { FacebookService } from '../facebook/facebook.service';
export declare class AiService implements OnModuleInit {
    private configService;
    private firebaseAdmin;
    private facebookService;
    private readonly videoQueue;
    private readonly logger;
    private genAI;
    private model;
    private tikwmBaseUrl;
    private cache;
    private CACHE_TTL;
    private currentGeminiKey;
    private currentFptKey;
    private currentScrapingBeeKey;
    private currentRapidApiKey;
    private currentReplicateKey;
    private replicate;
    private readonly CREDIT_COSTS;
    constructor(configService: ConfigService, firebaseAdmin: admin.app.App, facebookService: FacebookService, videoQueue: Queue);
    private initializeModels;
    private listenToApiKeys;
    getJobStatus(jobId: string): Promise<{
        id: string | undefined;
        state: import("bullmq").JobState | "unknown";
        progress: any;
        result: any;
        reason: string;
    }>;
    private generateAIContentWithRetry;
    private deductCredits;
    analyzeFacebookAd(url: string | undefined, userId: string): Promise<any>;
    getAdsAnalysisHistory(userId: string): Promise<any[]>;
    compareFacebookAds(analysisA: any, analysisB: any, userId: string): Promise<any>;
    fetchContentFromUrl(url: string, userId: string): Promise<any>;
    searchKeywordDiscovery(query: string, retryCount: number | undefined, userId: string): Promise<any[]>;
    getTrendingKeywords(category: string, userId: string, type?: 'hot' | 'potential'): Promise<any[]>;
    getKeywordDetail(keyword: string, userId: string): Promise<any>;
    evaluateAndImproveContent(content: string, platform: string, userId: string): Promise<any>;
    private trackUsage;
    private checkLimit;
    generateContent(data: {
        platform: string;
        length?: string;
        brand: string;
        field: string;
        features: string;
        price: string;
        offers: string;
        mode?: string;
        framework?: string;
        tone?: string;
        category?: string;
        videoType?: string;
    }, userId: string): Promise<any>;
    generateSpeech(data: {
        text: string;
        voice: string;
        speed: number;
    }, userId: string): Promise<any>;
    downloadProxy(url: string): Promise<axios.AxiosResponse<any, any, {}>>;
    generateImageMockup(originalPrompt: string, productImage?: string, logoImage?: string, modelImage?: string, aspectRatio?: string, userId?: string): Promise<{
        url: string;
    }>;
    private resolveBase64Image;
    generateSmartBanner(data: {
        productImage?: string;
        productImages?: string[];
        modelImage?: string;
        logoImage?: string;
        refImage?: string;
        companyName?: string;
        productName?: string;
        slogan: string;
        price: string;
        details?: string;
        industry?: string;
        style: string;
        aspectRatio: string;
        quality: string;
    }, userId: string): Promise<{
        url: string;
    }>;
    private uploadBase64ToStorage;
    generateMarketingPlan(data: {
        productName: string;
        description: string;
        targetAudience: string;
        goal: string;
        budget?: string;
        duration: string;
    }, userId: string): Promise<any>;
    scrapeProductData(url: string, userId: string): Promise<any>;
    generateVideoScript(data: {
        productName: string;
        brand: string;
        description: string;
        vibe: string;
        ratio: string;
        duration: string;
    }, userId: string): Promise<any>;
    downloadUniversalVideo(url: string, userId: string): Promise<any>;
    private detectPlatform;
    downloadTikTokVideo(url: string, userId: string, skipDeduction?: boolean): Promise<any>;
    private callTikWM;
    analyzeTikTokChannel(uniqueId: string, userId: string): Promise<any>;
    generateTikTokAIAnalysis(user: any, stats: any, videos: any[], retryCount?: number): Promise<any>;
    private getDefaultAIAnalysis;
    getTikTokUserVideos(uniqueId: string, userIdOrSecUid?: string): Promise<any>;
    private calculateHealthScore;
    generateTikTokVideoScript(uniqueId: string, niche: string, userId: string): Promise<any>;
    getTikTokTrending(region?: string, count?: number, refresh?: boolean, category?: string, userId?: string): Promise<any>;
    generateLandingPage(userPrompt: string): Promise<any>;
    private extractAudioWithFFmpeg;
    private burnSubtitlesWithFFmpeg;
    generateAutoSubtitles(file: any, srcLang: string, targetLang: string, style: string, fontSize?: number, yPos?: number, userId?: string, subColor?: string, subBgColor?: string): Promise<any>;
    processAutoSubJob(job: any): Promise<{
        success: boolean;
        srtContent: any;
        videoId: any;
    }>;
    downloadBurnedVideo(fileId: string): Promise<{
        stream: fs.ReadStream;
        size: number;
    }>;
    streamBurnedVideo(fileId: string, req: any, res: any): Promise<any>;
    streamDubbedVideo(jobId: string, req: any, res: any): Promise<void>;
    updateSrtContent(fileId: string, srtContent: string, style?: string, fontSize?: number, yPos?: number, subColor?: string, subBgColor?: string): Promise<any>;
    onModuleInit(): Promise<void>;
    private checkProductTriggeredAutomations;
    private checkScheduledAutomations;
    runAutomationById(id: string, userId: string, isTest?: boolean, triggeredProducts?: any[] | null): Promise<void>;
    private processSingleContentTask;
    private processProductVideoTask;
    renderAutomationVideo(resultId: string, userId: string, workflowId?: string): Promise<{
        success: boolean;
        videoUrl: string;
    }>;
    generateVideoDubbing(file: any, targetVoice: string, targetLang: string, userId: string, bgVolume?: number, dubVolume?: number, showSubtitles?: boolean, subStyle?: {
        color?: string;
        fontSize?: number;
        bgColor?: string;
        verticalPos?: number;
    }): Promise<any>;
    processDubbingJob(job: any): Promise<{
        success: boolean;
        videoId: any;
        jobDir: string;
    }>;
    private parseSrt;
    private srtTimeToSeconds;
    private getVideoDuration;
    private getAudioDuration;
    private stretchAudio;
    private removeAudioFromVideo;
    private muxDubbedVideo;
    private splitLongSegments;
    private formatSrt;
    private secondsToSrtTime;
    generateKolVideo(imageUrl: string, videoUrl: string, userId: string): Promise<{
        jobId: string | undefined;
        message: string;
    }>;
    processKolVideoJob(job: Job<any, any, string>): Promise<{
        videoUrl: string;
    }>;
    downloadDubbedVideo(jobId: string): Promise<any>;
    removeBackground(imageUrl: string, userId: string): Promise<any>;
    enhanceImage(imageUrl: string, userId: string): Promise<any>;
    generateVisualClone(modelImage: string, templatePrompt: string, userId: string, templateImage?: string, count?: number, fidelity?: number, creativity?: number): Promise<any>;
    getAiKocs(userId: string): Promise<{
        id: string;
    }[]>;
    createAiKoc(data: {
        name: string;
        imageUrl: string;
        tags?: string[];
    }, userId: string): Promise<{
        userId: string;
        createdAt: admin.firestore.FieldValue;
        updatedAt: admin.firestore.FieldValue;
        name: string;
        imageUrl: string;
        tags?: string[];
        id: string;
    }>;
    deleteAiKoc(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    generateKocProductImage(kocId: string, productImage: string, prompt: string, userId: string, modelImageOverride?: string, bgImage?: string): Promise<{
        urls: string[];
    }>;
    private callSingleGeminiImageGen;
    generateKocVisual(data: {
        kocId: string;
        angle: string;
        outfit: string;
        hairColor: string;
        action: string;
    }, userId: string): Promise<{
        url: string | null;
    }>;
    processReburnJob(job: any): Promise<any>;
}
