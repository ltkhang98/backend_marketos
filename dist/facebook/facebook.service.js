"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FacebookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let FacebookService = FacebookService_1 = class FacebookService {
    configService;
    logger = new common_1.Logger(FacebookService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async exchangeToLongLivedToken(shortLivedToken) {
        const appId = this.configService.get('FB_APP_ID');
        const appSecret = this.configService.get('FB_APP_SECRET');
        try {
            const response = await axios_1.default.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: appId,
                    client_secret: appSecret,
                    fb_exchange_token: shortLivedToken,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('FB Exchange Token Error:', error.response?.data || error.message);
            throw new common_1.HttpException('Không thể đổi mã truy cập dài hạn', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getUserPages(userAccessToken) {
        try {
            let finalToken = userAccessToken;
            try {
                const longLivedData = await this.exchangeToLongLivedToken(userAccessToken);
                if (longLivedData.access_token) {
                    finalToken = longLivedData.access_token;
                    console.log('--- Facebook Service: Successfully exchanged to Long-lived User Token ---');
                }
            }
            catch (exchangeErr) {
                console.warn('--- Facebook Service: Failed to exchange token, proceeding with short-lived token ---');
            }
            const response = await axios_1.default.get(`https://graph.facebook.com/v19.0/me/accounts?fields=name,access_token,category,picture.type(large),followers_count,fan_count&access_token=${finalToken}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Error getting user pages: ${error.response?.data?.error?.message || error.message}`);
            throw new Error('Failed to get user pages');
        }
    }
    async postToPage(pageAccessToken, pageId, message, imageUrl) {
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
                const params = new URLSearchParams();
                params.append('url', imageUrl);
                params.append('caption', message);
                params.append('published', 'true');
                response = await axios_1.default.post(`https://graph.facebook.com/v19.0/${cleanPageId}/photos`, params.toString(), { headers });
            }
            else {
                const params = new URLSearchParams();
                params.append('message', message);
                params.append('published', 'true');
                response = await axios_1.default.post(`https://graph.facebook.com/v19.0/${cleanPageId}/feed`, params.toString(), { headers });
            }
            console.log('--- Facebook API Success Response:', JSON.stringify(response.data));
            return response.data;
        }
        catch (error) {
            const errorData = error.response?.data?.error || {};
            console.error('Facebook API Error Details:', JSON.stringify(errorData, null, 2));
            let errorMsg = errorData.message || error.message;
            if (errorData.code === 190 || errorData.error_subcode === 463) {
                errorMsg = 'Kết nối Facebook đã hết hạn hoặc Token không hợp lệ. Vui lòng kết nối lại Fanpage.';
            }
            else if (errorData.code === 100 && errorMsg.includes('resolve to a valid user ID')) {
                errorMsg = 'Facebook không xác định được ID trang. Có thể do Token không có quyền quản lý trang này hoặc ID sai.';
            }
            else if (errorData.code === 368) {
                errorMsg = 'Nội dung bị Facebook đánh dấu là vi phạm tiêu chuẩn cộng đồng hoặc bị chặn đăng tạm thời.';
            }
            throw new common_1.HttpException(`Facebook Error: ${errorMsg}`, common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.FacebookService = FacebookService;
exports.FacebookService = FacebookService = FacebookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FacebookService);
//# sourceMappingURL=facebook.service.js.map