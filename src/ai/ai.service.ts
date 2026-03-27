import { Injectable, Logger } from '@nestjs/common';
import { AiBaseService } from './services/ai-base.service';
import { AiFacebookService } from './services/ai-facebook.service';
import { AiTikTokService } from './services/ai-tiktok.service';
import { AiMediaService } from './services/ai-media.service';
import { AiAutomationService } from './services/ai-automation.service';
import { AiVideoProcessorService } from './services/ai-video-processor.service';

/**
 * AiService acts as a Central Facade (Proxy) to maintain backward compatibility.
 * All core logic is now moved to domain-specific services in the ./services directory.
 */
@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(
        private readonly base: AiBaseService,
        private readonly facebook: AiFacebookService,
        private readonly tiktok: AiTikTokService,
        private readonly media: AiMediaService,
        private readonly automation: AiAutomationService,
        private readonly video: AiVideoProcessorService,
    ) { }

    // --- PROXY METHODS (Delegation) ---

    // Media & Image
    async generateContent(body: any, userId: string) { return this.facebook.generateSocialContent(body, userId); }
    async generateSpeech(body: any, userId: string) { return this.media.generateSpeech(body, userId); }
    async generateImageMockup(prompt: string, productImg: any, logoImg: any, modelImg: any, ratio: any, userId: string) {
        return this.media.generateImageMockup(prompt, productImg, logoImg, modelImg, ratio, userId);
    }
    async generateKocProductImage(kocId: string, productImg: string, prompt: string, userId: string, modelOverride?: string, bgImg?: string) {
        return this.media.generateKocProductImage(kocId, productImg, prompt, userId, modelOverride, bgImg);
    }
    async generateKocVisual(body: any, userId: string) { return this.media.generateKocVisual(body, userId); }
    async generateSmartBanner(body: any, userId: string) { return this.media.generateSmartBanner(body, userId); }
    async removeBackground(url: string, userId: string) { return this.media.removeBackground(url, userId); }
    async enhanceImage(url: string, userId: string) { return this.media.enhanceImage(url, userId); }
    async generateVisualClone(modelImg: string, prompt: string, userId: string, templateImg?: string, count?: number, fidelity?: number, creativity?: number) {
        return this.media.generateVisualClone(modelImg, prompt, userId, templateImg, count, fidelity, creativity);
    }
    async getAiKocs(userId: string) { return this.media.getAiKocs(userId); }
    async createAiKoc(data: any, userId: string) { return this.media.createAiKoc(data, userId); }
    async deleteAiKoc(id: string, userId: string) { return this.media.deleteAiKoc(id, userId); }

    // Facebook
    async analyzeFacebookAd(url: string, userId: string) { return this.facebook.analyzeFacebookAd(url, userId); }
    async getAdsAnalysisHistory(userId: string) { return this.facebook.getAdsAnalysisHistory(userId); }
    async compareFacebookAds(a: any, b: any, userId: string) { return this.facebook.compareAds(a, b, userId); }
    async fetchContentFromUrl(url: string, userId: string) { return this.facebook.fetchContentFromUrl(url, userId); }
    async searchKeywordDiscovery(kw: string, limit: number, userId: string) { return this.facebook.searchKeywordDiscovery(kw, limit, userId); }
    async getKeywordDetail(kw: string, userId: string) { return this.facebook.getKeywordDetail(kw, userId); }
    async getTrendingKeywords(cat: string, userId: string, type: string) { return this.facebook.getTrendingKeywords(cat, userId, type); }
    async evaluateAndImproveContent(content: string, platform: string, userId: string) {
        return this.facebook.evaluateAndImproveContent(content, platform, userId);
    }

    // TikTok
    async analyzeTikTokChannel(id: string, userId: string) { return this.tiktok.analyzeTikTokChannel(id, userId); }
    async generateTikTokVideoScript(id: string, niche: string, userId: string) { return this.tiktok.generateTikTokVideoScript(id, niche, userId); }
    async getTikTokTrending(region: string, count: number, refresh: boolean, category: any, userId: string) {
        return this.tiktok.getTikTokTrending(region, count, refresh, category, userId);
    }
    async downloadTikTokVideo(url: string, userId: string) { return this.tiktok.downloadTikTokVideo(url, userId); }
    async generateVideoScript(body: any, userId: string) { return this.tiktok.generateTikTokVideoScript(body.uniqueId, body.niche, userId); }

    // Automation & Scrapers
    async runAutomationById(id: string, userId: string, isTest: boolean) { return this.automation.runAutomationById(id, userId, isTest); }
    async generateLandingPage(prompt: string) { return this.automation.generateLandingPage(prompt); }
    async scrapeProductData(url: string, userId: string) { return this.automation.scrapeProductData(url, userId); }
    async generateMarketingPlan(body: any, userId: string) { return this.automation.generateMarketingPlan(body, userId); }

    // Video Processor
    async generateAutoSubtitles(file: any, src: string, target: string, style: string, size: number, y: number, userId: string, color?: string, bgColor?: string) {
        return this.video.generateAutoSubtitles(file, src, target, style, size, y, userId, color, bgColor);
    }
    async renderAutomationVideo(resId: string, userId: string, wfId?: string) { return this.video.renderAutomationVideo(resId, userId, wfId); }
    async generateVideoDubbing(file: any, voice: string, lang: string, userId: string, bg: number, dub: number, sub: boolean, style: any) {
        return this.video.videoDubbing(file, voice, lang, userId, bg, dub, sub, style);
    }
    async generateKolVideo(img: string, vid: string, userId: string) { return this.video.generateKolVideo(img, vid, userId); }

    // Worker Methods (BullMQ)
    async processAutoSubJob(job: any) { return this.video.processAutoSubJob(job); }
    async processDubbingJob(job: any) { return this.video.processDubbingJob(job); }
    async processKolVideoJob(job: any) { return this.video.processKolVideoJob(job); }
    async processReburnJob(job: any) { return this.video.processReburnJob(job); }

    // Core Utilities
    async getJobStatus(jobId: string) { return this.base.getJobStatus(jobId); }
    async getMembershipConfigs() { return this.base.getMembershipConfigs(); }
    async downloadProxy(url: string) { return this.base.downloadProxy(url); }
}
