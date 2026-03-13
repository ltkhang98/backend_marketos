"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
const admin = __importStar(require("firebase-admin"));
let FacebookService = FacebookService_1 = class FacebookService {
    configService;
    firebaseAdmin;
    logger = new common_1.Logger(FacebookService_1.name);
    fbAppId;
    fbAppSecret;
    constructor(configService, firebaseAdmin) {
        this.configService = configService;
        this.firebaseAdmin = firebaseAdmin;
    }
    onModuleInit() {
        this.listenToApiKeys();
    }
    listenToApiKeys() {
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
        }
        catch (err) {
            this.logger.error('Error listening to Facebook API keys:', err);
        }
    }
    async exchangeToLongLivedToken(shortLivedToken) {
        const appId = this.fbAppId || this.configService.get('FB_APP_ID');
        const appSecret = this.fbAppSecret || this.configService.get('FB_APP_SECRET');
        if (!appId || !appSecret) {
            this.logger.warn('--- Facebook Service: Missing FB_APP_ID or FB_APP_SECRET. Exchange skipped. ---');
            return { access_token: shortLivedToken };
        }
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
            return { access_token: shortLivedToken };
        }
    }
    async getUserPages(userAccessToken) {
        try {
            let finalToken = userAccessToken;
            const longLivedData = await this.exchangeToLongLivedToken(userAccessToken);
            if (longLivedData.access_token && longLivedData.access_token !== userAccessToken) {
                finalToken = longLivedData.access_token;
                this.logger.log('--- Facebook Service: Using Long-lived User Token to fetch Pages (Permanent Token Logic) ---');
            }
            else {
                this.logger.warn('--- Facebook Service: Could NOT get Long-lived token, Page Tokens will be SHORT-LIVED! ---');
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
    __param(1, (0, common_1.Inject)('FIREBASE_ADMIN')),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], FacebookService);
//# sourceMappingURL=facebook.service.js.map