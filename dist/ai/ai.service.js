"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const ai_base_service_1 = require("./services/ai-base.service");
const ai_facebook_service_1 = require("./services/ai-facebook.service");
const ai_tiktok_service_1 = require("./services/ai-tiktok.service");
const ai_media_service_1 = require("./services/ai-media.service");
const ai_automation_service_1 = require("./services/ai-automation.service");
const ai_video_processor_service_1 = require("./services/ai-video-processor.service");
let AiService = AiService_1 = class AiService {
    base;
    facebook;
    tiktok;
    media;
    automation;
    video;
    logger = new common_1.Logger(AiService_1.name);
    constructor(base, facebook, tiktok, media, automation, video) {
        this.base = base;
        this.facebook = facebook;
        this.tiktok = tiktok;
        this.media = media;
        this.automation = automation;
        this.video = video;
    }
    async generateContent(body, userId) { return this.facebook.generateSocialContent(body, userId); }
    async generateSpeech(body, userId) { return this.media.generateSpeech(body, userId); }
    async generateImageMockup(prompt, productImg, logoImg, modelImg, ratio, userId) {
        return this.media.generateImageMockup(prompt, productImg, logoImg, modelImg, ratio, userId);
    }
    async generateKocProductImage(kocId, productImg, prompt, userId, modelOverride, bgImg) {
        return this.media.generateKocProductImage(kocId, productImg, prompt, userId, modelOverride, bgImg);
    }
    async generateKocVisual(body, userId) { return this.media.generateKocVisual(body, userId); }
    async generateSmartBanner(body, userId) { return this.media.generateSmartBanner(body, userId); }
    async removeBackground(url, userId) { return this.media.removeBackground(url, userId); }
    async enhanceImage(url, userId) { return this.media.enhanceImage(url, userId); }
    async generateVisualClone(modelImg, prompt, userId, templateImg, count, fidelity, creativity) {
        return this.media.generateVisualClone(modelImg, prompt, userId, templateImg, count, fidelity, creativity);
    }
    async getAiKocs(userId) { return this.media.getAiKocs(userId); }
    async createAiKoc(data, userId) { return this.media.createAiKoc(data, userId); }
    async deleteAiKoc(id, userId) { return this.media.deleteAiKoc(id, userId); }
    async analyzeFacebookAd(url, userId) { return this.facebook.analyzeFacebookAd(url, userId); }
    async getAdsAnalysisHistory(userId) { return this.facebook.getAdsAnalysisHistory(userId); }
    async compareFacebookAds(a, b, userId) { return this.facebook.compareAds(a, b, userId); }
    async fetchContentFromUrl(url, userId) { return this.facebook.fetchContentFromUrl(url, userId); }
    async searchKeywordDiscovery(kw, limit, userId) { return this.facebook.searchKeywordDiscovery(kw, limit, userId); }
    async getKeywordDetail(kw, userId) { return this.facebook.getKeywordDetail(kw, userId); }
    async getTrendingKeywords(cat, userId, type) { return this.facebook.getTrendingKeywords(cat, userId, type); }
    async evaluateAndImproveContent(content, platform, userId) {
        return this.facebook.evaluateAndImproveContent(content, platform, userId);
    }
    async analyzeTikTokChannel(id, userId) { return this.tiktok.analyzeTikTokChannel(id, userId); }
    async generateTikTokVideoScript(id, niche, userId) { return this.tiktok.generateTikTokVideoScript(id, niche, userId); }
    async getTikTokTrending(region, count, refresh, category, userId) {
        return this.tiktok.getTikTokTrending(region, count, refresh, category, userId);
    }
    async downloadTikTokVideo(url, userId) { return this.tiktok.downloadTikTokVideo(url, userId); }
    async generateVideoScript(body, userId) { return this.tiktok.generateTikTokVideoScript(body.uniqueId, body.niche, userId); }
    async runAutomationById(id, userId, isTest) { return this.automation.runAutomationById(id, userId, isTest); }
    async generateLandingPage(prompt) { return this.automation.generateLandingPage(prompt); }
    async scrapeProductData(url, userId) { return this.automation.scrapeProductData(url, userId); }
    async generateMarketingPlan(body, userId) { return this.automation.generateMarketingPlan(body, userId); }
    async generateAutoSubtitles(file, src, target, style, size, y, userId, color, bgColor) {
        return this.video.generateAutoSubtitles(file, src, target, style, size, y, userId, color, bgColor);
    }
    async renderAutomationVideo(resId, userId, wfId) { return this.video.renderAutomationVideo(resId, userId, wfId); }
    async generateVideoDubbing(file, voice, lang, userId, bg, dub, sub, style) {
        return this.video.videoDubbing(file, voice, lang, userId, bg, dub, sub, style);
    }
    async generateKolVideo(img, vid, userId) { return this.video.generateKolVideo(img, vid, userId); }
    async processAutoSubJob(job) { return this.video.processAutoSubJob(job); }
    async processDubbingJob(job) { return this.video.processDubbingJob(job); }
    async processKolVideoJob(job) { return this.video.processKolVideoJob(job); }
    async processReburnJob(job) { return this.video.processReburnJob(job); }
    async getJobStatus(jobId) { return this.base.getJobStatus(jobId); }
    async getMembershipConfigs() { return this.base.getMembershipConfigs(); }
    async downloadProxy(url) { return this.base.downloadProxy(url); }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_base_service_1.AiBaseService,
        ai_facebook_service_1.AiFacebookService,
        ai_tiktok_service_1.AiTikTokService,
        ai_media_service_1.AiMediaService,
        ai_automation_service_1.AiAutomationService,
        ai_video_processor_service_1.AiVideoProcessorService])
], AiService);
//# sourceMappingURL=ai.service.js.map