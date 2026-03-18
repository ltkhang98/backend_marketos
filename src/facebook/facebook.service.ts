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
        const appId = this.configService.get('FACEBOOK_APP_ID');
        const appSecret = this.configService.get('FACEBOOK_APP_SECRET');

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
            throw new HttpException('Không thể đổi mã truy cập dài hạn', HttpStatus.BAD_REQUEST);
        }
    }

    async getUserPages(userAccessToken: string) {
        try {
            const appId = this.configService.get('FACEBOOK_APP_ID');
            const appSecret = this.configService.get('FACEBOOK_APP_SECRET');

            if (!appId || !appSecret) {
                this.logger.error('CRITICAL: FACEBOOK_APP_ID hoặc FACEBOOK_APP_SECRET bị thiếu trong cấu hình .env');
                throw new HttpException('Hệ thống chưa được cấu hình đầy đủ thông tin Facebook App (ID/Secret).', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // Bước 1: Đổi sang Long-lived User Token (60 ngày)
            // QUAN TRỌNG: Phải có Long-lived User Token thì Page Token trả về mới là VĨNH VIỄN.
            this.logger.log('--- Đang bắt đầu quy trình lấy Token vĩnh viễn ---');

            let longLivedToken: string;
            try {
                const longLivedData = await this.exchangeToLongLivedToken(userAccessToken);
                if (longLivedData && longLivedData.access_token) {
                    longLivedToken = longLivedData.access_token;
                    this.logger.log('Thành công: Đã đổi sang Long-lived User Token (60 ngày)');
                } else {
                    throw new Error('Facebook không trả về access_token trong phản hồi đổi mã');
                }
            } catch (exchangeErr) {
                this.logger.error(`Lỗi đổi mã Long-lived: ${exchangeErr.message}`);
                throw new HttpException(`Không thể nâng cấp mã truy cập: ${exchangeErr.response?.data?.error?.message || exchangeErr.message}`, HttpStatus.BAD_REQUEST);
            }

            // Bước 2: Lấy danh sách Page (Lúc này Page Token chắc chắn sẽ là vĩnh viễn)
            const response = await axios.get(
                `https://graph.facebook.com/v19.0/me/accounts`,
                {
                    params: {
                        fields: 'name,access_token,category,picture.type(large),followers_count,fan_count',
                        access_token: longLivedToken
                    }
                }
            );

            this.logger.log(`Thành công: Đã lấy danh sách ${response.data?.data?.length || 0} Fanpage với Token vĩnh viễn`);
            return response.data;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `Lỗi lấy danh sách Fanpage: ${error.response?.data?.error?.message || error.message}`,
            );
            throw new HttpException(
                `Lỗi kết nối Facebook: ${error.response?.data?.error?.message || error.message}`,
                HttpStatus.BAD_REQUEST
            );
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
