export declare class MediaService {
    private readonly logger;
    private readonly baseUploadPath;
    constructor();
    private ensureDirectoryExists;
    saveFile(file: Express.Multer.File, folder?: string): Promise<string>;
    saveBuffer(buffer: Buffer, originalName: string, folder?: string): Promise<string>;
}
