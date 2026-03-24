import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from './ai.service';
import { Logger } from '@nestjs/common';

@Processor('video-processing', {
    concurrency: 1,
    lockDuration: 600000, // 10 phút khóa, giúp tránh kẹt quá trình renew nếu FFmpeg chiếm hết CPU
})
export class AiProcessor extends WorkerHost {
    private readonly logger = new Logger(AiProcessor.name);

    constructor(private readonly aiService: AiService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Đang xử lý Job ${job.id} loại: ${job.name}`);

        const { type, data } = job.data;

        try {
            if (type === 'auto-sub') {
                // Giả định chúng ta sẽ chuyển logic generateAutoSubtitles 
                // thành một hàm có thể theo dõi tiến độ
                return await this.aiService.processAutoSubJob(job);
            } else if (type === 'video-dubbing') {
                return await this.aiService.processDubbingJob(job);
            } else if (type === 'kol-video') {
                return await this.aiService.processKolVideoJob(job);
            } else if (type === 're-burn') {
                return await this.aiService.processReburnJob(job);
            }
        } catch (error) {
            this.logger.error(`Lỗi khi xử lý Job ${job.id}: ${error.message}`);
            throw error;
        }
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`Job ${job.id} đã hoàn thành!`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.id} thất bại: ${error.message}`);
    }
}
