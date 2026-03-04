import { Controller, Post, Body, Sse, MessageEvent } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { Observable, Subject, merge, interval } from 'rxjs';
import { map } from 'rxjs/operators';

// Tạo Subject dùng chung để phát sự kiện
export const newOrderSubject = new Subject<any>();

@Controller('store-orders')
export class StoreOrdersController {
    constructor(private readonly mailService: MailService) { }

    @Post('confirm')
    async confirmOrder(@Body() body: any) {
        const { email, orderId, customerName, totalAmount, items } = body;

        // Gửi email xác nhận
        const success = await this.mailService.sendOrderConfirmation(email, orderId, customerName);

        // Bắn event real-time về client
        newOrderSubject.next({
            ...body,
            time: new Date().toISOString()
        });

        return {
            success,
            message: success ? 'Email confirmation sent' : 'Failed to send email confirmation',
        };
    }

    @Sse('stream')
    streamOrders(): Observable<MessageEvent> {
        return merge(
            newOrderSubject.asObservable().pipe(
                map((data) => ({ data } as MessageEvent))
            ),
            interval(20000).pipe(
                map(() => ({ data: { heartbeat: true } } as MessageEvent))
            )
        );
    }
}
