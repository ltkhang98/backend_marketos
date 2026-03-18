import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FirebaseGuard } from '../auth/firebase.guard';

@Controller('store-orders')
@UseGuards(FirebaseGuard)
export class StoreOrdersController {
    constructor(
        private readonly mailService: MailService,
        private readonly notificationsService: NotificationsService
    ) { }

    @Post('confirm')
    async confirmOrder(@Body() body: any) {
        const { email, orderId, customerName, totalAmount, items } = body;

        // Gửi email xác nhận
        const success = await this.mailService.sendOrderConfirmation(email, orderId, customerName);

        // Tạo thông báo Firestore (Thay thế cho SSE thiếu ổn định trên Serverless)
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
}
