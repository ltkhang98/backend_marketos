import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('store-orders')
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
            message: success ? 'Email confirmation sent' : 'Failed to send email confirmation',
        };
    }
}
