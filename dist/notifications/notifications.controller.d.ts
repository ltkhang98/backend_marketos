import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(): Promise<{
        id: string;
    }[]>;
    create(body: any, req: any): Promise<any>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
