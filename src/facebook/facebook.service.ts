import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FacebookService {
    private readonly logger = new Logger(FacebookService.name);
    constructor(private configService: ConfigService) { }

    /**
     * Đăng bài viết lên Facebook Page
     * @param pageAccessToken Token của Page (lấy từ phía client hoặc db)
     * @param pageId ID của Facebook Page
     * @param   * message Nội dung bài viết
   * imageUrl (Tùy chọn) Link ảnh minh họa
   */
    async exchangeToLongLivedToken(shortLivedToken: string) {
        const appId = this.configService.get('FB_APP_ID');
        const appSecret = this.configService.get('FB_APP_SECRET');

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
            console.error('FB Exchange Token Error:', error.response?.data || error.message);
            throw new HttpException('Không thể đổi mã truy cập dài hạn', HttpStatus.BAD_REQUEST);
        }
    }

    async getUserPages(userAccessToken: string) {
        try {
            // Bước 1: Đổi sang Long-lived User Token trước
            // Điều này cực kỳ quan trọng: Nếu dùng Long-lived User Token để lấy Page Token, 
            // thì Page Token nhận được sẽ là PERMANENT (không bao giờ hết hạn).
            let finalToken = userAccessToken;
            try {
                const longLivedData = await this.exchangeToLongLivedToken(userAccessToken);
                if (longLivedData.access_token) {
                    finalToken = longLivedData.access_token;
                    console.log('--- Facebook Service: Successfully exchanged to Long-lived User Token ---');
                }
            } catch (exchangeErr) {
                console.warn('--- Facebook Service: Failed to exchange token, proceeding with short-lived token ---');
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
