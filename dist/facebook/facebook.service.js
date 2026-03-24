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
        const appId = this.configService.get('FACEBOOK_APP_ID');
        const appSecret = this.configService.get('FACEBOOK_APP_SECRET');
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
            this.logger.error('FB Exchange Token Error:', error.response?.data || error.message);
            throw new common_1.HttpException('Không thể đổi mã truy cập dài hạn', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getUserPages(userAccessToken) {
        try {
            const appId = this.configService.get('FACEBOOK_APP_ID');
            const appSecret = this.configService.get('FACEBOOK_APP_SECRET');
            if (!appId || !appSecret) {
                this.logger.error('CRITICAL: FACEBOOK_APP_ID hoặc FACEBOOK_APP_SECRET bị thiếu trong cấu hình .env');
                throw new common_1.HttpException('Hệ thống chưa được cấu hình đầy đủ thông tin Facebook App (ID/Secret).', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            this.logger.log('--- Đang bắt đầu quy trình lấy Token vĩnh viễn ---');
            let longLivedToken;
            try {
                const longLivedData = await this.exchangeToLongLivedToken(userAccessToken);
                if (longLivedData && longLivedData.access_token) {
                    longLivedToken = longLivedData.access_token;
                    this.logger.log('Thành công: Đã đổi sang Long-lived User Token (60 ngày)');
                }
                else {
                    throw new Error('Facebook không trả về access_token trong phản hồi đổi mã');
                }
            }
            catch (exchangeErr) {
                this.logger.error(`Lỗi đổi mã Long-lived: ${exchangeErr.message}`);
                throw new common_1.HttpException(`Không thể nâng cấp mã truy cập: ${exchangeErr.response?.data?.error?.message || exchangeErr.message}`, common_1.HttpStatus.BAD_REQUEST);
            }
            const response = await axios_1.default.get(`https://graph.facebook.com/v19.0/me/accounts`, {
                params: {
                    fields: 'name,access_token,category,picture.type(large),followers_count,fan_count',
                    access_token: longLivedToken
                }
            });
            this.logger.log(`Thành công: Đã lấy danh sách ${response.data?.data?.length || 0} Fanpage với Token vĩnh viễn`);
            return response.data;
        }
        catch (error) {
            if (error instanceof common_1.HttpException)
                throw error;
            this.logger.error(`Lỗi lấy danh sách Fanpage: ${error.response?.data?.error?.message || error.message}`);
            throw new common_1.HttpException(`Lỗi kết nối Facebook: ${error.response?.data?.error?.message || error.message}`, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async postToPage(pageAccessToken, pageId, message, imageUrl, imageUrls) {
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
            if (imageUrls && imageUrls.length > 0) {
                if (imageUrls.length === 1) {
                    const params = new URLSearchParams();
                    params.append('url', imageUrls[0]);
                    params.append('caption', message);
                    params.append('published', 'true');
                    response = await axios_1.default.post(`https://graph.facebook.com/v19.0/${cleanPageId}/photos`, params.toString(), { headers });
                }
                else {
                    const mediaIds = [];
                    for (const imgUrl of imageUrls) {
                        const params = new URLSearchParams();
                        params.append('url', imgUrl);
                        params.append('published', 'false');
                        const photoRes = await axios_1.default.post(`https://graph.facebook.com/v19.0/${cleanPageId}/photos`, params.toString(), { headers });
                        mediaIds.push({ media_fbid: photoRes.data.id });
                    }
                    const feedParams = new URLSearchParams();
                    feedParams.append('message', message);
                    feedParams.append('attached_media', JSON.stringify(mediaIds));
                    response = await axios_1.default.post(`https://graph.facebook.com/v19.0/${cleanPageId}/feed`, feedParams.toString(), { headers });
                }
            }
            else if (imageUrl && imageUrl.startsWith('http')) {
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