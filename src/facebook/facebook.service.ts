import { Injectable, HttpException, HttpStatus, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as admin from 'firebase-admin';

@Injectable()
export class FacebookService implements OnModuleInit {
    private readonly logger = new Logger(FacebookService.name);
    private fbAppId: string | undefined;
    private fbAppSecret: string | undefined;

    constructor(
        private configService: ConfigService,
        @Inject('FIREBASE_ADMIN') private firebaseAdmin: admin.app.App,
    ) { }

    onModuleInit() {
        this.listenToApiKeys();
    }

    private listenToApiKeys() {
        try {
            const db = this.firebaseAdmin.firestore();
            db.collection('settings').doc('api_keys').onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    this.fbAppId = data?.fb_app_id || this.configService.get('FB_APP_ID');
                    this.fbAppSecret = data?.fb_app_secret || this.configService.get('FB_APP_SECRET');
                    if (data?.fb_app_id) {
                        this.logger.log('--- Facebook API Keys updated from Firestore ---');
                    }
                }
            });
        } catch (err) {
            this.logger.error('Error listening to Facebook API keys:', err);
        }
    }

    /**
     * Đổi mã truy cập ngắn hạn sang dài hạn (60 ngày cho User Token)
     */
    async exchangeToLongLivedToken(shortLivedToken: string) {
        const appId = this.fbAppId || this.configService.get('FB_APP_ID');
        const appSecret = this.fbAppSecret || this.configService.get('FB_APP_SECRET');

        if (!appId || !appSecret) {
            this.logger.warn('--- Facebook Service: Missing FB_APP_ID or FB_APP_SECRET. Exchange skipped. ---');
            return { access_token: shortLivedToken };
        }

        try {
            const response = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: appId,
                    client_secret: appSecret,
                    fb_exchange_token: shortLivedToken,
                },
            });
            return response.data;
        } catch (error) {
            this.logger.error('FB Exchange Token Error:', error.response?.data || error.message);
            return { access_token: shortLivedToken }; // Fallback
        }
    }

    async getUserPages(userAccessToken: string) {
        try {
            let finalToken = userAccessToken;
            const longLivedData = await this.exchangeToLongLivedToken(userAccessToken);

            if (longLivedData.access_token && longLivedData.access_token !== userAccessToken) {
                finalToken = longLivedData.access_token;
                this.logger.log('--- Facebook Service: Using Long-lived User Token to fetch Pages (Permanent Token Logic) ---');
            } else {
                this.logger.warn('--- Facebook Service: Could NOT get Long-lived token, Page Tokens will be SHORT-LIVED! ---');
            }

            // Bước 2: Lấy danh sách Page
            const response = await axios.get(
                `https://graph.facebook.com/v19.0/me/accounts?fields=name,access_token,category,picture.type(large),followers_count,fan_count&access_token=${finalToken}`,
            );
            return response.data;
        } catch (error) {
            this.logger.error(
                `Error getting user pages: ${error.response?.data?.error?.message || error.message}`,
            );
            throw new Error('Failed to get user pages');
        }
    }

    async postToPage(pageAccessToken: string, pageId: string, message: string, imageUrl?: string) {
        try {
            if (!pageAccessToken) {
                throw new Error('Mã truy cập Fanpage (Access Token) bị thiếu.');
            }
            const cleanPageId = pageId.toString().trim();
            console.log(`--- Facebook Service: Posting to Page ${cleanPageId} ---`);
            console.log(`--- Image URL: ${imageUrl || 'None'} ---`);

            let response;
            const headers = {
                'Authorization': `Bearer ${pageAccessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            if (imageUrl && imageUrl.startsWith('http')) {
                // Sử dụng URLSearchParams để gửi dữ liệu dạng form-urlencoded (chuẩn nhất cho FB Photos API)
                const params = new URLSearchParams();
                params.append('url', imageUrl);
                params.append('caption', message);
                params.append('published', 'true');

                response = await axios.post(
                    `https://graph.facebook.com/v19.0/${cleanPageId}/photos`,
                    params.toString(),
                    { headers }
                );
            } else {
                const params = new URLSearchParams();
                params.append('message', message);
                params.append('published', 'true');

                response = await axios.post(
                    `https://graph.facebook.com/v19.0/${cleanPageId}/feed`,
                    params.toString(),
                    { headers }
                );
            }
            console.log('--- Facebook API Success Response:', JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            const errorData = error.response?.data?.error || {};
            console.error('Facebook API Error Details:', JSON.stringify(errorData, null, 2));

            let errorMsg = errorData.message || error.message;

            // Xử lý một số lỗi phổ biến để thông báo thân thiện hơn
            if (errorData.code === 190 || errorData.error_subcode === 463) {
                errorMsg = 'Kết nối Facebook đã hết hạn hoặc Token không hợp lệ. Vui lòng kết nối lại Fanpage.';
            } else if (errorData.code === 100 && errorMsg.includes('resolve to a valid user ID')) {
                errorMsg = 'Facebook không xác định được ID trang. Có thể do Token không có quyền quản lý trang này hoặc ID sai.';
            } else if (errorData.code === 368) {
                errorMsg = 'Nội dung bị Facebook đánh dấu là vi phạm tiêu chuẩn cộng đồng hoặc bị chặn đăng tạm thời.';
            }

            throw new HttpException(
                `Facebook Error: ${errorMsg}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
