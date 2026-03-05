import * as admin from 'firebase-admin';
export declare class PaymentsService {
    private readonly firebaseAdmin;
    private readonly logger;
    constructor(firebaseAdmin: admin.app.App);
    handleSePayWebhook(data: any, apiKey: string): Promise<{
        status: string;
        message: string;
    } | {
        status: string;
        message?: undefined;
    }>;
}
