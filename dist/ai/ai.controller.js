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
const ai_base_service_1 = require("./services/ai-base.service");
const firebase_guard_1 = require("../auth/firebase.guard");
let AiController = class AiController {
    baseService;
    constructor(baseService) {
        this.baseService = baseService;
    }
    async getJobStatus(jobId) {
        try {
            return await this.baseService.getJobStatus(jobId);
        }
        catch (error) {
            return {
                id: jobId,
                state: 'failed',
                reason: 'Internal Server Error: ' + (error.message || String(error))
            };
        }
    }
    async getMembershipConfigs() {
        return this.baseService.getMembershipConfigs();
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Get)('job-status/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getJobStatus", null);
__decorate([
    (0, common_1.Get)('membership-configs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getMembershipConfigs", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_base_service_1.AiBaseService])
], AiController);
//# sourceMappingURL=ai.controller.js.map