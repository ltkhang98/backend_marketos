import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
export declare class FacebookService implements OnModuleInit {
    private configService;
    private firebaseAdmin;
    private readonly logger;
    private fbAppId;
    private fbAppSecret;
    constructor(configService: ConfigService, firebaseAdmin: admin.app.App);
    onModuleInit(): void;
    private listenToApiKeys;
    exchangeToLongLivedToken(shortLivedToken: string): Promise<any>;
    getUserPages(userAccessToken: string): Promise<any>;
    postToPage(pageAccessToken: string, pageId: string, message: string, imageUrl?: string): Promise<any>;
}
