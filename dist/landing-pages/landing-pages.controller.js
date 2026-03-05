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
exports.LandingPagesController = void 0;
const common_1 = require("@nestjs/common");
const landing_pages_service_1 = require("./landing-pages.service");
let LandingPagesController = class LandingPagesController {
    landingPagesService;
    constructor(landingPagesService) {
        this.landingPagesService = landingPagesService;
    }
    async savePage(body) {
        return this.landingPagesService.savePage(body.userId, body.pageData);
    }
    async getPagesByUser(userId) {
        return this.landingPagesService.getPagesByUser(userId);
    }
    async getPageById(id) {
        return this.landingPagesService.getPageById(id);
    }
    async deletePage(id, userId) {
        return this.landingPagesService.deletePage(id, userId);
    }
};
exports.LandingPagesController = LandingPagesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LandingPagesController.prototype, "savePage", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LandingPagesController.prototype, "getPagesByUser", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LandingPagesController.prototype, "getPageById", null);
__decorate([
    (0, common_1.Delete)(':id/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LandingPagesController.prototype, "deletePage", null);
exports.LandingPagesController = LandingPagesController = __decorate([
    (0, common_1.Controller)('landing-pages'),
    __metadata("design:paramtypes", [landing_pages_service_1.LandingPagesService])
], LandingPagesController);
//# sourceMappingURL=landing-pages.controller.js.map