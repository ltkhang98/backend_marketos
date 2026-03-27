import { Queue, Job } from 'bullmq';
import { AiBaseService } from './ai-base.service';
import { AiMediaService } from './ai-media.service';
export declare class AiVideoProcessorService {
    private readonly base;
    private readonly media;
    private readonly videoQueue;
    private readonly logger;
    private readonly UPLOADS_DIR;
    private ensureUploadsDir;
    constructor(base: AiBaseService, media: AiMediaService, videoQueue: Queue);
    processAutoSubJob(job: Job): Promise<{
        success: boolean;
    }>;
    processDubbingJob(job: Job): Promise<{
        success: boolean;
        videoId: string;
    }>;
    processKolVideoJob(job: Job): Promise<{
        success: boolean;
    }>;
    processReburnJob(job: Job): Promise<{
        success: boolean;
    }>;
    private extractAudio;
    private getVideoDuration;
    private transcribeWithGemini;
    private parseSrt;
    private burnSubtitles;
    generateAutoSubtitles(file: any, srcLang: string, targetLang: string, style: string, fontSize: number, yPos: number, userId: string, subColor?: string, subBgColor?: string, subBgOpacity?: number): Promise<{
        success: boolean;
        videoId: string;
        srtContent: string;
        burnSuccess: boolean;
        message: string;
    }>;
    videoDubbing(file: any, targetVoice: string, targetLang: string, userId: string, bgVolume: number, dubVolume: number, showSubtitles: boolean, subStyle: any): Promise<{
        jobId: string | undefined;
        message: string;
    }>;
    renderAutomationVideo(resultId: string, userId: string, workflowId?: string): Promise<{
        success: boolean;
        videoUrl: string;
    }>;
    generateKolVideo(imageUrl: string, videoUrl: string, userId: string): Promise<{
        jobId: string;
        message: string;
    }>;
    generateVideoConcept(body: any, userId: string): Promise<any>;
    streamVideo(videoId: string, type: 'auto_sub' | 'video_dub', res: any, download?: boolean): Promise<any>;
    updateSubtitle(body: any, userId: string): Promise<{
        success: boolean;
        videoId: any;
        message: string;
    }>;
    reburnVideo(body: any, userId: string): Promise<{
        success: boolean;
        videoId: any;
        message: string;
    }>;
    getJobStatus(jobId: string): Promise<{
        id: string;
        state: string;
        progress: number;
        result: {
            videoId: string;
        };
        reason?: undefined;
    } | {
        id: string;
        state: string;
        progress?: undefined;
        result?: undefined;
        reason?: undefined;
    } | {
        id: string;
        state: "unknown" | import("bullmq").JobState;
        progress: import("bullmq").JobProgress;
        result: any;
        reason: string;
    }>;
}
