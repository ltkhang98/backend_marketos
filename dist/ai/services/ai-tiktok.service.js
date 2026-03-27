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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTikTokService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const ai_base_service_1 = require("./ai-base.service");
let AiTikTokService = class AiTikTokService {
    base;
    CACHE_TTL = 3600000;
    cache = new Map();
    constructor(base) {
        this.base = base;
    }
    async analyzeTikTokChannel(uniqueId, userId) {
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.TIKTOK_ANALYTICS, 'Phân tích kênh TikTok', 'TIKTOK_ANALYTICS');
        try {
            console.log(`--- Analyzing TikTok Channel: ${uniqueId} ---`);
            if (this.base.currentRapidApiKey) {
                try {
                    const response = await axios_1.default.get('https://tiktok-api23.p.rapidapi.com/api/user/info', {
                        params: { username: uniqueId.replace(/^@/, '') },
                        headers: {
                            'X-RapidAPI-Key': this.base.currentRapidApiKey,
                            'X-RapidAPI-Host': 'tiktok-api23.p.rapidapi.com'
                        }
                    });
                    if (response.data && response.data.user) {
                        const userData = response.data.user;
                        const stats = response.data.stats;
                        const videos = await this.getTikTokUserVideos(uniqueId, userData.userId || userData.id);
                        const aiReport = await this.generateTikTokAIAnalysis(userData, stats, videos);
                        return {
                            user: {
                                id: userData.userId || userData.id,
                                uniqueId: userData.uniqueId,
                                nickname: userData.nickname,
                                avatarMedium: userData.avatarMedium || userData.avatarThumb,
                                signature: userData.signature,
                                verified: userData.verified,
                                secUid: userData.secUid,
                                region: userData.region || 'Unknown'
                            },
                            stats: {
                                followerCount: stats.followerCount,
                                followingCount: stats.followingCount,
                                heartCount: stats.heartCount,
                                videoCount: stats.videoCount,
                                diggCount: stats.diggCount || 0
                            },
                            topVideos: videos,
                            aiAnalysis: aiReport,
                            healthScore: this.calculateHealthScore(stats, videos)
                        };
                    }
                }
                catch (rapidErr) {
                    console.error('RapidAPI Error:', rapidErr.message);
                }
            }
            let cleanId = uniqueId.trim().replace(/^@/, '');
            const response = await this.callTikWM('https://www.tikwm.com/api/user/info', {
                unique_id: cleanId
            });
            if (response && response.code === 0 && response.data) {
                const data = response.data;
                const secUid = data.user.secUid || data.user.sec_uid || data.user.sec_id;
                const isPrivate = !!(data.user.privateItem || data.user.secret);
                const videos = isPrivate ? [] : await this.getTikTokUserVideos(cleanId, secUid);
                const aiReport = await this.generateTikTokAIAnalysis(data.user, data.stats, videos);
                return {
                    user: {
                        id: data.user.id || data.user.user_id,
                        uniqueId: data.user.uniqueId || data.user.unique_id,
                        nickname: data.user.nickname,
                        avatarMedium: data.user.avatarMedium || data.user.avatar_medium || data.user.avatarThumb || data.user.avatar_thumb,
                        signature: data.user.signature,
                        verified: data.user.verified,
                        secUid: secUid,
                        region: data.user.region || 'VN'
                    },
                    stats: {
                        followerCount: data.stats.followerCount || data.stats.follower_count || 0,
                        followingCount: data.stats.followingCount || data.stats.following_count || 0,
                        heartCount: data.stats.heartCount || data.stats.heart_count || 0,
                        videoCount: data.stats.videoCount || data.stats.video_count || 0,
                        diggCount: data.stats.diggCount || data.stats.digg_count || 0
                    },
                    isPrivate,
                    topVideos: videos,
                    aiAnalysis: aiReport,
                    healthScore: this.calculateHealthScore(data.stats, videos)
                };
            }
            throw new Error(response?.msg || 'Hệ thống TikWM đang bận hoặc ID không tồn tại.');
        }
        catch (error) {
            console.error('Lỗi phân tích TikTok:', error.message);
            throw new Error(error.message || 'Lỗi hệ thống');
        }
    }
    async generateTikTokAIAnalysis(user, stats, videos, retryCount = 0) {
        if (!this.base.model)
            return this.getDefaultAIAnalysis();
        const prompt = `Bạn là một chuyên gia phân tích dữ liệu TikTok bậc thầy. Hãy phân tích kênh sau:
        - Nickname: ${user.nickname} (@${user.uniqueId})
        - Bio: ${user.signature || 'Chưa có'}
        - Followers: ${stats.followerCount || stats.follower_count || 0}
        - Tổng Likes: ${stats.heartCount || stats.heart_count || 0}
        - Video: ${stats.videoCount || stats.video_count || 0}
        - Top 10 video mới nhất:
        ${videos.map(v => `- ${v.title} (${v.play_count} views, ${v.digg_count} likes)`).join('\n')}

        HÃY TRẢ VỀ JSON CHUẨN (KHÔNG CHỨA CHỮ KHÁC):
        {
          "category": "Chủ đề của kênh",
          "status": "VIRAL" hoặc "FLOP" hoặc "STABLE",
          "statusText": "Giải thích trạng thái hiện tại",
          "postingTime": "Khung giờ vàng đề xuất",
          "viralKeywords": ["Từ khóa 1", "Từ khóa 2", "Từ khóa 3"],
          "whyViral": "Phân tích vì sao nội dung hấp dẫn người xem",
          "suggestions": ["Gợi ý 1", "Gợi ý 2"]
        }`;
        try {
            const result = await this.base.model.generateContent(prompt);
            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
            return JSON.parse(jsonStr);
        }
        catch (error) {
            console.error(`Lỗi AI Analysis (Lần ${retryCount + 1}):`, error.message);
            if ((error.message?.includes('503') || error.message?.includes('429')) && retryCount < 2) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                return this.generateTikTokAIAnalysis(user, stats, videos, retryCount + 1);
            }
            return this.getDefaultAIAnalysis();
        }
    }
    getDefaultAIAnalysis() {
        return {
            category: "Tổng hợp nội dung",
            status: "STABLE",
            statusText: "Kênh đang trong giai đoạn phát triển ổn định.",
            postingTime: "19:00 - 21:00 hàng ngày",
            viralKeywords: ["Trending", "Phát triển", "TikTok"],
            whyViral: "Nội dung kênh tập trung vào các chủ đề phổ biến.",
            suggestions: ["Cần đăng bài đều đặn hơn", "Tương tác với người xem"]
        };
    }
    async getTikTokUserVideos(uniqueId, userIdOrSecUid) {
        const cleanId = uniqueId.replace(/^@/, '');
        if (this.base.currentRapidApiKey) {
            try {
                const response = await axios_1.default.get('https://tiktok-api23.p.rapidapi.com/api/user/posts', {
                    params: { user_id: userIdOrSecUid, count: 10, cursor: 0 },
                    headers: {
                        'X-RapidAPI-Key': this.base.currentRapidApiKey,
                        'X-RapidAPI-Host': 'tiktok-api23.p.rapidapi.com'
                    }
                });
                if (response.data && response.data.videos) {
                    return response.data.videos.map((v) => ({
                        id: v.videoId,
                        title: v.desc,
                        cover: v.cover,
                        play_count: v.stats?.playCount || 0,
                        digg_count: v.stats?.diggCount || 0,
                        comment_count: v.stats?.commentCount || 0,
                        share_count: v.stats?.shareCount || 0,
                        create_time: v.createTime
                    }));
                }
            }
            catch (err) {
                console.error('API23 Posts Error:', err.message);
            }
        }
        try {
            const response = await this.callTikWM('https://www.tikwm.com/api/feed/search', {
                keywords: `@${cleanId}`,
                count: 30
            });
            if (response && response.code === 0 && response.data) {
                const videos = Array.isArray(response.data) ? response.data : (response.data.videos || []);
                const mappedVideos = videos
                    .filter((v) => v.author?.unique_id === cleanId || v.author?.uniqueId === cleanId)
                    .map((v) => ({
                    id: v.video_id,
                    title: v.title,
                    cover: v.cover,
                    play_count: v.play_count || 0,
                    digg_count: v.digg_count || 0,
                    comment_count: v.comment_count || 0,
                    share_count: v.share_count || 0,
                    create_time: v.create_time
                }));
                return mappedVideos.sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 10);
            }
        }
        catch (e) {
            console.error('TikWM Search Error:', e.message);
        }
        return [];
    }
    calculateHealthScore(stats, videos) {
        if (!stats || !videos.length)
            return 50;
        const followers = stats.followerCount || stats.follower_count || 1;
        const avgViews = videos.reduce((acc, v) => acc + (v.play_count || 0), 0) / videos.length;
        let score = (avgViews / followers) * 100;
        score = Math.min(Math.max(score, 10), 100);
        if (videos.some(v => v.play_count > 1000000))
            score += 15;
        return Math.min(Math.round(score), 100);
    }
    async generateTikTokVideoScript(uniqueId, niche, userId) {
        if (!this.base.model)
            return null;
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.TIKTOK_SCRIPT, 'Kịch bản TikTok Viral', 'TIKTOK_SCRIPT');
        const prompt = `
        Bạn là một TikTok Creative Director chuyên nghiệp.
        Nhiệm vụ: Viết kịch bản video ngắn (TikTok Script) cho kênh @${uniqueId} thuộc ngách "${niche}".
        Kịch bản phải theo công thức: 3s Hook -> 10s Content -> 2s CTA.
        
        YÊU CẦU TRẢ VỀ JSON:
        {
            "title": "Tiêu đề video",
            "hook": "Nội dung 3 giây đầu",
            "script": "Nội dung chi tiết kịch bản",
            "hashtags": ["#tag1", "#tag2"]
        }
        `;
        try {
            const result = await this.base.model.generateContent(prompt);
            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            return JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
        }
        catch (e) {
            console.error("Lỗi generate script:", e);
            throw new common_1.BadRequestException("Không thể tạo kịch bản lúc này.");
        }
    }
    async getTikTokTrending(region = 'VN', count = 50, refresh = false, category, userId) {
        try {
            if (userId) {
                console.log(`[TikTokTrending] Request from User: ${userId}`);
                await this.base.deductCredits(userId, this.base.CREDIT_COSTS.TIKTOK_TRENDING, 'Xu hướng TikTok', 'TIKTOK_TRENDING');
            }
            const globalTrending = await this.callTikWM('https://www.tikwm.com/api/feed/list', {
                region: region,
                count: 50
            }, 0, refresh);
            let rawVideos = [];
            if (globalTrending && globalTrending.code === 0 && globalTrending.data) {
                rawVideos = Array.isArray(globalTrending.data) ? globalTrending.data : (globalTrending.data.videos || []);
            }
            const trendingVideos = rawVideos.map((v) => ({
                id: v.video_id || v.id,
                title: v.title || v.desc || '',
                cover: v.cover || v.origin_cover || '',
                play_count: v.play_count || v.stats?.playCount || v.stats?.play_count || 0,
                digg_count: v.digg_count || v.stats?.diggCount || v.stats?.digg_count || 0,
                comment_count: v.comment_count || 0,
                share_count: v.share_count || 0,
                author: {
                    unique_id: v.author?.unique_id || v.author?.uniqueId || 'Unknown',
                    nickname: v.author?.nickname || 'Unknown User',
                    avatar: v.author?.avatar || v.author?.avatarMedium || v.author?.avatar_medium || ''
                }
            }));
            return { videos: trendingVideos, insights: null, trending_sounds: [] };
        }
        catch (error) {
            console.error(`[TikTokTrending Error]: ${error.message}`);
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException('Lỗi hệ thống TikTok hoặc tài khoản: ' + error.message);
        }
    }
    async downloadTikTokVideo(url, userId) {
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.TIKTOK_DOWNLOAD, 'Tải Video TikTok No Watermark', 'TIKTOK_DOWNLOAD');
        try {
            const response = await axios_1.default.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const data = response.data;
            if (data?.code === 0 && data.data) {
                const v = data.data;
                return {
                    id: v.id || v.video_id,
                    title: v.title || '',
                    cover: v.cover || v.origin_cover || '',
                    origin_cover: v.origin_cover || v.cover || '',
                    play: v.play || '',
                    wmplay: v.wmplay || '',
                    hdplay: v.hdplay || '',
                    music: v.music || '',
                    music_info: v.music_info || {},
                    author: {
                        id: v.author?.id || '',
                        unique_id: v.author?.unique_id || v.author?.uniqueId || '',
                        nickname: v.author?.nickname || '',
                        avatar: v.author?.avatar || v.author?.avatarMedium || ''
                    },
                    stats: {
                        play_count: v.play_count || 0,
                        digg_count: v.digg_count || 0,
                        comment_count: v.comment_count || 0,
                        share_count: v.share_count || 0,
                        download_count: v.download_count || 0
                    }
                };
            }
        }
        catch (error) {
            console.error('Lỗi tải TikTok:', error.message);
        }
        throw new common_1.BadRequestException('Không thể tải video từ link này. Vui lòng kiểm tra lại URL.');
    }
    async callTikWM(url, params, retryCount = 0, bypassCache = false) {
        const cacheKey = `${url}_${JSON.stringify(params)}`;
        const cached = this.cache.get(cacheKey);
        if (!bypassCache && cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
            return cached.data;
        }
        try {
            const response = await axios_1.default.get(url, { params, headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (response.data) {
                this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
            }
            return response.data;
        }
        catch (error) {
            console.error('TikWM API Error:', error.message);
            return null;
        }
    }
};
exports.AiTikTokService = AiTikTokService;
exports.AiTikTokService = AiTikTokService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_base_service_1.AiBaseService])
], AiTikTokService);
//# sourceMappingURL=ai-tiktok.service.js.map