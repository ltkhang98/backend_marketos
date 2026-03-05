import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly logger;
    constructor(paymentsService: PaymentsService);
    handleWebhook(data: any, headers: any): Promise<{
        status: string;
        message: string;
    } | {
        status: string;
        message?: undefined;
    }>;
    verifyWebhook(): {
        status: string;
        message: string;
        tested_paths: string[];
        note: string;
    };
    rootVerify(): string;
}
