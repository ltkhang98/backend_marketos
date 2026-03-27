import { AiBaseService } from './ai-base.service';
import { MediaService } from '../../media/media.service';
export declare class AiMediaService {
    private readonly base;
    private readonly mediaService;
    private readonly logger;
    constructor(base: AiBaseService, mediaService: MediaService);
    generateImage(prompt: string, aspectRatio?: string, userId?: string): Promise<{
        url: string;
    }>;
    generateSpeech(body: {
        text: string;
        voice: string;
        speed?: string | number;
    }, userId: string): Promise<any>;
    generateImageMockup(prompt: string, productImage?: string, logoImage?: string, modelImage?: string, aspectRatio?: string, userId?: string): Promise<any>;
    generateVisualClone(modelImage: string, templatePrompt: string, userId: string, templateImage?: string, count?: number, fidelity?: number, creativity?: number): Promise<any>;
    private callSingleGeminiImageGen;
    generateKocProductImage(kocId: string, productImage: string, prompt: string, userId: string, modelOverride?: string, bgImage?: string): Promise<{
        url: string | null;
        urls: string[];
    }>;
    generateKocVisual(data: {
        kocId: string;
        angle: string;
        outfit: string;
        hairColor: string;
        action: string;
    }, userId: string): Promise<{
        url: string | null;
        urls: string[];
    }>;
    downloadUniversalVideo(urlInput: string, userId: string): Promise<any>;
    private detectPlatform;
    downloadTikTokVideo(url: string, userId: string, skipDeduction?: boolean): Promise<any>;
    private uploadBase64ToStorage;
    getAiKocs(userId: string): Promise<any[]>;
    createAiKoc(data: any, userId: string): Promise<any>;
    deleteAiKoc(id: string, userId: string): Promise<any>;
    removeBackground(imageUrl: string, userId: string): Promise<any>;
    enhanceImage(imageUrl: string, userId: string): Promise<any>;
    proxyDownload(url: string, filename: string, res: any): Promise<any>;
    generateSmartBanner(data: {
        productImage?: string;
        productImages?: string[];
        modelImage?: string;
        logoImage?: string;
        refImage?: string;
        companyName?: string;
        productName?: string;
        slogan: string;
        price: string;
        details?: string;
        industry?: string;
        style: string;
        aspectRatio: string;
        quality: string;
    }, userId: string): Promise<{
        url: string;
    }>;
    getJobStatus(jobId: string): Promise<any>;
}
