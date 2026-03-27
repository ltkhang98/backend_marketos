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
exports.AiAutomationController = void 0;
const common_1 = require("@nestjs/common");
const ai_automation_service_1 = require("../services/ai-automation.service");
const firebase_guard_1 = require("../../auth/firebase.guard");
let AiAutomationController = class AiAutomationController {
    automationService;
    constructor(automationService) {
        this.automationService = automationService;
    }
    async runAutomation(id, body, req) {
        return this.automationService.runAutomationById(id, req.user.uid, body.isTest === true);
    }
    async generateLandingPage(body, req) {
        return this.automationService.generateLandingPage(body.prompt, req.user.uid);
    }
    async scrapeProduct(body, req) {
        return this.automationService.scrapeProductData(body.url, req.user.uid);
    }
    async marketingPlan(body, req) {
        return this.automationService.generateMarketingPlan(body, req.user.uid);
    }
};
exports.AiAutomationController = AiAutomationController;
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('run/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiAutomationController.prototype, "runAutomation", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('generate-landing-page'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiAutomationController.prototype, "generateLandingPage", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('scrape-product'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiAutomationController.prototype, "scrapeProduct", null);
__decorate([
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    (0, common_1.Post)('marketing-plan'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiAutomationController.prototype, "marketingPlan", null);
exports.AiAutomationController = AiAutomationController = __decorate([
    (0, common_1.Controller)('ai/automation'),
    __metadata("design:paramtypes", [ai_automation_service_1.AiAutomationService])
], AiAutomationController);
//# sourceMappingURL=ai-automation.controller.js.map