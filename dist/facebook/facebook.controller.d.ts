import { FacebookService } from './facebook.service';
export declare class FacebookController {
    private readonly facebookService;
    constructor(facebookService: FacebookService);
    postToFacebook(body: {
        pageAccessToken: string;
        pageId: string;
        message: string;
        imageUrl?: string;
        imageUrls?: string[];
    }): Promise<any>;
    exchangeToken(body: {
        shortLivedToken: string;
    }): Promise<any>;
    getPages(body: {
        userAccessToken: string;
    }): Promise<any>;
}
