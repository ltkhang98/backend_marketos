import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from './ai.service';
export declare class AiProcessor extends WorkerHost {
    private readonly aiService;
    private readonly logger;
    constructor(aiService: AiService);
    process(job: Job<any, any, string>): Promise<any>;
    onCompleted(job: Job): void;
    onFailed(job: Job, error: Error): void;
}
