import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    sendOrderConfirmation(to: string, orderId: string, customerName: string): Promise<boolean>;
}
