"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const admin = __importStar(require("firebase-admin"));
let PaymentsService = PaymentsService_1 = class PaymentsService {
    firebaseAdmin;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(firebaseAdmin) {
        this.firebaseAdmin = firebaseAdmin;
    }
    async handleSePayWebhook(data, apiKey) {
        const expectedApiKey = process.env.SEPAY_API_KEY;
        if (!apiKey || apiKey !== expectedApiKey) {
            this.logger.error(`[Webhook] API Key không hợp lệ hoặc thiếu. Nhận được: ${apiKey}`);
            throw new common_1.UnauthorizedException('API Key không hợp lệ');
        }
        const transactionContent = data.content || data.transactionContent || data.description;
        const amountIn = data.transferAmount || data.amountIn || data.amount;
        const sepayId = data.id || data.transactionId;
        this.logger.log(`[Webhook] Nhận tín hiệu từ SePay. Nội dung: "${transactionContent}", Số tiền: ${amountIn}`);
        const match = transactionContent?.match(/MAKETOS[A-Z0-9]{6,10}/i);
        if (!match) {
            this.logger.warn(`[Webhook] Không tìm thấy mã MAKETOS hợp lệ trong nội dung: ${transactionContent}`);
            return { status: 'error', message: 'Invalid code' };
        }
        const paymentCode = match[0].toUpperCase();
        const db = this.firebaseAdmin.firestore();
        const incomingAmount = Number(amountIn);
        this.logger.log(`[Webhook] Đang tìm giao dịch: ${paymentCode} với số tiền: ${incomingAmount}`);
        const transQuery = await db.collection('transactions')
            .where('paymentCode', '==', paymentCode)
            .get();
        if (transQuery.empty) {
            this.logger.warn(`[Webhook] Không tìm thấy giao dịch nào có mã: ${paymentCode}`);
            return { status: 'error', message: 'Transaction not found' };
        }
        const transDoc = transQuery.docs[0];
        const transData = transDoc.data();
        if (transData.status === 'completed') {
            this.logger.log(`[Webhook] Giao dịch ${paymentCode} đã được xử lý từ trước.`);
            return { status: 'success', message: 'Already processed' };
        }
        if (incomingAmount < transData.amount) {
            this.logger.warn(`[Webhook] Sai số tiền cho ${paymentCode}: Cần ít nhất ${transData.amount}, nhận được ${incomingAmount}`);
            return { status: 'error', message: 'Amount mismatch' };
        }
        await transDoc.ref.update({
            status: 'completed',
            sepayId: sepayId,
            actualAmount: amountIn,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const userRef = db.collection('users').doc(transData.uid);
        if (transData.type === 'credit') {
            const tokensToAdd = Number(transData.tokens) || 0;
            await userRef.update({
                tokens: admin.firestore.FieldValue.increment(tokensToAdd),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            this.logger.log(`Successfully added ${tokensToAdd} credits to user ${transData.uid}`);
        }
        else {
            this.logger.warn(`[Webhook] Giao dịch loại "${transData.type}" không còn được hỗ trợ. Chỉ hỗ trợ "credit".`);
        }
        return { status: 'success' };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('FIREBASE_ADMIN')),
    __metadata("design:paramtypes", [Object])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map