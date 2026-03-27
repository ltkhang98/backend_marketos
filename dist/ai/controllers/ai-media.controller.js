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
exports.AiMediaController = void 0;
const common_1 = require("@nestjs/common");
const ai_media_service_1 = require("../services/ai-media.service");
const firebase_guard_1 = require("../../auth/firebase.guard");
let AiMediaController = class AiMediaController {
    mediaService;
    constructor(mediaService) {
        this.mediaService = mediaService;
    }
    async textToSpeech(body, req) {
        return this.mediaService.generateSpeech(body, req.user.uid);
    }
    async generateMockup(body, req) {
        return this.mediaService.generateImageMockup(body.prompt, body.productImage, body.logoImage, body.modelImage, body.aspectRatio, req.user.uid);
    }
    async generateSmartBanner(body, req) {
        return this.mediaService.generateSmartBanner(body, req.user.uid);
    }
    async generateVisualClone(body, req) {
        return this.mediaService.generateVisualClone(body.modelImage, body.templatePrompt, req.user.uid, body.templateImage, body.count, body.fidelity, body.creativity);
    }
    async generateKocProduct(body, req) {
        return this.mediaService.generateKocProductImage(body.kocId, body.productImage, body.prompt, req.user.uid, body.modelImage, body.bgImage);
    }
    async generateKocVisual(body, req) {
        return this.mediaService.generateKocVisual(body, req.user.uid);
    }
    async getAiKocs(req) {
        return this.mediaService.getAiKocs(req.user.uid);
    }
    async createAiKoc(body, req) {
        return this.mediaService.createAiKoc(body, req.user.uid);
    }
    async deleteAiKoc(id, req) {
        return this.mediaService.deleteAiKoc(id, req.user.uid);
    }
    async videoDownload(body, req) {
        return this.mediaService.downloadUniversalVideo(body.url, req.user.uid);
    }
    async removeBackground(body, req) {
        return this.mediaService.removeBackground(body.url, req.user.uid);
    }
    async enhanceImage(body, req) {
        return this.mediaService.enhanceImage(body.url, req.user.uid);
    }
    async download(url, filename, res) {
        return this.mediaService.proxyDownload(url, filename, res);
    }
    async getJobStatus(jobId) {
        return this.mediaService.getJobStatus(jobId);
    }
};
exports.AiMediaController = AiMediaController;
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('tts'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "textToSpeech", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-mockup'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "generateMockup", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-smart-banner'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "generateSmartBanner", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('visual-clone'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "generateVisualClone", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-koc-product'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "generateKocProduct", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-koc-visual'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "generateKocVisual", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Get)('koc'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "getAiKocs", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('koc'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "createAiKoc", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Delete)('koc/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "deleteAiKoc", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('video-download'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "videoDownload", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('remove-background'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "removeBackground", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('enhance-image'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "enhanceImage", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Get)('download'),
    __param(0, (0, common_1.Query)('url')),
    __param(1, (0, common_1.Query)('filename')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "download", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Get)('job-status/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiMediaController.prototype, "getJobStatus", null);
exports.AiMediaController = AiMediaController = __decorate([
    (0, common_1.Controller)('ai/media'),
    __metadata("design:paramtypes", [ai_media_service_1.AiMediaService])
], AiMediaController);
//# sourceMappingURL=ai-media.controller.js.map