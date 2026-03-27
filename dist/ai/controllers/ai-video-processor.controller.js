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
exports.AiVideoProcessorController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const ai_video_processor_service_1 = require("../services/ai-video-processor.service");
const firebase_guard_1 = require("../../auth/firebase.guard");
let AiVideoProcessorController = class AiVideoProcessorController {
    videoProcessorService;
    constructor(videoProcessorService) {
        this.videoProcessorService = videoProcessorService;
    }
    async autoSubtitles(file, srcLang, targetLang, style, fontSize, yPos, subColor, subBgColor, subBgOpacity, req) {
        if (!file)
            throw new common_1.BadRequestException('Không tìm thấy file video tải lên.');
        return await this.videoProcessorService.generateAutoSubtitles(file, srcLang || 'Auto', targetLang || 'Vietnamese', style || 'tiktok', Number(fontSize), Number(yPos), req.user.uid, subColor, subBgColor, Number(subBgOpacity));
    }
    async videoDubbing(file, targetVoice, targetLang, bgVolume, dubVolume, showSubtitles, subColor, subFontSize, subBgColor, subVerticalPos, req) {
        if (!file)
            throw new common_1.BadRequestException('Không tìm thấy file video tải lên.');
        return await this.videoProcessorService.videoDubbing(file, targetVoice || 'banmai', targetLang || 'Vietnamese', req.user.uid, bgVolume ? parseFloat(bgVolume) : 0.4, dubVolume ? parseFloat(dubVolume) : 1.5, showSubtitles === 'true', {
            color: subColor || '#FFFFFF',
            fontSize: subFontSize ? parseInt(subFontSize) : 20,
            bgColor: subBgColor || '#000000',
            verticalPos: subVerticalPos ? parseInt(subVerticalPos) : 30
        });
    }
    async renderAutomationVideo(resultId, body, req) {
        return this.videoProcessorService.renderAutomationVideo(resultId, req.user.uid, body.workflowId);
    }
    async generateKolVideo(body, req) {
        return this.videoProcessorService.generateKolVideo(body.imageUrl, body.videoUrl, req.user.uid);
    }
    async generateVideoConcept(body, req) {
        return this.videoProcessorService.generateVideoConcept(body, req.user.uid);
    }
    async streamSubVideo(videoId, res) {
        return this.videoProcessorService.streamVideo(videoId, 'auto_sub', res);
    }
    async downloadSubVideo(videoId, res) {
        return this.videoProcessorService.streamVideo(videoId, 'auto_sub', res, true);
    }
    async streamDubVideo(videoId, res) {
        return this.videoProcessorService.streamVideo(videoId, 'video_dub', res);
    }
    async downloadDubVideo(videoId, res) {
        return this.videoProcessorService.streamVideo(videoId, 'video_dub', res, true);
    }
    async updateSub(body, req) {
        return this.videoProcessorService.updateSubtitle(body, req.user.uid);
    }
    async reburnVideo(body, req) {
        return this.videoProcessorService.reburnVideo(body, req.user.uid);
    }
    async getJobStatus(jobId) {
        return this.videoProcessorService.getJobStatus(jobId);
    }
};
exports.AiVideoProcessorController = AiVideoProcessorController;
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
    __param(8, (0, common_1.Body)('subBgOpacity')),
    __param(9, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Number, Number, String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "autoSubtitles", null);
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
], AiVideoProcessorController.prototype, "videoDubbing", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('render-automation/:resultId'),
    __param(0, (0, common_1.Param)('resultId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "renderAutomationVideo", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('kol-video'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "generateKolVideo", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-concept'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "generateVideoConcept", null);
__decorate([
    (0, common_1.Get)('stream-sub-video/:videoId'),
    __param(0, (0, common_1.Param)('videoId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "streamSubVideo", null);
__decorate([
    (0, common_1.Get)('download-sub-video/:videoId'),
    __param(0, (0, common_1.Param)('videoId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "downloadSubVideo", null);
__decorate([
    (0, common_1.Get)('stream-dub-video/:videoId'),
    __param(0, (0, common_1.Param)('videoId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "streamDubVideo", null);
__decorate([
    (0, common_1.Get)('download-dub-video/:videoId'),
    __param(0, (0, common_1.Param)('videoId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "downloadDubVideo", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('update-sub'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "updateSub", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('reburn-video'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "reburnVideo", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Get)('job-status/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiVideoProcessorController.prototype, "getJobStatus", null);
exports.AiVideoProcessorController = AiVideoProcessorController = __decorate([
    (0, common_1.Controller)('ai/video-processor'),
    __metadata("design:paramtypes", [ai_video_processor_service_1.AiVideoProcessorService])
], AiVideoProcessorController);
//# sourceMappingURL=ai-video-processor.controller.js.map