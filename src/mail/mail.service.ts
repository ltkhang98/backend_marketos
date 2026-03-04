import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendOrderConfirmation(to: string, orderId: string, customerName: string) {
        const from = this.configService.get<string>('EMAIL_FROM');

        // HTML Template
        const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4f46e5;">Xác nhận đặt hàng thành công!</h2>
        <p>Chào <strong>${customerName}</strong>,</p>
        <p>Cảm ơn bạn đã tin tưởng và mua sắm tại <strong>Vibe Code</strong>.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">Mã đơn hàng của bạn là:</p>
          <h3 style="margin: 5px 0; color: #1f2937;">${orderId}</h3>
        </div>
        <p>Chúng tôi sẽ sớm liên hệ với bạn để xác nhận thông tin giao hàng.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">Đây là email tự động, vui lòng không phản hồi lại email này.</p>
      </div>
    `;

        try {
            await this.transporter.sendMail({
                from,
                to,
                subject: `Xác nhận đơn hàng đặt thành công #${orderId}`,
                html,
            });
            console.log(`Email đã được gửi thành công đến: ${to}`);
            return true;
        } catch (error) {
            console.error('Lỗi khi gửi email:', error);
            return false;
        }
    }
}
