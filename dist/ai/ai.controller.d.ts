import { AiBaseService } from './services/ai-base.service';
export declare class AiController {
    private readonly baseService;
    constructor(baseService: AiBaseService);
    getJobStatus(jobId: string): Promise<{
        id: string;
        state: string;
    } | {
        id: string;
        state: string;
        reason: string;
    }>;
    getMembershipConfigs(): Promise<any>;
}
