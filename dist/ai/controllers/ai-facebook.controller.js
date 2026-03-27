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
exports.AiFacebookController = void 0;
const common_1 = require("@nestjs/common");
const ai_facebook_service_1 = require("../services/ai-facebook.service");
const firebase_guard_1 = require("../../auth/firebase.guard");
let AiFacebookController = class AiFacebookController {
    facebookService;
    constructor(facebookService) {
        this.facebookService = facebookService;
    }
    async generateContent(body, req) {
        return this.facebookService.generateSocialContent(body, req.user.uid);
    }
    async fbAdAnalysis(body, req) {
        return this.facebookService.analyzeFacebookAd(body.url, req.user.uid);
    }
    async getAdsAnalysisHistory(req) {
        return this.facebookService.getAdsAnalysisHistory(req.user.uid);
    }
    async fbAdComparison(body, req) {
        return this.facebookService.compareAds(body.analysisA, body.analysisB, req.user.uid);
    }
    async fetchSocialContent(body, req) {
        return this.facebookService.fetchContentFromUrl(body.url, req.user.uid);
    }
    async discoveryKeyword(body, req) {
        return this.facebookService.searchKeywordDiscovery(body.keyword, 0, req.user.uid);
    }
    async getKeywordDetail(keyword, req) {
        return this.facebookService.getKeywordDetail(keyword, req.user.uid);
    }
    async getTrendingKeywords(body, req) {
        return this.facebookService.getTrendingKeywords(body.category, req.user.uid, body.type);
    }
    async evaluateContent(body, req) {
        return this.facebookService.evaluateAndImproveContent(body.content, body.platform, req.user.uid);
    }
};
exports.AiFacebookController = AiFacebookController;
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-content'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiFacebookController.prototype, "generateContent", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('ad-analysis'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiFacebookController.prototype, "fbAdAnalysis", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Get)('ad-analysis-history'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiFacebookController.prototype, "getAdsAnalysisHistory", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('ad-comparison'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiFacebookController.prototype, "fbAdComparison", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('fetch-social-content'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiFacebookController.prototype, "fetchSocialContent", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('discovery-keyword'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiFacebookController.prototype, "discoveryKeyword", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('keyword-detail'),
    __param(0, (0, common_1.Body)('keyword')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiFacebookController.prototype, "getKeywordDetail", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('trending-keywords'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiFacebookController.prototype, "getTrendingKeywords", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('evaluate-improve-content'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiFacebookController.prototype, "evaluateContent", null);
exports.AiFacebookController = AiFacebookController = __decorate([
    (0, common_1.Controller)('ai/facebook'),
    __metadata("design:paramtypes", [ai_facebook_service_1.AiFacebookService])
], AiFacebookController);
//# sourceMappingURL=ai-facebook.controller.js.map