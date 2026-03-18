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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const ai_service_1 = require("./ai.service");
const firebase_guard_1 = require("../auth/firebase.guard");
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async generateSocialContent(body, req) {
        return this.aiService.generateContent(body, req.user.uid);
    }
    async textToSpeech(body, req) {
        return this.aiService.generateSpeech(body, req.user.uid);
    }
    async download(url, filename, res) {
        try {
            const streamResponse = await this.aiService.downloadProxy(url);
            const contentType = streamResponse.headers['content-type'] || 'application/octet-stream';
            const contentLength = streamResponse.headers['content-length'];
            const headers = {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename || 'marketos-download'}"`,
            };
            if (contentLength) {
                headers['Content-Length'] = contentLength;
            }
            res.set(headers);
            streamResponse.data.pipe(res);
        }
        catch (error) {
            console.error('Download Proxy Error:', error.message);
            res.status(500).send('Lỗi khi tải file qua proxy: ' + error.message);
        }
    }
    async generateMockup(body, req) {
        return this.aiService.generateImageMockup(body.prompt, body.productImage, body.logoImage, body.modelImage, body.aspectRatio, req.user.uid);
    }
    async generateSmartBanner(body, req) {
        return this.aiService.generateSmartBanner(body, req.user.uid);
    }
    async scrapeProduct(body, req) {
        return this.aiService.scrapeProductData(body.url, req.user.uid);
    }
    async generateVideoConcept(body, req) {
        return this.aiService.generateVideoScript(body, req.user.uid);
    }
    async generatePlanning(body, req) {
        return this.aiService.generateMarketingPlan(body, req.user.uid);
    }
    async tiktokDownload(body, req) {
        return this.aiService.downloadTikTokVideo(body.url, req.user.uid);
    }
    async videoDownload(body, req) {
        return this.aiService.downloadUniversalVideo(body.url, req.user.uid);
    }
    async tiktokAnalytics(body, req) {
        try {
            return await this.aiService.analyzeTikTokChannel(body.uniqueId, req.user.uid);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async tiktokGenerateScript(body, req) {
        try {
            return await this.aiService.generateTikTokVideoScript(body.uniqueId, body.niche, req.user.uid);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async fbAdAnalysis(body, req) {
        try {
            const userId = req.user.uid;
            return await this.aiService.analyzeFacebookAd(body.url, userId);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async getAdsAnalysisHistory(req) {
        try {
            const userId = req.user.uid;
            return await this.aiService.getAdsAnalysisHistory(userId);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async fbAdComparison(body, req) {
        try {
            return await this.aiService.compareFacebookAds(body.analysisA, body.analysisB, req.user.uid);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async fetchSocialContent(body, req) {
        try {
            return await this.aiService.fetchContentFromUrl(body.url, req.user.uid);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async discoveryKeyword(body, req) {
        try {
            return await this.aiService.searchKeywordDiscovery(body.keyword, 0, req.user.uid);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async keywordDetail(body, req) {
        try {
            return await this.aiService.getKeywordDetail(body.keyword, req.user.uid);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async trendingKeywords(body, req) {
        try {
            return await this.aiService.getTrendingKeywords(body.category, req.user.uid, body.type || 'hot');
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async evaluateImproveContent(body, req) {
        try {
            return await this.aiService.evaluateAndImproveContent(body.content, body.platform, req.user.uid);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async tiktokTrending(region, count, category, refresh, req) {
        try {
            return await this.aiService.getTikTokTrending(region, count, refresh === 'true', category, req.user.uid);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async generateLandingPage(body) {
        try {
            return await this.aiService.generateLandingPage(body.prompt);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async autoSubtitles(file, srcLang, targetLang, style, fontSize, yPos, subColor, subBgColor, req) {
        if (!file) {
            throw new common_1.InternalServerErrorException('Không tìm thấy file video tải lên.');
        }
        return await this.aiService.generateAutoSubtitles(file, srcLang || 'Auto', targetLang || 'Vietnamese', style || 'tiktok', fontSize, yPos, req.user.uid, subColor, subBgColor);
    }
    async streamBurnedVideo(id, req, res) {
        try {
            const { stream, size, path } = await this.aiService.streamBurnedVideo(id, req, res);
        }
        catch (error) {
            if (!res.headersSent) {
                res.status(500).send('Lỗi khi xem video: ' + error.message);
            }
        }
    }
    async downloadBurnedVideo(id, res) {
        try {
            const { stream, size } = await this.aiService.downloadBurnedVideo(id);
            res.set({
                'Content-Type': 'video/mp4',
                'Content-Length': size.toString(),
                'Content-Disposition': 'attachment; filename="auto-sub-' + id + '.mp4"',
            });
            stream.pipe(res);
        }
        catch (error) {
            res.status(500).send('Lỗi khi tải video: ' + error.message);
        }
    }
    async updateSubtitles(videoId, srtContent, style, fontSize, yPos, subColor, subBgColor, req) {
        return await this.aiService.updateSrtContent(videoId, srtContent, style, fontSize, yPos, subColor, subBgColor);
    }
    async runAutomation(id, body, req) {
        try {
            const isTest = body.isTest === true;
            return await this.aiService.runAutomationById(id, req.user.uid, isTest);
        }
        catch (error) {
            console.error('Lỗi API run-automation:', error);
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async renderAutomationVideo(resultId, body, req) {
        try {
            return await this.aiService.renderAutomationVideo(resultId, req.user.uid, body.workflowId);
        }
        catch (error) {
            console.error('Lỗi API render-video:', error);
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async streamDubbedVideo(jobId, req, res) {
        try {
            await this.aiService.streamDubbedVideo(jobId, req, res);
        }
        catch (error) {
            if (!res.headersSent) {
                res.status(500).send('Lỗi khi xem video lồng tiếng: ' + error.message);
            }
        }
    }
    async videoDubbing(file, targetVoice, targetLang, bgVolume, dubVolume, showSubtitles, subColor, subFontSize, subBgColor, subVerticalPos, req) {
        if (!file) {
            throw new common_1.InternalServerErrorException('Không tìm thấy file video tải lên.');
        }
        return await this.aiService.generateVideoDubbing(file, targetVoice || 'banmai', targetLang || 'Vietnamese', req.user.uid, bgVolume ? parseFloat(bgVolume) : 0.4, dubVolume ? parseFloat(dubVolume) : 1.5, showSubtitles === 'true', {
            color: subColor || '#FFFFFF',
            fontSize: subFontSize ? parseInt(subFontSize) : 20,
            bgColor: subBgColor || '#000000',
            verticalPos: subVerticalPos ? parseInt(subVerticalPos) : 30
        });
    }
    async getJobStatus(jobId) {
        return this.aiService.getJobStatus(jobId);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-social-content'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateSocialContent", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('text-to-speech'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "textToSpeech", null);
__decorate([
    (0, common_1.Get)('download'),
    __param(0, (0, common_1.Query)('url')),
    __param(1, (0, common_1.Query)('filename')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "download", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-mockup'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateMockup", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-smart-banner'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateSmartBanner", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('scrape-product'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "scrapeProduct", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-video-concept'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateVideoConcept", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-planning'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generatePlanning", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('tiktok-download'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "tiktokDownload", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('video-download'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "videoDownload", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('tiktok-analytics'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "tiktokAnalytics", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('tiktok-generate-script'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "tiktokGenerateScript", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('fb-ad-analysis'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "fbAdAnalysis", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Get)('fb-ad-analysis-history'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getAdsAnalysisHistory", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('fb-ad-comparison'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "fbAdComparison", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('fetch-social-content'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "fetchSocialContent", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('discovery-keyword'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "discoveryKeyword", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('keyword-detail'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "keywordDetail", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('trending-keywords'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "trendingKeywords", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('evaluate-improve-content'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "evaluateImproveContent", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Get)('tiktok-trending'),
    __param(0, (0, common_1.Query)('region')),
    __param(1, (0, common_1.Query)('count')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('refresh')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "tiktokTrending", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-landing-page'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateLandingPage", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('auto-sub'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('video')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('srcLang')),
    __param(2, (0, common_1.Body)('targetLang')),
    __param(3, (0, common_1.Body)('style')),
    __param(4, (0, common_1.Body)('fontSize')),
    __param(5, (0, common_1.Body)('yPos')),
    __param(6, (0, common_1.Body)('subColor')),
    __param(7, (0, common_1.Body)('subBgColor')),
    __param(8, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Number, Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "autoSubtitles", null);
__decorate([
    (0, common_1.Get)('stream-sub-video/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "streamBurnedVideo", null);
__decorate([
    (0, common_1.Get)('download-sub-video/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "downloadBurnedVideo", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('update-sub'),
    __param(0, (0, common_1.Body)('videoId')),
    __param(1, (0, common_1.Body)('srtContent')),
    __param(2, (0, common_1.Body)('style')),
    __param(3, (0, common_1.Body)('fontSize')),
    __param(4, (0, common_1.Body)('yPos')),
    __param(5, (0, common_1.Body)('subColor')),
    __param(6, (0, common_1.Body)('subBgColor')),
    __param(7, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "updateSubtitles", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('run-automation/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "runAutomation", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('render-automation-video/:resultId'),
    __param(0, (0, common_1.Param)('resultId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "renderAutomationVideo", null);
__decorate([
    (0, common_1.Get)('stream-dub-video/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "streamDubbedVideo", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('video-dubbing'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('video')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('targetVoice')),
    __param(2, (0, common_1.Body)('targetLang')),
    __param(3, (0, common_1.Body)('bgVolume')),
    __param(4, (0, common_1.Body)('dubVolume')),
    __param(5, (0, common_1.Body)('showSubtitles')),
    __param(6, (0, common_1.Body)('subColor')),
    __param(7, (0, common_1.Body)('subFontSize')),
    __param(8, (0, common_1.Body)('subBgColor')),
    __param(9, (0, common_1.Body)('subVerticalPos')),
    __param(10, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "videoDubbing", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Get)('job-status/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getJobStatus", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map