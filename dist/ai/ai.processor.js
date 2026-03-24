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
var AiProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const ai_service_1 = require("./ai.service");
const common_1 = require("@nestjs/common");
let AiProcessor = AiProcessor_1 = class AiProcessor extends bullmq_1.WorkerHost {
    aiService;
    logger = new common_1.Logger(AiProcessor_1.name);
    constructor(aiService) {
        super();
        this.aiService = aiService;
    }
    async process(job) {
        this.logger.log(`Đang xử lý Job ${job.id} loại: ${job.name}`);
        const { type, data } = job.data;
        try {
            if (type === 'auto-sub') {
                return await this.aiService.processAutoSubJob(job);
            }
            else if (type === 'video-dubbing') {
                return await this.aiService.processDubbingJob(job);
            }
            else if (type === 'kol-video') {
                return await this.aiService.processKolVideoJob(job);
            }
            else if (type === 're-burn') {
                return await this.aiService.processReburnJob(job);
            }
        }
        catch (error) {
            this.logger.error(`Lỗi khi xử lý Job ${job.id}: ${error.message}`);
            throw error;
        }
    }
    onCompleted(job) {
        this.logger.log(`Job ${job.id} đã hoàn thành!`);
    }
    onFailed(job, error) {
        this.logger.error(`Job ${job.id} thất bại: ${error.message}`);
    }
};
exports.AiProcessor = AiProcessor;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], AiProcessor.prototype, "onCompleted", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job, Error]),
    __metadata("design:returntype", void 0)
], AiProcessor.prototype, "onFailed", null);
exports.AiProcessor = AiProcessor = AiProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('video-processing', {
        concurrency: 1,
        lockDuration: 600000,
    }),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiProcessor);
//# sourceMappingURL=ai.processor.js.map