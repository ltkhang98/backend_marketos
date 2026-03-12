import { ConfigService } from '@nestjs/config';
export declare class FacebookService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    exchangeToLongLivedToken(shortLivedToken: string): Promise<any>;
    getUserPages(userAccessToken: string): Promise<any>;
    postToPage(pageAccessToken: string, pageId: string, message: string, imageUrl?: string): Promise<any>;
}
