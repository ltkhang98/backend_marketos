import { AiMediaService } from '../services/ai-media.service';
export declare class AiMediaController {
    private readonly mediaService;
    constructor(mediaService: AiMediaService);
    textToSpeech(body: {
        text: string;
        voice: string;
        speed: string | number;
    }, req: any): Promise<any>;
    generateMockup(body: {
        prompt: string;
        productImage?: string;
        logoImage?: string;
        modelImage?: string;
        aspectRatio?: string;
    }, req: any): Promise<any>;
    generateSmartBanner(body: any, req: any): Promise<{
        url: string;
    }>;
    generateVisualClone(body: any, req: any): Promise<any>;
    generateKocProduct(body: {
        kocId: string;
        productImage: string;
        prompt: string;
        modelImage?: string;
        bgImage?: string;
    }, req: any): Promise<{
        url: string | null;
        urls: string[];
    }>;
    generateKocVisual(body: {
        kocId: string;
        angle: string;
        outfit: string;
        hairColor: string;
        action: string;
    }, req: any): Promise<{
        url: string | null;
        urls: string[];
    }>;
    getAiKocs(req: any): Promise<any[]>;
    createAiKoc(body: {
        name: string;
        imageUrl: string;
        tags?: string[];
    }, req: any): Promise<any>;
    deleteAiKoc(id: string, req: any): Promise<any>;
    videoDownload(body: {
        url: string;
    }, req: any): Promise<any>;
    removeBackground(body: {
        url: string;
    }, req: any): Promise<any>;
    enhanceImage(body: {
        url: string;
    }, req: any): Promise<any>;
    download(url: string, filename: string, res: any): Promise<any>;
    getJobStatus(jobId: string): Promise<any>;
}
