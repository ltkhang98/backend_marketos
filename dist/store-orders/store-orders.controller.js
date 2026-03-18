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
exports.StoreOrdersController = void 0;
const common_1 = require("@nestjs/common");
const mail_service_1 = require("../mail/mail.service");
const notifications_service_1 = require("../notifications/notifications.service");
const firebase_guard_1 = require("../auth/firebase.guard");
let StoreOrdersController = class StoreOrdersController {
    mailService;
    notificationsService;
    constructor(mailService, notificationsService) {
        this.mailService = mailService;
        this.notificationsService = notificationsService;
    }
    async confirmOrder(body) {
        const { email, orderId, customerName, totalAmount, items } = body;
        const success = await this.mailService.sendOrderConfirmation(email, orderId, customerName);
        await this.notificationsService.createSystemNotification({
            type: 'success',
            title: `Đơn hàng mới: #${orderId.substring(0, 8)}`,
            message: `Khách hàng ${customerName} vừa đặt hàng thành công.`,
            orderId: orderId,
            customerName: customerName,
            totalAmount: totalAmount,
            source: 'store'
        });
        return {
            success,
            message: success ? 'Email confirmation sent' : 'Không thể gửi email xác nhận. Vui lòng kiểm tra cấu hình SMTP trong file .env (App Password Gmail có thể đã hết hạn hoặc sai).',
        };
    }
};
exports.StoreOrdersController = StoreOrdersController;
__decorate([
    (0, common_1.Post)('confirm'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StoreOrdersController.prototype, "confirmOrder", null);
exports.StoreOrdersController = StoreOrdersController = __decorate([
    (0, common_1.Controller)('store-orders'),
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    __metadata("design:paramtypes", [mail_service_1.MailService,
        notifications_service_1.NotificationsService])
], StoreOrdersController);
//# sourceMappingURL=store-orders.controller.js.map