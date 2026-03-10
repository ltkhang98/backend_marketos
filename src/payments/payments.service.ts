import { Injectable, Inject, Logger, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: admin.app.App,
    ) { }

    async handleSePayWebhook(data: any, apiKey: string) {
        // Kiểm tra API Key từ SePay để bảo mật
        const expectedApiKey = process.env.SEPAY_API_KEY;
        if (expectedApiKey && (!apiKey || apiKey !== expectedApiKey)) {
            this.logger.error(`[Webhook] API Key không hợp lệ hoặc thiếu. Nhận được: ${apiKey}`);
            throw new UnauthorizedException('API Key không hợp lệ');
        } else if (!expectedApiKey) {
            this.logger.warn(`[Webhook] SEPAY_API_KEY chưa được cấu hình. Tiếp tục xử lý Webhook mà không xác thực...`);
        }

        // SePay might send data in different field names depending on version/config
        const transactionContent = data.content || data.transactionContent || data.description;
        const amountIn = data.transferAmount || data.amountIn || data.amount;
        const sepayId = data.id || data.transactionId;

        this.logger.log(`[Webhook] Nhận tín hiệu từ SePay. Nội dung: "${transactionContent}", Số tiền: ${amountIn}`);

        // Match MAKETOS followed by 6-10 characters (SettingsPage produces 7: MAKETOS + 7 chars)
        const match = transactionContent?.match(/MAKETOS[A-Z0-9]{6,10}/i);
        if (!match) {
            this.logger.warn(`[Webhook] Không tìm thấy mã MAKETOS hợp lệ trong nội dung: ${transactionContent}`);
            return { status: 'error', message: 'Invalid code' };
        }

        const paymentCode = match[0].toUpperCase();
        const db = this.firebaseAdmin.firestore();
        const incomingAmount = Number(amountIn); // Đảm bảo là kiểu số

        this.logger.log(`[Webhook] Đang tìm giao dịch: ${paymentCode} với số tiền: ${incomingAmount}`);

        // 1. Find the pending transaction in Firestore
        const transQuery = await db.collection('transactions')
            .where('paymentCode', '==', paymentCode)
            .get();

        if (transQuery.empty) {
            this.logger.warn(`[Webhook] Không tìm thấy giao dịch nào có mã: ${paymentCode}`);
            return { status: 'error', message: 'Transaction not found' };
        }

        const transDoc = transQuery.docs[0];
        const transData = transDoc.data();

        // Kiểm tra xem đã xử lý chưa
        if (transData.status === 'completed') {
            this.logger.log(`[Webhook] Giao dịch ${paymentCode} đã được xử lý từ trước.`);
            return { status: 'success', message: 'Already processed' };
        }

        // 2. Verify amount
        if (incomingAmount < transData.amount) {
            this.logger.warn(`[Webhook] Sai số tiền cho ${paymentCode}: Cần ít nhất ${transData.amount}, nhận được ${incomingAmount}`);
            return { status: 'error', message: 'Amount mismatch' };
        }

        // 3. Update Transaction Status
        await transDoc.ref.update({
            status: 'completed',
            sepayId: sepayId,
            actualAmount: amountIn,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 4. Handle Action based on Transaction Type
        const userRef = db.collection('users').doc(transData.uid);

        if (transData.type === 'credit') {
            const tokensToAdd = Number(transData.tokens) || 0;
            // Use update to increment tokens
            await userRef.update({
                tokens: admin.firestore.FieldValue.increment(tokensToAdd),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            this.logger.log(`Successfully added ${tokensToAdd} credits to user ${transData.uid}`);
        } else if (transData.type === 'plan') {
            const newRole = transData.planId === 'free' ? 'user' : transData.planId;
            await userRef.update({
                plan: transData.planId,
                role: newRole,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            this.logger.log(`Successfully upgraded user ${transData.uid} to plan ${transData.planId} (Role: ${newRole})`);
        } else {
            this.logger.warn(`[Webhook] Giao dịch loại "${transData.type}" không còn được hỗ trợ. Chỉ hỗ trợ "credit" hoặc "plan".`);
        }

        return { status: 'success' };
    }
}
