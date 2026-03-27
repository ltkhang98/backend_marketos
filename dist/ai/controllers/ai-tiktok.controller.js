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
exports.AiTikTokController = void 0;
const common_1 = require("@nestjs/common");
const ai_tiktok_service_1 = require("../services/ai-tiktok.service");
const firebase_guard_1 = require("../../auth/firebase.guard");
let AiTikTokController = class AiTikTokController {
    tiktokService;
    constructor(tiktokService) {
        this.tiktokService = tiktokService;
    }
    async tiktokAnalytics(body, req) {
        return this.tiktokService.analyzeTikTokChannel(body.uniqueId, req.user.uid);
    }
    async tiktokGenerateScript(body, req) {
        return this.tiktokService.generateTikTokVideoScript(body.uniqueId, body.niche, req.user.uid);
    }
    async generateVideoScript(body, req) {
        return this.tiktokService.generateTikTokVideoScript(body.uniqueId, body.niche, req.user.uid);
    }
    async tiktokTrending(region, count, category, refresh, req) {
        try {
            const countNum = parseInt(count?.toString() || '50', 10);
            const isRefresh = (refresh === 'true' || refresh === true);
            return await this.tiktokService.getTikTokTrending(region || 'VN', countNum, isRefresh, category, req.user.uid);
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException('Lỗi khi lấy dữ liệu TikTok: ' + error.message);
        }
    }
    async tiktokDownload(body, req) {
        return this.tiktokService.downloadTikTokVideo(body.url, req.user.uid);
    }
};
exports.AiTikTokController = AiTikTokController;
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('analytics'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiTikTokController.prototype, "tiktokAnalytics", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-script'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiTikTokController.prototype, "tiktokGenerateScript", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-video-script'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiTikTokController.prototype, "generateVideoScript", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Get)('trending'),
    __param(0, (0, common_1.Query)('region')),
    __param(1, (0, common_1.Query)('count')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('refresh')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AiTikTokController.prototype, "tiktokTrending", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('download'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiTikTokController.prototype, "tiktokDownload", null);
exports.AiTikTokController = AiTikTokController = __decorate([
    (0, common_1.Controller)('ai/tiktok'),
    __metadata("design:paramtypes", [ai_tiktok_service_1.AiTikTokService])
], AiTikTokController);
//# sourceMappingURL=ai-tiktok.controller.js.map