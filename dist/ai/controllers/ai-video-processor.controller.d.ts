import { AiVideoProcessorService } from '../services/ai-video-processor.service';
export declare class AiVideoProcessorController {
    private readonly videoProcessorService;
    constructor(videoProcessorService: AiVideoProcessorService);
    autoSubtitles(file: any, srcLang: string, targetLang: string, style: string, fontSize: number, yPos: number, subColor: string, subBgColor: string, subBgOpacity: number, req: any): Promise<{
        success: boolean;
        videoId: string;
        srtContent: string;
        burnSuccess: boolean;
        message: string;
    }>;
    videoDubbing(file: any, targetVoice: string, targetLang: string, bgVolume: string, dubVolume: string, showSubtitles: string, subColor: string, subFontSize: string, subBgColor: string, subVerticalPos: string, req: any): Promise<{
        jobId: string | undefined;
        message: string;
    }>;
    renderAutomationVideo(resultId: string, body: {
        workflowId?: string;
    }, req: any): Promise<{
        success: boolean;
        videoUrl: string;
    }>;
    generateKolVideo(body: {
        imageUrl: string;
        videoUrl: string;
    }, req: any): Promise<{
        jobId: string;
        message: string;
    }>;
    generateVideoConcept(body: any, req: any): Promise<any>;
    streamSubVideo(videoId: string, res: any): Promise<any>;
    downloadSubVideo(videoId: string, res: any): Promise<any>;
    streamDubVideo(videoId: string, res: any): Promise<any>;
    downloadDubVideo(videoId: string, res: any): Promise<any>;
    updateSub(body: any, req: any): Promise<{
        success: boolean;
        videoId: any;
        message: string;
    }>;
    reburnVideo(body: any, req: any): Promise<{
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
