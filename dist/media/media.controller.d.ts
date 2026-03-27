import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    private readonly logger;
    constructor(mediaService: MediaService);
    uploadFile(file: Express.Multer.File, folder?: string): Promise<{
        success: boolean;
        url: string;
    }>;
}
