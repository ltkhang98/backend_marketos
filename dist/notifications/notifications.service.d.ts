export declare class NotificationsService {
    private db;
    private collection;
    findAll(): Promise<{
        id: string;
    }[]>;
    create(notificationData: any, adminUid: string): Promise<any>;
    createSystemNotification(notificationData: any): Promise<any>;
    remove(id: string, adminUid: string): Promise<{
        success: boolean;
    }>;
}
