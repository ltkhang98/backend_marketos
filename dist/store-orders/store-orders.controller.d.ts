import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class StoreOrdersController {
    private readonly mailService;
    private readonly notificationsService;
    constructor(mailService: MailService, notificationsService: NotificationsService);
    confirmOrder(body: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
