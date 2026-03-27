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
exports.LinksController = void 0;
const common_1 = require("@nestjs/common");
const firebase_guard_1 = require("../auth/firebase.guard");
const links_service_1 = require("./links.service");
let LinksController = class LinksController {
    linksService;
    constructor(linksService) {
        this.linksService = linksService;
    }
    async shorten(body, req) {
        return this.linksService.createShortLink(body.url, req.user.uid, body.customAlias);
    }
    async getUserLinks(req) {
        return this.linksService.getLinksByUser(req.user.uid);
    }
    async deleteLink(shortId, req) {
        return this.linksService.deleteLink(shortId, req.user.uid);
    }
    async getAnalytics(req, shortId) {
        return this.linksService.getAnalytics(req.user.uid, shortId);
    }
    async redirect(shortId, res) {
        const originalUrl = await this.linksService.getOriginalUrl(shortId);
        if (originalUrl) {
            return res.redirect(originalUrl);
        }
        return res.status(common_1.HttpStatus.NOT_FOUND).send('Link not found');
    }
};
exports.LinksController = LinksController;
__decorate([
    (0, common_1.Post)('shorten'),
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "shorten", null);
__decorate([
    (0, common_1.Get)('user'),
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "getUserLinks", null);
__decorate([
    (0, common_1.Delete)(':shortId'),
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    __param(0, (0, common_1.Param)('shortId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "deleteLink", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('shortId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('redirect/:shortId'),
    __param(0, (0, common_1.Param)('shortId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LinksController.prototype, "redirect", null);
exports.LinksController = LinksController = __decorate([
    (0, common_1.Controller)('links'),
    __metadata("design:paramtypes", [links_service_1.LinksService])
], LinksController);
//# sourceMappingURL=links.controller.js.map