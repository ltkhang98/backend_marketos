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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const uuid_1 = require("uuid");
const ffmpeg = require('fluent-ffmpeg');
const server_1 = require("@google/generative-ai/server");
let AiService = class AiService {
    configService;
    firebaseAdmin;
    genAI;
    model;
    tikwmBaseUrl = 'https://www.tikwm.com/api/';
    cache = new Map();
    CACHE_TTL = 30 * 60 * 1000;
    currentGeminiKey;
    currentFptKey;
    currentScrapingBeeKey;
    currentRapidApiKey;
    CREDIT_COSTS = {
        SOCIAL_CONTENT: 200,
        MARKETING_PLAN: 300,
        CONTENT_EVALUATION: 100,
        ADS_ANALYSIS: 250,
        TIKTOK_ANALYTICS: 300,
        PRODUCT_SCRAPER: 300,
        KEYWORD_DISCOVERY: 200,
        ADS_COMPARISON: 100,
        AUTO_SUB_PER_MIN: 1000,
        TTS_PER_100_CHARS: 10,
        TEXT_TO_SPEECH: 100,
        MOCKUP: 500,
        VIDEO_DOWNLOAD: 200,
        TIKTOK_TRENDING: 200,
        TIKTOK_SCRIPT: 200
    };
    constructor(configService, firebaseAdmin) {
        this.configService = configService;
        this.firebaseAdmin = firebaseAdmin;
        this.initializeModels();
        this.listenToApiKeys();
    }
    initializeModels() {
        const geminiKey = this.configService.get('GEMINI_API_KEY')?.trim();
        const fptKey = this.configService.get('FPT_AI_API_KEY')?.trim();
        if (geminiKey) {
            this.currentGeminiKey = geminiKey;
            this.genAI = new generative_ai_1.GoogleGenerativeAI(geminiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        }
        this.currentFptKey = fptKey;
    }
    listenToApiKeys() {
        try {
            const db = this.firebaseAdmin.firestore();
            db.collection('settings').doc('api_keys').onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    console.log('--- API Keys Updated from Firestore ---');
                    const newGeminiKey = data?.gemini?.trim();
                    if (newGeminiKey && newGeminiKey !== this.currentGeminiKey) {
                        console.log('--- Reloading Gemini Model with New Key ---');
                        this.currentGeminiKey = newGeminiKey;
                        this.genAI = new generative_ai_1.GoogleGenerativeAI(newGeminiKey);
                        this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
                    }
                    const newFptKey = data?.fpt?.trim();
                    if (newFptKey) {
                        this.currentFptKey = newFptKey;
                    }
                    const newScrapingBeeKey = data?.scrapingbee?.trim();
                    if (newScrapingBeeKey) {
                        this.currentScrapingBeeKey = newScrapingBeeKey;
                    }
                    const newRapidApiKey = data?.rapidapi?.trim();
                    if (newRapidApiKey) {
                        this.currentRapidApiKey = newRapidApiKey;
                    }
                }
            });
            db.collection('settings').doc('credit_costs').onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    console.log('--- Credit Costs Updated from Firestore ---');
                    Object.keys(this.CREDIT_COSTS).forEach(key => {
                        if (data && data[key] !== undefined) {
                            this.CREDIT_COSTS[key] = Number(data[key]);
                        }
                    });
                }
                else {
                    db.collection('settings').doc('credit_costs').set(this.CREDIT_COSTS).catch(err => {
                        console.error('Error creating default credit_costs doc:', err);
                    });
                }
            });
        }
        catch (error) {
            console.error('Error listening to dynamic settings:', error);
        }
    }
    async deductCredits(userId, cost, featureName) {
        if (!userId) {
            throw new common_1.BadRequestException('Không tìm thấy thông tin người dùng.');
        }
        const db = this.firebaseAdmin.firestore();
        const userRef = db.collection('users').doc(userId);
        try {
            const result = await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new common_1.BadRequestException('Tài khoản người dùng không tồn tại.');
                }
                const userData = userDoc.data();
                const currentTokens = userData?.tokens || 0;
                if (currentTokens < cost) {
                    throw new common_1.BadRequestException(`Bạn không đủ Credits để sử dụng tính năng ${featureName}. ` +
                        `Cần ${cost} Credits, hiện có ${currentTokens.toLocaleString()} Credits. ` +
                        `Vui lòng mua thêm gói Credits.`);
                }
                transaction.update(userRef, {
                    tokens: admin.firestore.FieldValue.increment(-cost),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                return true;
            });
            return result;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            console.error(`Error deducting credits for user ${userId}:`, error);
            throw new common_1.InternalServerErrorException('Lỗi hệ thống khi kiểm tra tài khoản.');
        }
    }
    async analyzeFacebookAd(url = '', userId) {
        if (!this.model) {
            throw new Error('Gemini API Key is not configured');
        }
        await this.deductCredits(userId, this.CREDIT_COSTS.ADS_ANALYSIS, 'Phân tích quảng cáo Facebook');
        const isAllowed = await this.checkLimit('gemini');
        if (!isAllowed) {
            throw new Error('Hạn mức sử dụng Gemini đã hết. Vui lòng nâng cấp gói.');
        }
        await this.trackUsage('gemini');
        try {
            console.log(`--- Analyzing Facebook Ad: ${url} (User: ${userId}) ---`);
            let html = '';
            if (url && url.includes('facebook.com') && this.currentScrapingBeeKey) {
                try {
                    const sbResponse = await axios_1.default.get('https://app.scrapingbee.com/api/v1', {
                        params: {
                            'api_key': this.currentScrapingBeeKey,
                            'url': url,
                            'render_js': 'true',
                            'premium_proxy': 'true',
                            'country_code': 'vn'
                        },
                        timeout: 30000
                    });
                    html = sbResponse.data;
                }
                catch (e) {
                    console.warn("Scraping FB Ad failed, proceeding with content inference if possible:", e.message);
                }
            }
            const prompt = `
            Bạn là một chuyên gia phân tích quảng cáo (Creative Strategist) chuyên nghiệp. 
            Nhiệm vụ của bạn là bóc tách và phân tích mẫu quảng cáo dưới đây theo đúng QUY TRÌNH 6 GIAI ĐOẠN chuyên sâu.

            URL QUẢNG CÁO: ${url}
            DỮ LIỆU HTML/NỘI DUNG: ${html.substring(0, 15000)}

            YÊU CẦU PHÂN TÍCH CHI TIẾT THEO 6 GIAI ĐOẠN:
            1. Concept (Ý tưởng chủ đạo): Định nghĩa concept cốt lõi bài toán mà ad đang giải quyết hoặc góc tiếp cận cảm xúc/logic.
            2. Hook (Điểm chạm đầu tiên): 3-5 giây đầu tiên hoặc câu đầu của copy. Tại sao nó giữ chân người dùng?
            3. Script (Kịch bản/Thông điệp): Cấu trúc nội dung (Problem-Solution, Storytelling, v.v.). Các luận điểm bán hàng (USPs) được sắp xếp thế nào?
            4. Visuals (Hình ảnh/Video): Màu sắc, bối cảnh, chất lượng hình ảnh, text overlay. Nó hỗ trợ gì cho concept?
            5. Pacing (Nhịp điệu/Tốc độ): Tốc độ chuyển cảnh, tốc độ nói, cách ngắt nghỉ trong nội dung.
            6. Relevancy (Sự liên quan): Phân tích sự liền mạch giữa quảng cáo và đối tượng mục tiêu, sự kỳ vọng khi click vào trang đích (Landing Page).

            YÊU CẦU TRẢ VỀ JSON (CHỈ JSON):
            {
                "page_name": "...",
                "ad_headline": "Tiêu đề hoặc câu hook chính của bài viết",
                "ad_content_summary": "...",
                "engagement": {
                    "likes": "CHỈ lấy số lượt thích thực tế tìm thấy trong HTML. Nếu KHÔNG thấy, trả về '0'. TUYỆT ĐỐI KHÔNG dự đoán.",
                    "comments": "CHỈ lấy số lượt bình luận thực tế tìm thấy trong HTML. Nếu KHÔNG thấy, trả về '0'. TUYỆT ĐỐI KHÔNG dự đoán."
                },
                "ad_metadata": {
                    "start_date": "Chi tiết ngày bắt đầu (Nếu có trong HTML, không có thì để 'N/A')",
                    "estimated_reach": "Lấy số thực tế nếu có, không có thì để '0'",
                    "estimated_spend": "Lấy số thực nếu có, không có thì để '0'"
                },
                "six_stages_analysis": {
                    "concept": { "title": "Concept", "analysis": "Phân tích cực kỳ chi tiết về ý tưởng...", "score": 1-10 },
                    "hook": { "title": "Hook", "analysis": "Phân tích cực kỳ chi tiết về điểm chạm...", "score": 1-10 },
                    "script": { "title": "Kịch bản", "analysis": "Phân tích cực kỳ chi tiết về kịch bản...", "score": 1-10 },
                    "visuals": { "title": "Hình ảnh", "analysis": "Phân tích cực kỳ chi tiết về visuals...", "score": 1-10 },
                    "pacing": { "title": "Tốc độ", "analysis": "Phân tích cực kỳ chi tiết về nhịp điệu...", "score": 1-10 },
                    "relevancy": { "title": "Sự liên quan", "analysis": "Phân tích cực kỳ chi tiết về relevancy...", "score": 1-10 }
                },
                "targeting_prediction": {
                    "demographics": "...",
                    "interests": ["...", "..."],
                    "locations": "...",
                    "estimated_income_level": "Mức thu nhập dự kiến (Cao/Trung bình/Thấp)",
                    "buying_behavior": "Hành vi mua sắm (ví dụ: Thích hàng giảm giá, mua hàng cảm tính...)",
                    "detailed_target_logic": "Giải thích tại sao lại chọn target này trên phương diện marketing chuyên sâu"
                },
                "ai_overall_suggestion": {
                    "winning_formula": "Công thức giúp ad này thành công",
                    "potential_risks": "Các rủi ro về chính sách hoặc kỹ thuật",
                    "optimization_tips": "Các bước cụ thể để tối ưu mẫu này",
                    "scaling_advice": "Cách để scale mẫu quảng cáo này lên ngân sách lớn"
                },
                "predicted_kpis": {
                    "ctr": "Dự đoán tỷ lệ click (ví dụ: 1.5% - 2.8%)",
                    "cpc": "Ước tính chi phí mỗi click",
                    "cpm": "Ước tính chi phí mỗi 1000 lượt hiển thị",
                    "roas_potential": "Tiềm năng lợi nhuận (x3 - x5)",
                    "conversion_rate": "Dự đoán tỷ lệ chuyển đổi"
                }
            }
            `;
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            const parsedResult = JSON.parse(cleanJson);
            const db = this.firebaseAdmin.firestore();
            await db.collection('ads_analysis_history').add({
                userId,
                url,
                ...parsedResult,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return parsedResult;
        }
        catch (error) {
            console.error("Facebook Ad Analysis Error:", error.message);
            throw new Error('Lỗi khi phân tích quảng cáo: ' + error.message);
        }
    }
    async getAdsAnalysisHistory(userId) {
        try {
            const db = this.firebaseAdmin.firestore();
            const snapshot = await db.collection('ads_analysis_history')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error("Error fetching Ads Analysis History:", error);
            return [];
        }
    }
    async compareFacebookAds(analysisA, analysisB, userId) {
        if (!this.model)
            return null;
        await this.deductCredits(userId, this.CREDIT_COSTS.ADS_COMPARISON, 'So sánh quảng cáo');
        try {
            const prompt = `
            BẠN LÀ MỘT CHUYÊN GIA TỐI ƯU QUẢNG CÁO (ADS OPTIMIZATION EXPERT).
            Nhiệm vụ của bạn là so sánh hai mẫu quảng cáo (Ad A và Ad B) dựa trên dữ liệu phân tích dưới đây và đưa ra đánh giá mẫu nào tiềm năng hơn, ưu nhược điểm của từng mẫu và lời khuyên tối ưu.

            DỮ LIỆU PHÂN TÍCH AD A:
            - Page: ${analysisA.page_name}
            - Content: ${analysisA.ad_content_summary}
            - KPIs dự kiến: CTR(${analysisA.predicted_kpis?.ctr}), ROAS(${analysisA.predicted_kpis?.roas_potential})
            - Điểm 6 giai đoạn: Concept(${analysisA.six_stages_analysis?.concept?.score}), Hook(${analysisA.six_stages_analysis?.hook?.score}), Script(${analysisA.six_stages_analysis?.script?.score}), Visuals(${analysisA.six_stages_analysis?.visuals?.score}), Pacing(${analysisA.six_stages_analysis?.pacing?.score}), Relevancy(${analysisA.six_stages_analysis?.relevancy?.score})

            DỮ LIỆU PHÂN TÍCH AD B:
            - Page: ${analysisB.page_name}
            - Content: ${analysisB.ad_content_summary}
            - KPIs dự kiến: CTR(${analysisB.predicted_kpis?.ctr}), ROAS(${analysisB.predicted_kpis?.roas_potential})
            - Điểm 6 giai đoạn: Concept(${analysisB.six_stages_analysis?.concept?.score}), Hook(${analysisB.six_stages_analysis?.hook?.score}), Script(${analysisB.six_stages_analysis?.script?.score}), Visuals(${analysisB.six_stages_analysis?.visuals?.score}), Pacing(${analysisB.six_stages_analysis?.pacing?.score}), Relevancy(${analysisB.six_stages_analysis?.relevancy?.score})

            CẤU TRÚC PHẢN HỒI JSON (CHỈ JSON):
            {
                "winner": "Ad A" hoặc "Ad B" hoặc "Draw",
                "reasoning": "Tại sao mẫu này thắng? Phân tích dựa trên điểm số và logic marketing",
                "comparison_points": [
                    { "aspect": "Hook/Điểm chạm", "ad_a": "...", "ad_b": "...", "better": "Ad A/B" },
                    { "aspect": "Visual/Hình ảnh", "ad_a": "...", "ad_b": "...", "better": "Ad A/B" },
                    { "aspect": "Script/Kịch bản", "ad_a": "...", "ad_b": "...", "better": "Ad A/B" }
                ],
                "summary_ad_a": "Ưu điểm và nhược điểm chính của Ad A",
                "summary_ad_b": "Ưu điểm và nhược điểm chính của Ad B",
                "recommendation": "Lời khuyên tổng thể để kết hợp điểm mạnh của cả hai"
            }
            `;
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanJson);
        }
        catch (error) {
            console.error("Compare Ads Error:", error.message);
            throw new Error('Lỗi khi so sánh quảng cáo: ' + error.message);
        }
    }
    async fetchContentFromUrl(url, userId) {
        if (!url)
            throw new Error('URL không hợp lệ');
        await this.deductCredits(userId, this.CREDIT_COSTS.SOCIAL_CONTENT, 'Phân tích nội dung mạng xã hội');
        try {
            let html = '';
            if (this.currentScrapingBeeKey) {
                const sbResponse = await axios_1.default.get('https://app.scrapingbee.com/api/v1', {
                    params: {
                        'api_key': this.currentScrapingBeeKey,
                        'url': url,
                        'render_js': 'true',
                        'premium_proxy': 'true',
                        'country_code': 'vn'
                    },
                    timeout: 40000
                });
                html = sbResponse.data;
            }
            else {
                const response = await axios_1.default.get(url, { timeout: 10000 });
                html = response.data;
            }
            const prompt = `
            BẠN LÀ MỘT CHUYÊN GIA TRÍCH XUẤT DỮ LIỆU (DATA SCRAPER).
            Nhiệm vụ của bạn là trích xuất thông tin bài đăng từ HTML của một mạng xã hội (${url}).

            HÃY TÌM KIẾM KỸ TRONG HTML:
            1. Title: Tiêu đề hoặc dòng đầu tiên của bài viết.
            2. Content: Nội dung câu chữ (caption).
            3. Platform: facebook, instagram, linkedin, twitter, tiktok, youtube, hoặc other.
            4. Image: URL ảnh bìa/ảnh chính (ưu tiên og:image hoặc ảnh trong thẻ <img> lớn).
            5. Engagement (QUAN TRỌNG): 
               - Tìm số lượt Like/Reaction (ví dụ trong aria-label "Số lượt thích", "Thích", "Likes", hoặc text cạnh icon like).
               - Tìm số lượng Bình luận (Comments).
               - Tìm số lượng Chia sẻ (Shares).
               - Nếu không tìm thấy số cụ thể, hãy trả về "0". TUYỆT ĐỐI KHÔNG ĐƯỢC để là "N/A".

            DỮ LIỆU HTML: 
            ${html.substring(0, 30000)}

            CHỈ TRẢ VỀ JSON THEO CẤU TRÚC:
            {
                "title": "...",
                "content": "...",
                "platform": "...",
                "image_url": "...",
                "engagement": {
                    "likes": "Số hoặc 0",
                    "comments": "Số hoặc 0",
                    "shares": "Số hoặc 0"
                }
            }
            `;
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            const cleanNum = (val) => {
                if (!val)
                    return '0';
                const str = String(val).replace(/[^0-9KkMm.,]/g, '').trim();
                return str || '0';
            };
            return {
                title: parsed.title || '',
                content: parsed.content || '',
                platform: parsed.platform || 'other',
                image_url: parsed.image_url || '',
                engagement: {
                    likes: cleanNum(parsed.engagement?.likes),
                    comments: cleanNum(parsed.engagement?.comments),
                    shares: cleanNum(parsed.engagement?.shares)
                }
            };
        }
        catch (error) {
            console.error("Fetch Detailed Content Error:", error.message);
            throw new Error('Lỗi khi trích xuất thông tin bài viết: ' + error.message);
        }
    }
    async searchKeywordDiscovery(query, retryCount = 0, userId) {
        if (!this.currentScrapingBeeKey)
            return [];
        await this.deductCredits(userId, this.CREDIT_COSTS.KEYWORD_DISCOVERY, 'Khám phá từ khóa');
        try {
            const searchUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(query)}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&start_date[min]=&start_date[max]=&search_type=keyword_unordered&media_type=all`;
            const cleanScript = Buffer.from(`
                async function fastScrape() {
                    const delay = (ms) => new Promise(r => setTimeout(r, ms));
                    
                    // 1. Chấp nhận cookie nhanh nếu có
                    const cookieBtn = document.querySelector('button[data-cookiebanner="accept_button"], button[title*="Allow"], button[title*="Chấp nhận"]');
                    if (cookieBtn) {
                        cookieBtn.click();
                        await delay(1000);
                    }

                    // 2. Cuộn nhẹ để kích hoạt tải dữ liệu
                    window.scrollBy(0, 1000);
                    await delay(2000);

                    // 3. Đánh dấu dữ liệu ngay lập tức
                    document.querySelectorAll('div, span, p').forEach(el => {
                        const t = el.innerText || "";
                        if(t.includes('ID:')) {
                           const m = t.match(/ID:\\s*(\\d+)/);
                           if(m) el.insertAdjacentHTML('afterbegin', "[REAL_ID: " + m[1] + "] ");
                        }
                        if(t.includes('Bắt đầu') || t.includes('Started')) el.insertAdjacentHTML('afterbegin', "[START_DATE_MARK: " + t.substring(0,50) + "] ");
                        if(t.includes('tiếp cận') || t.includes('reach')) el.insertAdjacentHTML('afterbegin', "[REACH_MARK: " + t.substring(0,50) + "] ");
                        if(t.includes('Hiển thị') || t.includes('Impressions')) el.insertAdjacentHTML('afterbegin', "[IMPRESSIONS_MARK: " + t.substring(0,50) + "] ");
                        if(t.includes('đã chi') || t.includes('Spend')) el.insertAdjacentHTML('afterbegin', "[SPEND_MARK: " + t.substring(0,50) + "] ");
                    });

                    // 4. Tìm ảnh và giữ nguyên link gốc
                    document.querySelectorAll('img').forEach(img => {
                        const src = img.src || img.getAttribute('data-src');
                        if(src && src.startsWith('http')) img.setAttribute('data-found-img', src);
                    });
                }
                fastScrape();
            `).toString('base64');
            const sbResponse = await axios_1.default.get('https://app.scrapingbee.com/api/v1', {
                params: {
                    'api_key': this.currentScrapingBeeKey,
                    'url': searchUrl,
                    'render_js': true,
                    'wait': 3000,
                    'block_ads': true,
                    'block_resources': false,
                    'js_snippet': cleanScript,
                    'premium_proxy': true,
                    'stealth_proxy': true,
                    'country_code': 'vn'
                },
                timeout: 120000,
                validateStatus: () => true,
                responseType: 'text'
            });
            const html = sbResponse.data;
            if (typeof html !== 'string' || html.length < 1000) {
                if (html?.includes("limit reached")) {
                    console.error("--- CRITICAL: ScrapingBee API Key đã đạt giới hạn (Limit Reached). ---");
                    return [];
                }
                if (html?.includes("504 Gateway") || html?.includes("Time-out")) {
                    console.error("--- ERROR: Lỗi 504 Gateway Time-out từ Proxy. Đang thử lại nhanh... ---");
                }
                else {
                    console.warn(`[Attempt ${retryCount}] Lỗi nội dung ngắn (${html?.length || 0} ký tự).`);
                }
                if (retryCount < 2) {
                    return this.searchKeywordDiscovery(query, retryCount + 1, userId);
                }
                return [];
            }
            console.log(`Đã lấy dữ liệu thành công cho Keyword: ${query}. Phân tích AI...`);
            const prompt = `
                Bạn là một Chuyên gia nghiên cứu Keyword & Xu hướng thị trường (Market Research Expert).
                Nhiệm vụ: Phân tích sức mạnh và xu hướng của Keyword "${query}" thông qua TOP 9 quảng cáo đang chạy hiệu quả nhất.
                
                Dữ liệu đặc biệt cần chú ý:
                - ID: Tìm [REAL_ID: ...]
                - Ngày bắt đầu: [START_DATE_MARK: ...]
                - Tiếp cận: [REACH_MARK: ...]
                - Hiển thị (Impressions): [IMPRESSIONS_MARK: ...]
                - Chi phí (Spend): [SPEND_MARK: ...]
                - Tương tác (Engagement): [ENGAGEMENT_MARK: ...]

                QUY TẮC TRÍCH XUẤT JSON:
                Mỗi mẫu quảng cáo của Keyword phải là một object:
                - id: Số ID thực tế.
                - image: Link ảnh minh họa.
                - page: Tên thương hiệu/Fanpage.
                - body: Nội dung quảng cáo sử dụng keyword.
                - score: Điểm tiềm năng của Keyword (8.5 - 9.9).
                - metadata: {
                    "start_date": "Ngày keyword bắt đầu trending",
                    "platforms": ["Facebook", "Instagram", etc],
                    "reach": "Quy mô thị trường",
                    "impressions": "Tần suất xuất hiện",
                    "spend": "Ngân sách Keyword ước tính",
                    "locations": "Khu vực Keyword đang hot nhất",
                    "engagement": "Độ quan tâm của khách hàng"
                }
                - analysis: {
                    "target_audience": "Ai đang tìm kiếm keyword này?",
                    "strategy": "Cách keyword này được dùng để bán hàng",
                    "pros": ["Điểm mạnh 1", "Điểm mạnh 2"],
                    "area_scope": "Phạm vi ảnh hưởng"
                }

                Dữ liệu HTML:
                ${html.substring(0, 80000)}

                CHỈ TRẢ VỀ JSON ARRAY. KHÔNG GIẢI THÍCH.
                `;
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            if (!responseText)
                return [];
            const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (!jsonMatch)
                return [];
            const parsed = JSON.parse(jsonMatch[0]);
            return Array.isArray(parsed) ? parsed.map(ad => ({
                ...ad,
                id: String(ad.id).replace(/\D/g, ''),
                image: (ad.image && ad.image.includes('http')) ? ad.image : null,
                score: ad.score || (Math.random() * (9.9 - 8.5) + 8.5).toFixed(1)
            })).slice(0, 9) : [];
        }
        catch (error) {
            console.error("Keyword Discovery Error Detail:", error.code || error.message);
            if (retryCount < 1 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
                return this.searchKeywordDiscovery(query, retryCount + 1, userId);
            }
            return [];
        }
    }
    async getTrendingKeywords(category, userId) {
        if (!this.model)
            return [];
        await this.deductCredits(userId, this.CREDIT_COSTS.KEYWORD_DISCOVERY, 'Từ khóa xu hướng');
        try {
            const prompt = `
            Bạn là một chuyên gia Market Research và SEO Analysis.
            Nhiệm vụ: Cung cấp danh sách các từ khóa (Keywords) đang được tìm kiếm và sử dụng nhiều nhất (HOT TREND) trong lĩnh vực "${category}" tại thị trường Việt Nam trong 30 ngày qua.
            
            Yêu cầu dữ liệu cho mỗi từ khóa:
            - keyword: Từ khóa cụ thể.
            - search_volume: Mức độ tìm kiếm (ví dụ: "Rất cao", "Đang tăng mạnh", hoặc số liệu ước estimates).
            - competition: Mức độ cạnh tranh (Thấp/Trung bình/Cao).
            - trend: Xu hướng (Rising, Stable, Exploding).
            - reason: Lý do tại sao từ khóa này đang hot (ngắn gọn).
            - potential_score: Điểm tiềm năng kinh doanh (8.0 - 9.9).

            CẤU TRÚC JSON:
            [
                {
                    "keyword": "...",
                    "search_volume": "...",
                    "competition": "...",
                    "trend": "...",
                    "reason": "...",
                    "potential_score": 9.5
                }
            ]

            CHỈ TRẢ VỀ JSON ARRAY GỒM 12-15 TỪ KHÓA. KHÔNG GIẢI THÍCH.
            `;
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (!jsonMatch)
                return [];
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            console.error("Get Trending Keywords Error:", error);
            return [];
        }
    }
    async getKeywordDetail(keyword, userId) {
        if (!this.model)
            return null;
        await this.deductCredits(userId, this.CREDIT_COSTS.KEYWORD_DISCOVERY, 'Chi tiết từ khóa');
        try {
            const prompt = `
            BẠN LÀ MỘT CHUYÊN GIA PHÂN TÍCH THỊ TRƯỜNG & CHIẾN LƯỢC TĂNG TRƯỞNG (GROWTH HACKER).
            Hãy phân tích cực kỳ chi tiết về từ khóa: "${keyword}" tại thị trường Việt Nam.
            
            Yêu cầu nội dung phân tích:
            1. Tổng quan sức mạnh từ khóa (Score 1-100).
            2. Phân tích nhân khẩu học (Độ tuổi, giới tính, sở thích chủ yếu của người tìm kiếm).
            3. Phân bổ khu vực (Các tỉnh thành quan tâm nhiều nhất).
            4. Tính mùa vụ (Khi nào trong năm từ khóa này hot nhất).
            5. Gợi ý 5 ngách nội dung (Content Angles) để triển khai quảng cáo/SEO cho từ khóa này.
            6. Tiềm năng kinh doanh & Cách kiếm tiền từ từ khóa này (Monetization).
            7. Danh sách 5 từ khóa liên quan (LSI Keywords).

            TRẢ VỀ ĐỊNH DẠNG JSON (KHÔNG GIẢI THÍCH THÊM):
            {
                "keyword": "${keyword}",
                "power_score": 85,
                "demographics": {
                    "age_range": "18-35",
                    "gender_ratio": "60% Nữ, 40% Nam",
                    "interests": ["...", "..."]
                },
                "geographic_distribution": ["Hà Nội", "TP. Hồ Chí Minh", "..."],
                "seasonality": "Cao điểm vào tháng ...",
                "content_angles": ["...", "..."],
                "monetization": ["...", "..."],
                "related_keywords": ["...", "..."],
                "market_insight": "Phân tích ngắn gọn về hành vi người dùng đối với từ khóa này"
            }
            `;
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                return null;
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            console.error("Get Keyword Detail Error:", error);
            return null;
        }
    }
    async evaluateAndImproveContent(content, platform, userId) {
        if (!this.model)
            return null;
        await this.deductCredits(userId, this.CREDIT_COSTS.CONTENT_EVALUATION, 'Đánh giá nội dung');
        try {
            const prompt = `
            BẠN LÀ MỘT CHUYÊN GIA BIÊN TẬP NỘI DUNG (CONTENT EDITOR & STRATEGIST).
            Nhiệm vụ của bạn là đánh giá bài viết dưới đây cho nền tảng ${platform} và đưa ra phiên bản cải thiện tốt hơn.

            NỘI DUNG CẦN ĐÁNH GIÁ:
            "${content}"

            YÊU CẦU ĐÁNH GIÁ:
            1. Chấm điểm bài viết trên thang điểm 10.
            2. Chỉ ra các ưu điểm (Pros).
            3. Chỉ ra các điểm cần cải thiện (Cons/Weaknesses).
            4. Phân tích về giọng văn (Tone of voice).
            5. Đưa ra 1 phiên bản CẢI THIỆN lại bài viết đó (tối ưu hơn, hấp dẫn hơn, giữ nguyên ý nghĩa gốc).

            CẤU TRÚC PHẢN HỒI JSON (CHỈ JSON):
            {
                "score": 1-10,
                "pros": ["...", "..."],
                "cons": ["...", "..."],
                "tone_analysis": "Nhận xét về giọng văn hiện tại",
                "improvement_suggestions": ["...", "..."],
                "improved_content": "Phiên bản bài viết đã được chỉnh sửa hấp dẫn hơn",
                "key_changes_explanation": "Giải thích tại sao phiên bản mới lại tốt hơn"
            }
            `;
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanJson);
        }
        catch (error) {
            console.error("Evaluate Content Error:", error.message);
            throw new Error('Lỗi khi đánh giá nội dung: ' + error.message);
        }
    }
    async trackUsage(serviceId) {
        try {
            const db = this.firebaseAdmin.firestore();
            const usageRef = db.collection('settings').doc('usage_stats');
            await usageRef.set({
                [serviceId]: admin.firestore.FieldValue.increment(1),
                last_updated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        catch (error) {
            console.error('Error tracking usage:', error);
        }
    }
    async checkLimit(serviceId) {
        try {
            const db = this.firebaseAdmin.firestore();
            const usageDoc = await db.collection('settings').doc('usage_stats').get();
            const data = usageDoc.data();
            const current = data?.[serviceId] || 0;
            const limitsDoc = await db.collection('settings').doc('api_keys').get();
            const limits = limitsDoc.data()?.limits || {};
            const limit = limits[serviceId];
            if (!limits.strict_mode) {
                return true;
            }
            if (limit && current >= limit) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error in checkLimit:', error);
            return true;
        }
    }
    async generateContent(data, userId) {
        if (!this.model) {
            throw new Error('Gemini API Key is not configured');
        }
        await this.deductCredits(userId, this.CREDIT_COSTS.SOCIAL_CONTENT, 'Viết nội dung');
        const isAllowed = await this.checkLimit('gemini');
        if (!isAllowed) {
            throw new Error('Hạn mức sử dụng Gemini đã hết. Vui lòng nâng cấp gói.');
        }
        await this.trackUsage('gemini');
        const { platform, length, brand, field, features, price, offers, mode, framework, tone, category, videoType } = data;
        let prompt = '';
        if (mode === 'affiliate_viral') {
            let typeInstruction = "";
            if (videoType === 'entertainment') {
                typeInstruction = "Tập trung vào tính giải trí, nhịp điệu nhanh, các tình huống gây bất ngờ hoặc hài hước. Ưu tiên yếu tố viral và bắt trend.";
            }
            else if (videoType === 'product') {
                typeInstruction = "Tập trung vào giải quyết nỗi đau của khách hàng, nêu bật USP (điểm bán hàng độc nhất) và có lời kêu gọi hành động (CTA) cực kỳ thuyết phục.";
            }
            else if (videoType === 'educational') {
                typeInstruction = "Cung cấp kiến thức giá trị, các bước thực hiện rõ ràng (Step-by-step). Giọng văn chuyên gia nhưng lôi cuốn, dễ hiểu.";
            }
            else if (videoType === 'drama') {
                typeInstruction = "Xây dựng tình huống kịch tính, có nút thắt và giải quyết vấn đề bằng một thông điệp truyền cảm hứng hoặc bài học ý nghĩa.";
            }
            prompt = `
            BẠN LÀ MỘT ĐẠO DIỄN SẢN XUẤT VIDEO VIRAL XUẤT SẮC.
            MỤC TIÊU: ${typeInstruction}
            NHIỆM VỤ: Tạo kịch bản video ngắn cho ${platform.toUpperCase()} theo phong cách ${tone} và thể loại ${category || 'Giải trí'}.
            
            DỮ LIỆU SẢN PHẨM:
            - Sản phẩm: ${brand}
            - Ngành: ${field}
            - Tính năng: ${features}
            - Giá & Ưu đãi: ${price}, ${offers}
            - Công thức (Framework): ${framework}

            YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG (KHÔNG ĐƯỢC SAI LỆCH):
            Dữ liệu trả về chỉ bao gồm danh sách các phân cảnh. Mỗi phân cảnh viết theo cấu trúc:

            Phân cảnh 1:
            [Thời lượng]: (Ví dụ: 3 giây, 5 giây...)
            [Bối cảnh]: (Mô tả địa điểm, không gian quay)
            [Góc quay]: (Viết cụ thể góc máy ở đây)
            [Nội dung]: (Tóm tắt ý tưởng/giá trị cốt lõi của cảnh này)
            [Hành động]: (Mô tả hành động của nhân vật hoặc sản phẩm ở đây)
            [Âm thanh]: (Mô tả nhạc nền, hiệu ứng âm thanh SFX)
            [Lời thoại / Text]: (Nội dung lời thoại hoặc chữ hiện lên màn hình ở đây)

            Phân cảnh 2:
            [Thời lượng]: ...
            [Bối cảnh]: ...
            [Góc quay]: ...
            [Nội dung]: ...
            [Hành động]: ...
            [Âm thanh]: ...
            [Lời thoại / Text]: ...

            (Tiếp tục cho đến hết video, khoảng 4-6 phân cảnh)

            LƯU Ý QUAN TRỌNG:
            - Tuyệt đối không lời mở đầu, không lời kết.
            - Phải bắt đầu ngay bằng "Phân cảnh 1:".
            - Luôn có đủ tất cả các nhãn yêu cầu trong từng phân cảnh.
            - Sử dụng ngôn ngữ ${tone === 'Gen Z' ? 'trẻ trung, slangs' : tone === 'Hài hước' ? 'vui nhộn, dí dỏm' : 'chuyên nghiệp'}.
            `;
        }
        else if (mode === 'educational') {
            prompt = `
            Hãy đóng vai một chuyên gia nội dung (Content Creator) và chuyên gia trong lĩnh vực ${category || field}. 
            Nhiệm vụ: Viết một bài chia sẻ kiến thức, giá trị hoặc lời khuyên chuyên sâu cho nền tảng ${platform.toUpperCase()} về chủ đề: "${features}".
            
            Yêu cầu về nội dung:
            - Tập trung 100% vào việc cung cấp giá trị, thông tin hữu ích và giải pháp cho người đọc.
            - Không được nhắc đến giá cả, không chào hàng, không khuyến mãi.
            - PHONG CÁCH THEO NỀN TẢNG: 
              + Facebook/Zalo: Viết bài sâu sắc, phân tích kỹ, chia sẻ tâm huyết (Dài).
              + TikTok/Reels/Insta: Viết "giật gân", ngắn gọn, tập trung vào điểm nhấn quan trọng nhất (Ngắn).
            - Độ dài: ${length === 'long' ? 'Chuyên sâu, chi tiết (8-12 ý)' : 'Súc tích, trực diện (3-5 ý)'}.
            - Tone giọng: ${tone || 'Chuyên nghiệp'}.
            
            YÊU CẦU ĐỊNH DẠNG (BẮT BUỘC):
            1. SỬ DỤNG EMOJI SINH ĐỘNG: Bắt buộc dùng Emoji Unicode ở ĐẦU mỗi mục.
            2. TUYỆT ĐỐI KHÔNG DÙNG DẤU SAO (*): Không dùng bất kỳ định dạng Markdown nào.
            3. Cấu trúc: Tiêu đề lôi cuốn (có Emoji) -> Mở đầu -> 3-5 Ý chính/Lời khuyên quan trọng -> Kết luận/Lời nhắn nhủ.
            
            Chỉ trả về nội dung bài viết. PHẢI CÓ EMOJI VÀ KHÔNG CÓ DẤU SAO (*).
            `;
        }
        else {
            prompt = `
            Hãy đóng vai một chuyên gia Social Media Marketing hàng đầu toàn cầu. Hãy tạo một nội dung bài đăng cực kỳ bùng nổ và thu hút cho nền tảng ${platform.toUpperCase()}.
            
            Thể loại nội dung: ${category || 'Tin tức & Chia sẻ'}
            PHONG CÁCH THEO NỀN TẢNG (QUAN TRỌNG): 
            - Facebook/Zalo: Viết bài kể chuyện lôi cuốn, xây dựng lòng tin, nội dung đầy đủ (Dài).
            - TikTok/Reels/Insta: Ngắn gọn, "giật gân", trực diện, tập trung tối đa vào từ khóa thu hút (Ngắn).
            Độ dài yêu cầu: ${length === 'long' ? 'Bài viết đầy đủ, chi tiết' : 'Bài viết ngắn gọn, xúc tích'}.
            
            Thông tin khách hàng:
            - Lĩnh vực: ${field}
            - Thương hiệu: ${brand}
            - Lợi ích chính: ${features}
            - Giá sản phẩm: ${price || 'Liên hệ ngay'}
            - Ưu đãi / Khuyến mãi: ${offers || 'Không có (Hãy tự sáng tạo thêm một ưu đãi nhỏ nếu thấy cần thiết để tăng tương tác)'}
            
            Yêu cầu bài viết chuyên nghiệp và tinh tế(QUAN TRỌNG):
            YÊU CẦU ĐỊNH DẠNG(BẮT BUỘC):
            1. SỬ DỤNG EMOJI SINH ĐỘNG: Bắt buộc dùng Emoji Unicode ở ĐẦU mỗi mục và ĐẦU các dòng liệt kê. 
               Ví dụ: 🚀 "Tên tiêu đề", ✨ "Lợi ích 1"...
            2. TUYỆT ĐỐI KHÔNG DÙNG DẤU SAO(*): Không dùng bất kỳ định dạng Markdown nào.
            3. KHÔNG DÙNG DẤU NGOẶC KÉP(") ĐỂ BỌC TIÊU ĐỀ: Chỉ viết tiêu đề bình thường sau Emoji.
            
            Cấu trúc bài viết mẫu:
                [Emoji] Tiêu đề bài viết hấp dẫn

            [Emoji] Giới thiệu ngắn gọn...

            [Emoji] Ưu điểm nổi bật:
                -[Emoji] Lợi ích 1
            - [Emoji] Lợi ích 2

            [Emoji] Kêu gọi hành động(CTA) ngay!
            
            Chỉ trả về nội dung bài viết.PHẢI CÓ EMOJI VÀ KHÔNG CÓ DẤU SAO(*).
            `;
        }
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return { content: response.text() };
    }
    async generateSpeech(data, userId) {
        const apiKey = this.currentFptKey;
        if (!apiKey) {
            console.error('--- ERROR: FPT_AI_API_KEY is not configured ---');
            throw new Error('FPT.AI API Key is not configured');
        }
        const charCount = data.text.length;
        const cost = Math.max(10, Math.ceil(charCount / 100) * this.CREDIT_COSTS.TTS_PER_100_CHARS);
        await this.deductCredits(userId, cost, 'Chuyển văn bản thành giọng nói');
        const isAllowed = await this.checkLimit('fpt');
        if (!isAllowed) {
            throw new Error('Hạn mức sử dụng FPT.AI đã hết. Vui lòng nâng cấp gói.');
        }
        await this.trackUsage('fpt');
        console.log(`-- - Calling FPT.AI TTS with voice: ${data.voice}, speed: ${data.speed} --- `);
        try {
            const response = await axios_1.default.post('https://api.fpt.ai/hmi/tts/v5', data.text, {
                headers: {
                    'api_key': apiKey,
                    'voice': data.voice,
                    'speed': data.speed.toString(),
                }
            });
            if (response.data && (response.data.async || response.data.url)) {
                const audioUrl = response.data.async || response.data.url;
                console.log('--- FPT.AI Success! Audio URL:', audioUrl, '---');
                return { url: audioUrl };
            }
            else {
                console.error('--- FPT.AI Response Data:', response.data, '---');
                throw new Error('Không nhận được URL âm thanh từ FPT.AI');
            }
        }
        catch (error) {
            console.error('Lỗi FPT.AI TTS:', error.response?.data || error.message);
            throw new Error('Lỗi khi gọi FPT.AI Speech API: ' + (error.response?.data?.message || error.message));
        }
    }
    async downloadProxy(url) {
        try {
            const response = await (0, axios_1.default)({
                url,
                method: 'GET',
                responseType: 'stream',
            });
            return response;
        }
        catch (error) {
            console.error('Lỗi khi proxy download:', error.message);
            throw new Error('Không thể tải file từ server nguồn');
        }
    }
    async generateImageMockup(originalPrompt, productImage, modelImage, aspectRatio, userId) {
        if (userId) {
            await this.deductCredits(userId, this.CREDIT_COSTS.MOCKUP, 'Tạo Mockup AI');
        }
        try {
            console.log(`-- - Mockup Generation via Gemini 3 Flash(${aspectRatio || '1:1'})--- `);
            const ratioMap = {
                '1:1': 'ASPECT_RATIO_1_1',
                '16:9': 'ASPECT_RATIO_16_9',
                '9:16': 'ASPECT_RATIO_9_16'
            };
            const googleRatio = ratioMap[aspectRatio || '1:1'] || 'ASPECT_RATIO_1_1';
            let enhancedPrompt = originalPrompt;
            const enhanceModel = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            try {
                let promptParts = [
                    `Act as a world - class Visual Artist and Visual Clone Expert. 
                    Construct a high - precision prompt for an image generation agent.
            Idea: "${originalPrompt}".

                Instructions:
        1. STRICT PRODUCT IDENTITY: The generated image MUST preserve the EXACT appearance, logo, texture, and structural design of the PRODUCT provided in the image.
                    2. ZERO MODIFICATION: Do NOT add new text, logos, or modify existing designs on the product.Do NOT simplify the product features.
                    3. VISUAL CLONING: Perform a direct pixel - level transfer of the product's identity into the new scene.
        4. SPATIAL REFERENCE: Maintain the correct scale and perspective of the product relative to the environment / person.
                    5. High - End Commercial: Use professional studio lighting(Rembrandt lighting, rim lights), 8k resolution, and photorealistic textures.
                    6. Composition: The product must be the focal point.Ensure natural interaction(e.g., if it's a sweater, it must be worn exactly as shown).
        7. Target Aspect Ratio: ${aspectRatio || '1:1'} (${aspectRatio === '9:16' ? 'Portrait' : aspectRatio === '16:9' ? 'Landscape' : 'Square'}).
        8. Output ONLY the English descriptive prompt focusing on the environment and product placement.Max 90 words.`
                ];
                if (productImage && productImage.includes('base64,')) {
                    promptParts.push({ inlineData: { data: productImage.split('base64,')[1], mimeType: "image/jpeg" } });
                }
                if (modelImage && modelImage.includes('base64,')) {
                    promptParts.push({ inlineData: { data: modelImage.split('base64,')[1], mimeType: "image/jpeg" } });
                }
                const result = await enhanceModel.generateContent(promptParts);
                enhancedPrompt = result.response.text().replace(/[*"`]/g, '').trim();
                console.log('--- Gemini 3 Enhanced Prompt:', enhancedPrompt);
            }
            catch (e) {
                console.warn("Gemini 3 Enhance failed, using original:", e.message);
                try {
                    const fallbackEnhance = this.model || this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                    const fResult = await fallbackEnhance.generateContent(originalPrompt);
                    enhancedPrompt = fResult.response.text();
                }
                catch (se) { }
            }
            const googleModels = [
                "gemini-2.5-flash-image",
                "gemini-2.0-flash-exp",
                "gemini-2.0-flash"
            ];
            for (const modelName of googleModels) {
                for (let attempt = 1; attempt <= 2; attempt++) {
                    try {
                        console.log(`--- Trying Model: ${modelName} (Attempt ${attempt}) ---`);
                        const imgModel = this.genAI.getGenerativeModel({ model: modelName });
                        const finalParts = [
                            { text: enhancedPrompt }
                        ];
                        if (productImage && productImage.includes('base64,')) {
                            finalParts.push({ inlineData: { data: productImage.split('base64,')[1], mimeType: "image/jpeg" } });
                        }
                        if (modelImage && modelImage.includes('base64,')) {
                            finalParts.push({ inlineData: { data: modelImage.split('base64,')[1], mimeType: "image/jpeg" } });
                        }
                        const result = await imgModel.generateContent({
                            contents: [{ role: 'user', parts: finalParts }]
                        });
                        const candidates = result.response.candidates;
                        if (candidates && candidates.length > 0 && candidates[0].content.parts.length > 0) {
                            const imagePart = candidates[0].content.parts.find(part => part.inlineData);
                            if (imagePart && imagePart.inlineData) {
                                const base64Image = imagePart.inlineData.data;
                                const mimeType = imagePart.inlineData.mimeType || 'image/jpeg';
                                console.log(`--- Success with: ${modelName} ---`);
                                try {
                                    const storageUrl = await this.uploadBase64ToStorage(base64Image, mimeType, userId);
                                    if (storageUrl) {
                                        return { url: storageUrl };
                                    }
                                }
                                catch (storageErr) {
                                    console.warn("Storage upload failed, falling back to base64:", storageErr.message);
                                }
                                return { url: `data:${mimeType};base64,${base64Image}` };
                            }
                            else {
                                console.log(`--- Model ${modelName} returned text instead of image:`, result.response.text().substring(0, 100));
                            }
                        }
                    }
                    catch (err) {
                        const isRateLimit = err.message?.includes('429') || err.message?.includes('exhausted');
                        console.warn(`Model ${modelName} error:`, err.message);
                        if (isRateLimit && attempt === 1) {
                            console.log('--- Quota hit, waiting 2.5s before retry... ---');
                            await new Promise(r => setTimeout(r, 2500));
                            continue;
                        }
                        break;
                    }
                }
            }
            throw new Error('Dịch vụ Gemini 3 Image hiện đang bảo trì hoặc chưa hỗ trợ vùng này.');
        }
        catch (error) {
            console.error("Gemini 3 Mockup Error:", error.message);
            throw new Error('Không thể tạo ảnh bằng Gemini 3. Vui lòng thử lại sau giây lát!');
        }
    }
    async uploadBase64ToStorage(base64Data, mimeType, userId) {
        try {
            const bucket = this.firebaseAdmin.storage().bucket('marketos-9b845.firebasestorage.app');
            const fileName = `ai_results/${userId || 'guest'}/${(0, uuid_1.v4)()}.jpg`;
            const file = bucket.file(fileName);
            const buffer = Buffer.from(base64Data, 'base64');
            await file.save(buffer, {
                metadata: {
                    contentType: mimeType,
                    cacheControl: 'public, max-age=31536000',
                },
                public: true
            });
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: '12-31-2099'
            });
            return url;
        }
        catch (error) {
            console.error("Lỗi upload Storage:", error.message);
            return null;
        }
    }
    async generateMarketingPlan(data, userId) {
        if (!this.model) {
            throw new Error('Gemini API Key is not configured');
        }
        await this.deductCredits(userId, this.CREDIT_COSTS.MARKETING_PLAN, 'Lên kế hoạch marketing');
        const prompt = `
        Bạn là Chuyên gia Chiến lược Marketing hàng đầu Việt Nam với 15 năm kinh nghiệm.
        Hãy tạo một Kế hoạch Marketing chi tiết, khả thi và sáng tạo cho dự án sau:

        THÔNG TIN DỰ ÁN:
        - Tên sản phẩm/Sự kiện: ${data.productName}
        - Mô tả: ${data.description}
        - Đối tượng khách hàng: ${data.targetAudience}
        - Mục tiêu chính: ${data.goal}
        - Thời gian triển khai: ${data.duration} tuần
        - Ngân sách: ${data.budget || 'Chưa xác định'}

        YÊU CẦU ĐẦU RA:
        Trả về ĐÚNG định dạng JSON sau (KHÔNG thêm markdown):
        {
            "plan_name": "Tên chiến dịch bằng tiếng Việt (ngắn gọn, hấp dẫn)",
            "strategy_overview": "Tóm tắt chiến lược tổng thể bằng tiếng Việt (2-3 câu)",
            "key_tactics": ["Chiến thuật 1", "Chiến thuật 2", "Chiến thuật 3"],
            "target_insight": "Phân tích sâu về insight khách hàng mục tiêu bằng tiếng Việt",
            "detailed_steps": ["Việc cần làm 1", "Việc cần làm 2", "Việc cần làm 3", "Việc cần làm 4", "Việc cần làm 5"],
            "schedule": [
                {
                    "day_offset": 1,
                    "title": "Tiêu đề hoạt động ngắn gọn",
                    "platform": "Facebook/TikTok/Instagram/Shopee/Offline",
                    "content_idea": "MÔ TẢ THỰC THI: Nội dung bài đăng cụ thể, hashtag, caption, call-to-action, loại hình ảnh/video cần chuẩn bị",
                    "time": "Thời gian đăng tối ưu (VD: 09:00, 19:30, hoặc Cả ngày)",
                    "type": "content"
                }
            ]
        }

        QUY TẮC QUAN TRỌNG:
        1. Lịch trình chi tiết: Tạo ít nhất 3-4 hoạt động MỖI TUẦN, phân bổ đều trong ${data.duration} tuần
        2. Nội dung cụ thể: Mỗi content_idea phải chi tiết như một brief thực tế gồm:
           - Nội dung bài viết đầy đủ (caption, hashtag)
           - Loại hình ảnh/video cần chuẩn bị
           - Thời gian đăng tối ưu (VD: 19h-21h)
           - Call-to-action rõ ràng
        3. Đa dạng nền tảng: Kết hợp Facebook, TikTok, Instagram, Shopee (nếu phù hợp)
        4. Phân loại type:
           - content: Bài đăng organic (video, hình ảnh, story)
           - event: Sự kiện, livestream, offline
           - ads: Quảng cáo có trả phí
        5. Ngôn ngữ: Toàn bộ kế hoạch phải bằng TIẾNG VIỆT
        6. Thực tế: Dựa trên ngân sách và đối tượng khách hàng để đề xuất phù hợp

        BẮT ĐẦU TẠO KẾ HOẠCH NGAY!
        `;
        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        }
        catch (error) {
            console.error("Lỗi khi tạo Marketing Plan:", error);
            throw new Error("Không thể tạo kế hoạch. Vui lòng thử lại.");
        }
    }
    async scrapeProductData(url, userId) {
        if (!this.model) {
            throw new Error('Gemini API Key is not configured');
        }
        await this.deductCredits(userId, this.CREDIT_COSTS.PRODUCT_SCRAPER, 'Cào dữ liệu sản phẩm');
        try {
            console.log(`--- Scraping Product from: ${url} (Using ScrapingBee: ${!!this.currentScrapingBeeKey}) ---`);
            let html = '';
            if (this.currentScrapingBeeKey) {
                const apiKey = this.currentScrapingBeeKey.trim();
                try {
                    console.log(`--- ScrapingBee Stage 1 (Original URL): ${url.substring(0, 100)}... ---`);
                    const sbResponse = await axios_1.default.get('https://app.scrapingbee.com/api/v1', {
                        params: {
                            'api_key': apiKey,
                            'url': url,
                            'render_js': 'true',
                            'premium_proxy': 'true',
                            'country_code': 'vn',
                            'block_ads': 'true'
                        },
                        timeout: 60000
                    });
                    html = sbResponse.data;
                }
                catch (err1) {
                    console.warn("--- ScrapingBee Stage 1 Failed, trying Stage 2 (Clean URL) ---");
                    try {
                        let cleanUrl = url.split('?')[0];
                        const sbResponse = await axios_1.default.get('https://app.scrapingbee.com/api/v1', {
                            params: {
                                'api_key': apiKey,
                                'url': cleanUrl,
                                'render_js': 'true',
                                'premium_proxy': 'true',
                                'country_code': 'vn',
                                'block_ads': 'true'
                            },
                            timeout: 60000
                        });
                        html = sbResponse.data;
                    }
                    catch (err2) {
                        console.warn("--- ScrapingBee Stage 2 Failed, using Direct Fallback ---");
                        const fallbackResponse = await axios_1.default.get(url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
                                'Accept-Language': 'vi-VN,vi;q=0.9',
                            },
                            timeout: 20000
                        });
                        html = fallbackResponse.data;
                    }
                }
            }
            else {
                const response = await axios_1.default.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
                        'Accept-Language': 'vi-VN,vi;q=0.9',
                    },
                    timeout: 20000
                });
                html = response.data;
            }
            console.log(`--- HTML Captured (Length: ${html.length}) ---`);
            const title = html.match(/<title>(.*?)<\/title>/)?.[1] || "";
            console.log(`--- Product Title: ${title} ---`);
            let productImages = [];
            let videoCoverId = "";
            const videoMatch = html.match(/"video_id":\s*"(.*?)"/);
            const coverMatch = html.match(/"cover":\s*"(.*?)"/);
            if (coverMatch)
                videoCoverId = coverMatch[1];
            const imagesMatch = html.match(/"images":\s*\[\s*"(.*?)"\s*\]/);
            if (imagesMatch) {
                const imageIds = imagesMatch[1].split('","');
                productImages = imageIds
                    .filter(id => id !== videoCoverId)
                    .map(id => `https://down-vn.img.susercontent.com/file/${id}`);
                console.log(`--- Found ${productImages.length} official product images ---`);
            }
            if (productImages.length === 0) {
                const imageRegex = /https?:\/\/(?:down-vn\.img\.susercontent\.com|cf\.shopee\.vn)\/file\/[a-zA-Z0-9\-_]+/gi;
                productImages = Array.from(new Set(html.match(imageRegex) || []))
                    .filter(img => {
                    const low = img.toLowerCase();
                    return !low.includes('play') && !low.includes('video') &&
                        !low.includes('overlay') && !low.includes('template') &&
                        !low.includes('banner');
                })
                    .map(img => img.includes('_tn') ? img.split('_tn')[0] : img);
            }
            const cleanImages = productImages.slice(0, 12);
            const scriptsWithState = html.match(/<script.*?>([\s\S]*?)<\/script>/g)
                ?.filter((s) => s.includes('item_id') ||
                s.includes('price') ||
                s.includes('description') ||
                s.includes('models') ||
                s.includes('shop_id') ||
                s.includes('attributes'))
                .map((s) => s.replace(/<script.*?>|<\/script>/g, '').trim())
                .join("\n")
                .substring(0, 30000) || "";
            const jsonLds = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/g)
                ?.map((s) => s.replace(/<script .*?>|<\/script>/g, ''))
                .join("\n") || "";
            const prompt = `
            Bạn là AI chuyên gia bóc tách dữ liệu Shopee. Hãy trả về thông tin SẠCH.
            
            DỮ LIỆU CUNG CẤP:
            - Tiêu đề: ${title}
            - Scripts: ${scriptsWithState}
            - Dữ liệu cấu trúc JSON-LD: ${jsonLds}
            - List ảnh gốc: ${cleanImages.join('\n')}

            YÊU CẦU NGHIÊM NGẶT:
            1. images: CHỈ LẤY TỐI ĐA 8 ẢNH SẢN PHẨM THỰC TẾ.
               - TUYỆT ĐỐI KHÔNG lấy ảnh bìa video (có nút Play hoặc mờ).
               - TUYỆT ĐỐI KHÔNG lấy ảnh banner khuyến mãi (có chữ "Sale", "Voucher", "25-2").
               - TUYỆT ĐỐI KHÔNG lấy bảng quy đổi kích cỡ (Size chart).
               - CHỈ lấy ảnh chụp sản phẩm sạch sẽ từ các góc độ khác nhau.
            2. price: Giá bán đúng (số).
            3. description: Mô tả chi tiết, đầy đủ thông số.
            4. product_name: Tên sản phẩm sạch sẽ.
            5. attributes: Trích xuất toàn bộ phần "Chi tiết sản phẩm" (Danh mục, Chất liệu, Xuất xứ, v.v.) thành một object key-value (Ví dụ: {"Danh mục": "Nam > Áo", "Chất liệu": "Cotton"}).

            Trả về JSON chuẩn (KHÔNG MARKDOWN):
            {
                "product_name": "...",
                "brand": "...",
                "price": "...",
                "description": "...",
                "images": ["url1", "url2", ...],
                "attributes": {
                    "Tên thuộc tính": "Giá trị thuộc tính",
                    ...
                }
            }
            `;
            console.log("--- Analyzing with Gemini (Advanced Extraction) ---");
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            console.log("--- Process Complete ---");
            return JSON.parse(cleanJson);
        }
        catch (error) {
            console.error("Lỗi hệ thống cào dữ liệu:", error.message);
            throw new common_1.InternalServerErrorException("hệ thống đang quá tải vui lòng thử lại sau ít phút");
        }
    }
    async generateVideoScript(data, userId) {
        if (!this.model) {
            throw new Error('Gemini API Key is not configured');
        }
        await this.deductCredits(userId, this.CREDIT_COSTS.SOCIAL_CONTENT, 'Tạo kịch bản video');
        const prompt = `
        Bạn là Đạo diễn hình ảnh và Chuyên gia Creative Marketing. 
        Hãy tạo một kịch bản Storyboard chi tiết cho một video quảng cáo sản phẩm đỉnh cao.

        THÔNG TIN SẢN PHẨM:
        - Sản phẩm: ${data.productName}
        - Thương hiệu: ${data.brand}
        - Mô tả: ${data.description}
        - Phong cách muốn truyền tải (Vibe): ${data.vibe}
        - Thời lượng: ${data.duration} giây
        - Định dạng: ${data.ratio} (Dọc hoặc Ngang)

        YÊU CẦU ĐẦU RA:
        Mô tả từng cảnh quay (scene) để dựng thành video 3D hoặc quay phim thực tế. 
        Trả về ĐÚNG định dạng JSON sau (KHÔNG thêm markdown):
        {
            "title": "Tên chiến dịch video hấp dẫn",
            "scenes": [
                {
                    "time": "00:00 - 00:03",
                    "visual": "Mô tả chi tiết hình ảnh: Góc máy, chuyển động, ánh sáng, sản phẩm xuất hiện như thế nào",
                    "text": "Lời thoại hoặc text overlay xuất hiện trên màn hình",
                    "audio": "Mô tả âm thanh: Nhạc nền, tiếng động (SFX)"
                }
            ],
            "marketing_hooks": ["Hook 1 (3 giây đầu)", "Câu kêu gọi hành động chất", "Hashtag đề xuất"]
        }

        QUY TẮC:
        1. Phân bổ cảnh quay hợp lý dựa trên thời lượng ${data.duration}s.
        2. Visual: Cực kỳ chi tiết, mang tính điện ảnh cao, phù hợp với phong cách ${data.vibe}.
        3. Marketing: Chú trọng 3 giây đầu để thu hút khách hàng.
        4. Toàn bộ nội dung bằng tiếng Việt.
        5. Đảm bảo nhịp điệu (pacing) của video.

        BẮT ĐẦU TẠO STORYBOARD!
        `;
        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        }
        catch (error) {
            console.error("Lỗi khi tạo Video Script:", error);
            throw new Error("Không thể tạo kịch bản video. Vui lòng thử lại.");
        }
    }
    async downloadUniversalVideo(url, userId) {
        await this.deductCredits(userId, this.CREDIT_COSTS.VIDEO_DOWNLOAD, 'Tải video');
        const platform = this.detectPlatform(url);
        if (platform === 'TikTok' || platform === 'Douyin') {
            try {
                const tikData = await this.downloadTikTokVideo(url, userId);
                return {
                    title: tikData.title || `Video ${platform}`,
                    thumbnail: tikData.cover || tikData.origin_cover,
                    source: new URL(url).hostname,
                    platform: platform,
                    quality: [
                        {
                            label: 'Chất lượng cao nhất (No Watermark)',
                            url: tikData.hdplay || tikData.play,
                            type: 'video'
                        },
                        {
                            label: 'Tải Nhạc (MP3)',
                            url: tikData.music,
                            type: 'audio'
                        }
                    ]
                };
            }
            catch (err) {
                console.warn(`TikWM failed for ${platform}, falling back to Cobalt:`, err.message);
            }
        }
        if (url.includes('facebook.com') || url.includes('fb.watch')) {
            try {
                if (url.includes('/stories/')) {
                    const storyMatch = url.match(/\/stories\/(\d+)\/([^\/?]+)/);
                    if (storyMatch)
                        url = `https://www.facebook.com/stories/${storyMatch[1]}/${storyMatch[2]}/`;
                }
                else if (url.includes('/reels/') || url.includes('/reel/')) {
                    const reelMatch = url.match(/\/(?:reels|reel)\/([a-zA-Z0-9_-]+)/);
                    if (reelMatch)
                        url = `https://www.facebook.com/watch/?v=${reelMatch[1]}`;
                }
                else if (url.includes('/share/v/')) {
                    const shareMatch = url.match(/\/share\/v\/([^\/?]+)/);
                    if (shareMatch)
                        url = `https://www.facebook.com/watch/?v=${shareMatch[1]}`;
                }
                if (!url.includes('facebook.com/watch') && !url.includes('facebook.com/video.php') && url.includes('?')) {
                    url = url.split('?')[0];
                }
                console.log(`--- Optimized Facebook URL: ${url} ---`);
            }
            catch (e) {
                console.warn('Error cleaning Facebook URL:', e.message);
            }
            try {
                console.log(`--- Trying Facebook-specific API for: ${url} ---`);
                const fbApis = [
                    {
                        name: 'getmyfb',
                        url: 'https://getmyfb.com/process',
                        getData: async (videoUrl) => {
                            const params = new URLSearchParams();
                            params.append('id', videoUrl);
                            params.append('locale', 'en');
                            const res = await axios_1.default.post('https://getmyfb.com/process', params, {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                                    'Referer': 'https://getmyfb.com/',
                                    'Origin': 'https://getmyfb.com'
                                },
                                timeout: 15000
                            });
                            return res.data;
                        }
                    },
                    {
                        name: 'fdown',
                        url: 'https://fdown.net/download.php',
                        getData: async (videoUrl) => {
                            const res = await axios_1.default.get(`https://fdown.net/download.php?URLz=${encodeURIComponent(videoUrl)}`, {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                                    'Referer': 'https://fdown.net/',
                                },
                                timeout: 15000,
                            });
                            return res.data;
                        }
                    }
                ];
                for (const api of fbApis) {
                    try {
                        console.log(`Trying Facebook API: ${api.name}`);
                        const html = await api.getData(url);
                        const htmlStr = typeof html === 'string' ? html : JSON.stringify(html);
                        const hdMatch = htmlStr.match(/href="(https?:\/\/[^"]*?)"[^>]*>.*?HD/i)
                            || htmlStr.match(/id="hdlink"[^>]*href="([^"]+)"/i)
                            || htmlStr.match(/"hd_src":"([^"]+)"/i)
                            || htmlStr.match(/HD Quality.*?href="(https?:\/\/[^"]+)"/is);
                        const sdMatch = htmlStr.match(/href="(https?:\/\/[^"]*?)"[^>]*>.*?(?:SD|Normal)/i)
                            || htmlStr.match(/id="sdlink"[^>]*href="([^"]+)"/i)
                            || htmlStr.match(/"sd_src":"([^"]+)"/i)
                            || htmlStr.match(/SD Quality.*?href="(https?:\/\/[^"]+)"/is);
                        const hdUrl = hdMatch ? hdMatch[1].replace(/&amp;/g, '&') : null;
                        const sdUrl = sdMatch ? sdMatch[1].replace(/&amp;/g, '&') : null;
                        if (hdUrl || sdUrl) {
                            console.log(`--- Facebook video found via ${api.name} ---`);
                            const quality = [];
                            if (hdUrl)
                                quality.push({ label: 'Chất lượng cao (HD)', url: hdUrl, type: 'video' });
                            if (sdUrl)
                                quality.push({ label: 'Chất lượng thường (SD)', url: sdUrl, type: 'video' });
                            return {
                                title: `Video Facebook`,
                                thumbnail: 'https://placehold.co/600x400/1877F2/FFFFFF/png?text=Facebook+Video',
                                source: 'www.facebook.com',
                                platform: platform,
                                quality: quality
                            };
                        }
                    }
                    catch (fbErr) {
                        console.warn(`Facebook API ${api.name} failed:`, fbErr.message);
                    }
                }
                console.warn('All Facebook-specific APIs failed or returned no direct links, falling back to RapidAPI...');
            }
            catch (err) {
                console.warn('Facebook specific API logic failed:', err.message);
            }
        }
        try {
            console.log(`--- Fetching via RapidAPI Social Download All In One: ${url} ---`);
            if (this.currentRapidApiKey) {
                try {
                    const rapidApiResponse = await axios_1.default.post('https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink', { url: url }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-rapidapi-key': this.currentRapidApiKey,
                            'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com'
                        },
                        timeout: 25000
                    });
                    const data = rapidApiResponse.data;
                    console.log('RapidAPI response status:', data?.status);
                    if (data) {
                        let quality = [];
                        if (data.medias && Array.isArray(data.medias)) {
                            data.medias.forEach((media, idx) => {
                                if (media.url) {
                                    quality.push({
                                        label: media.quality
                                            ? `${media.quality}${media.extension ? ' (' + media.extension + ')' : ''}`
                                            : `Tải #${idx + 1}`,
                                        url: media.url,
                                        type: media.type === 'audio' ? 'audio' : 'video'
                                    });
                                }
                            });
                        }
                        if (quality.length === 0 && data.url) {
                            quality.push({
                                label: 'Tải Video (Chất lượng gốc)',
                                url: data.url,
                                type: 'video'
                            });
                        }
                        if (quality.length === 0 && data.links && Array.isArray(data.links)) {
                            data.links.forEach((link, idx) => {
                                const linkUrl = link.link || link.url;
                                if (linkUrl) {
                                    quality.push({
                                        label: link.quality || `Tải #${idx + 1}`,
                                        url: linkUrl,
                                        type: link.type === 'audio' ? 'audio' : 'video'
                                    });
                                }
                            });
                        }
                        if (quality.length > 0) {
                            if (platform === 'Douyin') {
                                quality = quality.filter(q => !q.label.toLowerCase().includes('hd no watermark') &&
                                    !q.label.toLowerCase().includes('hd no water mark'));
                            }
                            console.log(`--- RapidAPI success! Found ${quality.length} download links ---`);
                            return {
                                title: data.title || `Video ${platform}`,
                                thumbnail: data.thumbnail || data.picture || data.cover || 'https://placehold.co/600x400/000000/FFFFFF/png?text=Market+OS+Video',
                                source: new URL(url).hostname,
                                platform: platform,
                                quality: quality
                            };
                        }
                    }
                    console.warn('RapidAPI returned no valid links, trying fallback...');
                }
                catch (rapidErr) {
                    console.warn('RapidAPI Social Download failed:', rapidErr.response?.data || rapidErr.message);
                }
            }
            else {
                console.warn('No RapidAPI key configured, skipping RapidAPI tier...');
            }
            const freeApis = [
                {
                    name: 'SaveFrom',
                    request: async () => {
                        return await axios_1.default.get(`https://api.savefrom.biz/api/convert`, {
                            params: { url: url },
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            },
                            timeout: 15000,
                        });
                    }
                }
            ];
            for (const api of freeApis) {
                try {
                    console.log(`Trying free API: ${api.name}`);
                    const res = await api.request();
                    const htmlOrData = res.data;
                    const htmlStr = typeof htmlOrData === 'string' ? htmlOrData : JSON.stringify(htmlOrData);
                    const videoLinks = [];
                    const linkRegex = /href="(https?:\/\/[^"]*(?:\.mp4|\.webm|video)[^"]*?)"/gi;
                    let match;
                    while ((match = linkRegex.exec(htmlStr)) !== null && videoLinks.length < 5) {
                        videoLinks.push(match[1].replace(/&amp;/g, '&'));
                    }
                    if (videoLinks.length === 0 && typeof htmlOrData === 'object') {
                        const findUrls = (obj) => {
                            const urls = [];
                            if (!obj || typeof obj !== 'object')
                                return urls;
                            for (const key of Object.keys(obj)) {
                                if ((key === 'url' || key === 'download_url' || key === 'link') && typeof obj[key] === 'string' && obj[key].startsWith('http')) {
                                    urls.push(obj[key]);
                                }
                                else if (typeof obj[key] === 'object') {
                                    urls.push(...findUrls(obj[key]));
                                }
                            }
                            return urls;
                        };
                        videoLinks.push(...findUrls(htmlOrData));
                    }
                    if (videoLinks.length > 0) {
                        console.log(`--- ${api.name} success! Found ${videoLinks.length} links ---`);
                        return {
                            title: `Video ${platform}`,
                            thumbnail: 'https://placehold.co/600x400/000000/FFFFFF/png?text=Market+OS+Video',
                            source: new URL(url).hostname,
                            platform: platform,
                            quality: videoLinks.map((link, idx) => ({
                                label: `Tải Video #${idx + 1}`,
                                url: link,
                                type: 'video'
                            }))
                        };
                    }
                }
                catch (freeErr) {
                    console.warn(`Free API ${api.name} failed:`, freeErr.message);
                }
            }
            try {
                console.log(`--- Falling back to Cobalt: ${url} ---`);
                const cobaltMirrors = [
                    'https://api.cobalt.tools/api/json',
                    'https://cobalt.tools/api/json'
                ];
                for (const mirror of cobaltMirrors) {
                    try {
                        const cobaltRes = await axios_1.default.post(mirror, {
                            url: url,
                            videoQuality: '1080',
                        }, {
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'User-Agent': 'Mozilla/5.0'
                            },
                            timeout: 15000
                        });
                        if (cobaltRes.data && cobaltRes.data.url) {
                            console.log(`--- Cobalt success via ${mirror} ---`);
                            return {
                                title: `Video ${platform}`,
                                thumbnail: 'https://placehold.co/600x400/000000/FFFFFF/png?text=Market+OS+Video',
                                source: new URL(url).hostname,
                                platform: platform,
                                quality: [{
                                        label: 'Chất lượng cao nhất',
                                        url: cobaltRes.data.url,
                                        type: 'video'
                                    }]
                            };
                        }
                    }
                    catch (mErr) {
                        console.warn(`Mirror ${mirror} failed:`, mErr.message);
                    }
                }
            }
            catch (cobaltErr) {
                console.warn('All Cobalt attempts failed:', cobaltErr.message);
            }
            throw new common_1.BadRequestException(`Không thể tải video từ ${platform}. Nền tảng này có thể đang hạn chế truy cập hoặc link không hợp lệ.`);
        }
        catch (error) {
            console.error('Final Download Error:', error.response?.data || error.message);
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException(`Không thể tải video từ ${platform}. Vui lòng kiểm tra lại link hoặc thử sau.`);
        }
    }
    detectPlatform(url) {
        try {
            const urlStr = url.toLowerCase();
            if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be'))
                return 'Youtube';
            if (urlStr.includes('facebook.com/reels') || urlStr.includes('facebook.com/reel'))
                return 'Facebook Reels';
            if (urlStr.includes('facebook.com') || urlStr.includes('fb.watch'))
                return 'Facebook';
            if (urlStr.includes('instagram.com'))
                return 'Instagram';
            if (urlStr.includes('tiktok.com'))
                return 'TikTok';
            if (urlStr.includes('douyin.com'))
                return 'Douyin';
            if (urlStr.includes('twitter.com') || urlStr.includes('x.com'))
                return 'Twitter/X';
            return 'Website';
        }
        catch {
            return 'Unknown';
        }
    }
    async downloadTikTokVideo(url, userId) {
        await this.deductCredits(userId, this.CREDIT_COSTS.VIDEO_DOWNLOAD, 'Tải video TikTok');
        try {
            let cleanUrl = url.trim();
            if (cleanUrl.includes('douyin.com')) {
                const match = cleanUrl.match(/\/video\/(\d+)/);
                if (match && match[1]) {
                    cleanUrl = `https://www.iesdouyin.com/share/video/${match[1]}/`;
                }
            }
            else {
                cleanUrl = cleanUrl.split('?')[0];
            }
            console.log(`--- Fetching via TikWM: ${cleanUrl} ---`);
            const params = new URLSearchParams();
            params.append('url', cleanUrl);
            params.append('hd', '1');
            const response = await axios_1.default.post('https://www.tikwm.com/api/', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                },
                timeout: 20000
            });
            if (response.data && response.data.code === 0) {
                const data = response.data.data;
                return {
                    id: data.id,
                    title: data.title,
                    cover: data.cover,
                    origin_cover: data.origin_cover,
                    play: data.play,
                    wmplay: data.wmplay,
                    hdplay: data.hdplay,
                    music: data.music,
                    music_info: data.music_info,
                    author: data.author,
                    stats: {
                        play_count: data.play_count,
                        digg_count: data.digg_count,
                        comment_count: data.comment_count,
                        share_count: data.share_count,
                        download_count: data.download_count
                    }
                };
            }
            else {
                console.error('TikWM Error:', response.data);
                throw new common_1.BadRequestException(response.data?.msg || 'Không thể lấy dữ liệu TikTok/Douyin. Vui lòng kiểm tra lại đường dẫn video.');
            }
        }
        catch (error) {
            console.error('Lỗi khi fetch TikTok:', error.message);
            throw new common_1.BadRequestException('Không thể kết nối đến máy chủ tải video (TikWM). Vui lòng thử lại sau.');
        }
    }
    async callTikWM(url, params, retryCount = 0, bypassCache = false) {
        try {
            const cacheKey = `${url}_${JSON.stringify(params)}`;
            const cached = this.cache.get(cacheKey);
            if (!bypassCache && cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
                return cached.data;
            }
            const response = await axios_1.default.get(url, { params, headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (response.data?.code === -1 && response.data?.msg?.includes('Limit hit')) {
                if (retryCount < 3) {
                    const delay = (retryCount + 2) * 3000;
                    console.log(`TikWM Limit hit, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.callTikWM(url, params, retryCount + 1);
                }
                throw new Error('Hệ thống TikWM quá tải (Limit). Vui lòng đợi vài giây và thử lại.');
            }
            if (response.data) {
                this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
            }
            return response.data;
        }
        catch (error) {
            console.error('TikWM API Error:', error.message);
            if (retryCount < 3 && !error.message?.includes('Limit')) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.callTikWM(url, params, retryCount + 1);
            }
            return null;
        }
    }
    async analyzeTikTokChannel(uniqueId, userId) {
        await this.deductCredits(userId, this.CREDIT_COSTS.TIKTOK_ANALYTICS, 'Phân tích kênh TikTok');
        const delay = (ms) => new Promise(res => setTimeout(res, ms));
        try {
            console.log(`--- Analyzing TikTok Channel: ${uniqueId} ---`);
            if (this.currentRapidApiKey) {
                console.log('--- Using TikTok-API23 (RapidAPI) for stability ---');
                try {
                    const response = await axios_1.default.get('https://tiktok-api23.p.rapidapi.com/api/user/info', {
                        params: { username: uniqueId.replace(/^@/, '') },
                        headers: {
                            'X-RapidAPI-Key': this.currentRapidApiKey,
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
                            aiAnalysis: aiReport
                        };
                    }
                }
                catch (rapidErr) {
                    console.error('RapidAPI Error:', rapidErr.message);
                }
            }
            let cleanId = uniqueId.trim();
            if (cleanId.includes('tiktok.com')) {
                const match = cleanId.match(/@([^/?#]+)/);
                cleanId = match ? match[1] : (cleanId.split('/').pop() || '').replace('@', '');
            }
            cleanId = cleanId.replace(/^@/, '');
            const response = await this.callTikWM('https://www.tikwm.com/api/user/info', {
                unique_id: cleanId
            });
            if (response && response.code === 0 && response.data) {
                const data = response.data;
                await new Promise(resolve => setTimeout(resolve, 3100));
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
            const msg = this.currentRapidApiKey
                ? 'Lỗi kết nối API trả phí. Vui lòng kiểm tra lại hạn mức.'
                : (error.message || 'Hệ thống đang bận. Vui lòng cung cấp RapidAPI Key để hoạt động ổn định.');
            throw new Error(msg);
        }
    }
    async generateTikTokAIAnalysis(user, stats, videos, retryCount = 0) {
        if (!this.model)
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
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : text;
            return JSON.parse(jsonStr);
        }
        catch (error) {
            console.error(`Lỗi AI Analysis (Lần ${retryCount + 1}):`, error.message);
            if ((error.message?.includes('503') || error.message?.includes('429')) && retryCount < 2) {
                const waitTime = (retryCount + 1) * 3000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
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
            whyViral: "Nội dung kênh tập trung vào các chủ đề phổ biến, cách trình bày gần gũi và có sự đầu tư về hình ảnh.",
            suggestions: ["Cần đăng bài đều đặn hơn", "Tương tác với người xem trong comment"]
        };
    }
    async getTikTokUserVideos(uniqueId, userIdOrSecUid) {
        const cleanId = uniqueId.replace(/^@/, '');
        if (this.currentRapidApiKey) {
            try {
                const response = await axios_1.default.get('https://tiktok-api23.p.rapidapi.com/api/user/posts', {
                    params: {
                        user_id: userIdOrSecUid,
                        count: 10,
                        cursor: 0
                    },
                    headers: {
                        'X-RapidAPI-Key': this.currentRapidApiKey,
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
        if (!this.model)
            return null;
        await this.deductCredits(userId, this.CREDIT_COSTS.TIKTOK_SCRIPT, 'Tạo kịch bản TikTok');
        const prompt = `Bạn là một chuyên gia sáng tạo nội dung (Content Creator) với 10 triệu followers trên TikTok.
        Dựa trên kênh TikTok @${uniqueId} thuộc lĩnh vực: ${niche}.
        Hãy tạo 1 kịch bản video ngắn (dưới 60s) có tiềm năng VIRAL cao.
        
        Yêu cầu kịch bản gồm:
        1. Hook (3s đầu): Phải cực kỳ gây tò mò.
        2. Content Body: Nội dung cô đọng, giàu giá trị hoặc cảm xúc.
        3. Call to Action: Thúc đẩy follow/comment.
        4. Gợi ý Caption & Hashtags.

        Hãy trả về JSON:
        {
          "title": "Tiêu đề video",
          "hook": "Câu mở đầu",
          "script": "Nội dung chi tiết từng phân cảnh",
          "cta": "Lời kêu gọi",
          "caption": "Caption gợi ý",
          "hashtags": ["tag1", "tag2"]
        }`;
        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return JSON.parse(jsonMatch ? jsonMatch[0] : text);
        }
        catch (error) {
            console.error('Lỗi tạo kịch bản:', error);
            return null;
        }
    }
    async getTikTokTrending(region = 'VN', count = 50, refresh = false, category, userId) {
        try {
            if (userId) {
                await this.deductCredits(userId, this.CREDIT_COSTS.TIKTOK_TRENDING, 'Xu hướng TikTok');
            }
            const globalTrending = await this.callTikWM('https://www.tikwm.com/api/feed/list', {
                region: region,
                count: 50
            }, 0, refresh);
            let trendingVideos = [];
            if (globalTrending && globalTrending.code === 0 && globalTrending.data) {
                trendingVideos = Array.isArray(globalTrending.data) ? globalTrending.data : (globalTrending.data.videos || []);
            }
            let displayVideos = trendingVideos;
            if (category && category !== 'all') {
                const categoryResponse = await this.callTikWM('https://www.tikwm.com/api/feed/search', {
                    keywords: category,
                    region: region,
                    count: 50,
                    type: 1
                }, 0, refresh);
                if (categoryResponse && categoryResponse.code === 0 && categoryResponse.data) {
                    displayVideos = Array.isArray(categoryResponse.data) ? categoryResponse.data : (categoryResponse.data.videos || []);
                }
            }
            const soundMap = new Map();
            trendingVideos.forEach((v) => {
                if (v.music_info) {
                    const mid = v.music_info.id;
                    if (!soundMap.has(mid)) {
                        soundMap.set(mid, { ...v.music_info, count: 1 });
                    }
                    else {
                        soundMap.get(mid).count += 1;
                    }
                }
            });
            const trending_sounds = Array.from(soundMap.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
            let insights = null;
            if (this.model && displayVideos.length > 0) {
                const videoContext = displayVideos.slice(0, 15).map((v) => v.title).filter((t) => t).join('\n');
                const prompt = `Phân tích danh sách tiêu đề video xu hướng TikTok sau tại khu vực ${region}:
                ${videoContext}
                
                Dựa trên danh sách này, hãy thực hiện:
                1. Trích xuất 5-7 từ khóa (keywords) viral/thịnh hành nhất.
                2. Tóm tắt một câu về định hướng nội dung đang chiếm sóng (xu hướng xem hiện tại).
                3. Đưa ra 1 lời khuyên ngắn gọn cho nhà sáng tạo nội dung muốn "bắt trend".
                
                Hãy trả về kết quả dưới định dạng JSON thuần túy (không kèm markdown):
                {
                  "keywords": ["từ khóa 1", "từ khóa 2", ...],
                  "trend_summary": "Mô tả xu hướng hiện tại",
                  "advice": "Lời khuyên thực chiến"
                }`;
                try {
                    const result = await this.model.generateContent(prompt);
                    const text = result.response.text();
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    insights = JSON.parse(jsonMatch ? jsonMatch[0] : text);
                }
                catch (e) {
                    console.error('Lỗi AI phân tích trend:', e);
                }
            }
            return {
                videos: displayVideos,
                insights,
                trending_sounds
            };
        }
        catch (error) {
            console.error('Lỗi lấy trending TikTok:', error);
            return { videos: [], insights: null, trending_sounds: [] };
        }
    }
    async generateLandingPage(userPrompt) {
        if (!this.model) {
            throw new Error('Gemini API Key is not configured');
        }
        const isAllowed = await this.checkLimit('gemini');
        if (!isAllowed) {
            throw new Error('Hạn mức sử dụng Gemini đã hết. Vui lòng nâng cấp gói.');
        }
        await this.trackUsage('gemini');
        const systemPrompt = `
        BẠN LÀ MỘT DESIGNER LANDING PAGE CHUYÊN NGHIỆP TRÊN NỀN TẢNG PUCK EDITOR.
        Nhiệm vụ: Chuyển đổi yêu cầu của khách hàng thành cấu trúc JSON hoàn chỉnh để dựng trang web.

        QUY TẮC BẮT BUỘC:
        1. CẤU TRÚC TRANG (Content Flow): Một trang phải có đầy đủ các phần theo trình tự: 
           Navbar -> Hero -> Features -> Pricing -> FAQ -> CTA -> Footer.
        2. TỐI ĐA 1 FOOTER: Tuyệt đối không được phép có nhiều hơn 1 component "Footer".
        3. ĐA DẠNG HÓA: Không lặp lại bất kỳ component nào (ngoại trừ Spacer/Divider). Nếu muốn thêm nội dung, hãy dùng các loại Component khác nhau.
        4. TIẾNG VIỆT: Sử dụng ngôn ngữ tiếng Việt tự nhiên, chuyên nghiệp, hấp dẫn người đọc.

        DANH SÁCH COMPONENT HỢP LỆ (HÃY CHỌN LỌC ĐA DẠNG):
        - Navbar: { logoName, bgColor, textColor, links: [{label, url}] }
        - Hero: { title, subtitle, buttonText, imageUrl, bgColor, textColor, primaryColor, layout: "left"|"center"|"right" }
        - Features: { title, items: [{title, desc, icon}], bgColor, columns: 3 }
        - Pricing: { title, bgColor, plans: [{name, price, features: [{text}], popular: boolean}] }
        - Testimonials: { title, items: [{name, role, content, avatarUrl}], bgColor }
        - FAQ: { title, items: [{question, answer}], bgColor }
        - CTA: { title, subtitle, buttonText, bgColor, textColor }
        - Footer: { text, bgColor, textColor }
        - Stats: { items: [{label, value, suffix}], bgColor }
        - Navbar, Hero, Features, Pricing, Testimonials, FAQ, CTA, Footer, Stats, Partners, Gallery, Process, Video, Map, Form, Card.

        VÍ DỤ CẤU TRÚC JSON CHUẨN (BẠN PHẢI TRẢ VỀ DẠNG NÀY):
        {
          "content": [
            { "type": "Navbar", "props": { "logoName": "BrandName", "links": [{"label": "Tính năng", "url": "#"}] } },
            { "type": "Hero", "props": { "title": "Giải pháp cho bạn", "subtitle": "Mô tả chi tiết hơn về dịch vụ", "buttonText": "Khám phá ngay" } },
            { "type": "Features", "props": { "title": "Tại sao chọn chúng tôi?", "items": [{"title": "Tiết kiệm", "desc": "Giảm 50% chi phí", "icon": "Zap"}] } },
            { "type": "Pricing", "props": { "title": "Bảng giá dịch vụ", "plans": [{"name": "Cơ bản", "price": "99k", "features": [{"text": "Tính năng 1"}]}] } },
            { "type": "Footer", "props": { "text": "© 2024 Bản quyền thuộc về..." } }
          ],
          "root": { "props": { "title": "Tên trang web" } }
        }

        YÊU CẦU CỦA KHÁCH HÀNG: "${userPrompt}"

        HÃY TẠO MỘT TRANG ĐẦY ĐỦ CÁC KHỐI, KHÔNG ĐƯỢC CHỈ TẠO FOOTER. TRẢ VỀ DUY NHẤT JSON.
        `;
        try {
            const result = await this.model.generateContent(systemPrompt);
            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("AI không trả về định dạng JSON hợp lệ");
            }
            const puckData = JSON.parse(jsonMatch[0].trim());
            const UNIQUE_COMPONENTS = [
                'Navbar', 'Hero', 'Features', 'Pricing', 'Testimonials',
                'FAQ', 'CTA', 'Footer', 'Stats', 'Partners', 'Gallery',
                'Process'
            ];
            const seenTypes = new Set();
            if (puckData.content && Array.isArray(puckData.content)) {
                puckData.content = puckData.content.filter((item) => {
                    if (!item || !item.type)
                        return false;
                    if (UNIQUE_COMPONENTS.includes(item.type)) {
                        if (seenTypes.has(item.type)) {
                            console.log(`[AI Guard] Removed duplicate component: ${item.type}`);
                            return false;
                        }
                        seenTypes.add(item.type);
                    }
                    return true;
                });
                puckData.content = puckData.content.map((item, index) => ({
                    ...item,
                    id: `ai-${item.type?.toLowerCase()}-${index}-${Date.now()}`,
                    props: {
                        ...(item.props || {}),
                    }
                }));
                console.log(`[AI] Generated ${puckData.content.length} unique components`);
            }
            return puckData;
        }
        catch (error) {
            console.error("Generate Landing Page Error:", error.message);
            throw new Error('Lỗi khi AI tạo Landing Page: ' + error.message);
        }
    }
    async extractAudioWithFFmpeg(videoPath, audioPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .outputOptions([
                '-vn',
                '-ar 44100',
                '-ac 2',
                '-b:a 64k',
            ])
                .save(audioPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(new Error('Lỗi trích xuất âm thanh: ' + err.message)));
        });
    }
    async burnSubtitlesWithFFmpeg(videoPath, srtPath, outputPath, styleMode, fontSize, yPos) {
        return new Promise((resolve, reject) => {
            let styleArgs = '';
            const size = fontSize || (styleMode === 'tiktok' ? 26 : (styleMode === 'classic' ? 20 : 22));
            const marginV = Math.round((yPos || 80) * 0.1);
            const alignment = 8;
            const finalMarginV = Math.round((yPos || 80) * 10.8);
            if (styleMode === 'tiktok') {
                styleArgs = `force_style='FontSize=${size},PrimaryColour=&H0000FFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Bold=1,Alignment=8,MarginV=${finalMarginV}'`;
            }
            else if (styleMode === 'classic') {
                styleArgs = `force_style='FontSize=${size},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=1,BackColour=&H80000000,Alignment=8,MarginV=${finalMarginV}'`;
            }
            else if (styleMode === 'dynamic') {
                styleArgs = `force_style='FontSize=${size},PrimaryColour=&H0000FF00,OutlineColour=&H00000000,BorderStyle=1,Outline=3,Shadow=2,Bold=1,Italic=1,Alignment=8,MarginV=${finalMarginV}'`;
            }
            else {
                styleArgs = `force_style='FontSize=${size},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1,Shadow=0,Alignment=8,MarginV=${finalMarginV}'`;
            }
            const safeSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\\\:');
            ffmpeg(videoPath)
                .outputOptions([
                `-vf subtitles=${safeSrtPath}:${styleArgs}`,
                '-preset fast',
                '-crf 23',
                '-c:a copy'
            ])
                .save(outputPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(new Error('Lỗi ghi phụ đề vào video: ' + err.message)));
        });
    }
    async generateAutoSubtitles(file, srcLang, targetLang, style, fontSize, yPos, userId) {
        if (!this.currentGeminiKey) {
            throw new Error('Chưa cấu hình API Key Gemini');
        }
        if (userId) {
            await this.deductCredits(userId, this.CREDIT_COSTS.AUTO_SUB_PER_MIN, 'Phụ đề tự động');
        }
        const isAllowed = await this.checkLimit('gemini');
        if (!isAllowed) {
            throw new Error('Hạn mức sử dụng Gemini đã hết. Vui lòng nâng cấp gói.');
        }
        const tempDir = path.join(os.tmpdir(), 'crm_vibe_subs');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const fileId = (0, uuid_1.v4)();
        const videoPath = path.join(tempDir, `${fileId}.mp4`);
        const audioPath = path.join(tempDir, `${fileId}.mp3`);
        const srtPath = path.join(tempDir, `${fileId}.srt`);
        try {
            fs.writeFileSync(videoPath, file.buffer);
            await this.extractAudioWithFFmpeg(videoPath, audioPath);
            const fileManager = new server_1.GoogleAIFileManager(this.currentGeminiKey);
            const uploadResponse = await fileManager.uploadFile(audioPath, {
                mimeType: 'audio/mp3',
                displayName: `audio_${fileId}`,
            });
            const prompt = `
            Ngôn ngữ gốc của âm thanh là: ${srcLang}.
            Ngôn ngữ bạn cần dịch ra phụ đề là: ${targetLang}.
            
            Hãy nghe âm thanh đính kèm, chép lời (transcribe) và tạo ra phụ đề định dạng SRT TỪNG TỪ MỘT. 
            Mọi khung thời gian phải chính xác với audio. Cấu trúc chuẩn SRT phải tuyệt đối được tuân thủ:
            1
            00:00:00,000 --> 00:00:02,100
            Nội dung câu nói...
            
            2
            00:00:02,200 --> 00:00:05,300
            Nội dung câu nói tiếp theo...
            
            CHỈ In ra nội dung SRT duy nhất. Không bao gồm văn bản giải thích. KHÔNG sử dụng \`\`\`srt formatting mardkown.
            `;
            const result = await this.model.generateContent([
                {
                    fileData: {
                        mimeType: uploadResponse.file.mimeType,
                        fileUri: uploadResponse.file.uri
                    }
                },
                { text: prompt }
            ]);
            let srtContent = result.response.text();
            srtContent = srtContent.replace(/\`\`\`srt|\`\`\`/g, '').trim();
            try {
                await fileManager.deleteFile(uploadResponse.file.name);
            }
            catch (e) {
                console.warn("Failed to delete File API file:", e.message);
            }
            fs.writeFileSync(srtPath, srtContent, 'utf8');
            await this.trackUsage('gemini');
            const configPath = path.join(tempDir, `${fileId}_config.json`);
            fs.writeFileSync(configPath, JSON.stringify({ style, fontSize, yPos }), 'utf8');
            return {
                success: true,
                srtContent: srtContent,
                videoId: fileId
            };
        }
        catch (error) {
            console.error('AutoSub Error:', error);
            if (fs.existsSync(videoPath))
                fs.unlinkSync(videoPath);
            if (fs.existsSync(audioPath))
                fs.unlinkSync(audioPath);
            if (fs.existsSync(srtPath))
                fs.unlinkSync(srtPath);
            throw new common_1.InternalServerErrorException('Lỗi trong quá trình tạo phụ đề: ' + error.message);
        }
    }
    async downloadBurnedVideo(fileId) {
        const tempDir = path.join(os.tmpdir(), 'crm_vibe_subs');
        const videoPath = path.join(tempDir, `${fileId}.mp4`);
        const srtPath = path.join(tempDir, `${fileId}.srt`);
        const configPath = path.join(tempDir, `${fileId}_config.json`);
        const outputPath = path.join(tempDir, `${fileId}_burned.mp4`);
        if (fs.existsSync(outputPath)) {
            const stat = fs.statSync(outputPath);
            const stream = fs.createReadStream(outputPath);
            return { stream, size: stat.size };
        }
        if (!fs.existsSync(videoPath) || !fs.existsSync(srtPath)) {
            throw new Error('Video id không hợp lệ hoặc đã hết hạn.');
        }
        let style = 'tiktok';
        let fontSizeVal = undefined;
        let yPosVal = 80;
        if (fs.existsSync(configPath)) {
            const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            style = cfg.style || 'tiktok';
            fontSizeVal = cfg.fontSize;
            yPosVal = cfg.yPos || 80;
        }
        console.log(`Bắt đầu burn phụ đề cứng vào file: ${fileId} với style ${style}, cỡ chữ ${fontSizeVal}, vị trí ${yPosVal}`);
        await this.burnSubtitlesWithFFmpeg(videoPath, srtPath, outputPath, style, fontSizeVal, yPosVal);
        const stat = fs.statSync(outputPath);
        const stream = fs.createReadStream(outputPath);
        return { stream, size: stat.size };
    }
    async streamBurnedVideo(fileId, req, res) {
        const tempDir = path.join(os.tmpdir(), 'crm_vibe_subs');
        const videoPath = path.join(tempDir, `${fileId}.mp4`);
        const srtPath = path.join(tempDir, `${fileId}.srt`);
        const configPath = path.join(tempDir, `${fileId}_config.json`);
        const outputPath = path.join(tempDir, `${fileId}_burned.mp4`);
        if (!fs.existsSync(outputPath)) {
            if (!fs.existsSync(videoPath) || !fs.existsSync(srtPath)) {
                throw new Error('Video id không hợp lệ hoặc đã hết hạn.');
            }
            let style = 'tiktok';
            let fontSizeVal = undefined;
            let yPosVal = 80;
            if (fs.existsSync(configPath)) {
                const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                style = cfg.style || 'tiktok';
                fontSizeVal = cfg.fontSize;
                yPosVal = cfg.yPos || 80;
            }
            console.log(`Bắt đầu burn phụ đề cứng vào file: ${fileId} với style ${style}, cỡ chữ ${fontSizeVal}, vị trí ${yPosVal}`);
            await this.burnSubtitlesWithFFmpeg(videoPath, srtPath, outputPath, style, fontSizeVal, yPosVal);
        }
        const stat = fs.statSync(outputPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(outputPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
            return { stream: file, size: chunksize, path: outputPath };
        }
        else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            const file = fs.createReadStream(outputPath);
            file.pipe(res);
            return { stream: file, size: fileSize, path: outputPath };
        }
    }
    async updateSrtContent(fileId, srtContent, style, fontSize, yPos) {
        const tempDir = path.join(os.tmpdir(), 'crm_vibe_subs');
        const srtPath = path.join(tempDir, `${fileId}.srt`);
        const configPath = path.join(tempDir, `${fileId}_config.json`);
        const outputPath = path.join(tempDir, `${fileId}_burned.mp4`);
        if (!fs.existsSync(srtPath)) {
            throw new Error('Không tìm thấy file phụ đề gốc để cập nhật.');
        }
        fs.writeFileSync(srtPath, srtContent, 'utf8');
        if (style || fontSize || yPos) {
            let currentConfig = {};
            if (fs.existsSync(configPath)) {
                try {
                    currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                }
                catch (e) { }
            }
            const newConfig = { ...currentConfig, style, fontSize, yPos };
            fs.writeFileSync(configPath, JSON.stringify(newConfig), 'utf8');
        }
        if (fs.existsSync(outputPath)) {
            try {
                fs.unlinkSync(outputPath);
            }
            catch (e) { }
        }
        return { success: true };
    }
    async onModuleInit() {
        console.log('--- [SCHEDULER] Khởi tạo hệ thống lập lịch tự động hóa AI ---');
        setInterval(() => {
            this.checkScheduledAutomations();
        }, 60 * 1000);
    }
    async checkScheduledAutomations() {
        try {
            const db = this.firebaseAdmin.firestore();
            const now = new Date();
            const currentTime = now.toLocaleTimeString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            const currentDate = now.toLocaleDateString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh'
            });
            const snapshot = await db.collection('automations')
                .where('status', '==', 'Active')
                .get();
            for (const doc of snapshot.docs) {
                const wf = { id: doc.id, ...doc.data() };
                if (wf.executionTime === currentTime) {
                    if (wf.lastRunDate !== currentDate) {
                        console.log(`--- [SCHEDULER] ĐẾN GIỜ! Đang tự động chạy quy trình: ${wf.name} (${wf.id}) ---`);
                        await this.runAutomationById(wf.id, wf.userId);
                        await doc.ref.update({
                            lastRunDate: currentDate
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Lỗi trong hệ thống lập lịch:', error);
        }
    }
    async runAutomationById(id, userId) {
        const db = this.firebaseAdmin.firestore();
        const wfRef = db.collection('automations').doc(id);
        const wfDoc = await wfRef.get();
        if (!wfDoc.exists)
            return;
        const wf = wfDoc.data();
        const addBotLog = async (event, status = 'success') => {
            await wfRef.collection('logs').add({
                event,
                status,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await wfRef.update({
                lastEvent: event,
                lastEventStatus: status
            });
        };
        try {
            await wfRef.update({ runningStatus: 'running' });
            await addBotLog(`Bot: Khởi tạo quy trình ${wf.name} tự động...`);
            const quantity = parseInt(wf.quantity) || 1;
            const contentSubType = wf.contentSubType || 'sales';
            const topics = contentSubType === 'topics' && wf.topicList ? wf.topicList.split('\n').filter((t) => t.trim() !== '') : [];
            const totalTasks = contentSubType === 'topics' ? (topics.length * quantity) : quantity;
            await addBotLog(`Bot: Bắt đầu quy trình tạo tổng cộng ${totalTasks} kịch bản...`);
            let overallIndex = 0;
            if (contentSubType === 'topics') {
                for (let t = 0; t < topics.length; t++) {
                    const currentTopic = topics[t];
                    for (let q = 0; q < quantity; q++) {
                        overallIndex++;
                        await this.processSingleContentTask(wf, wfRef, currentTopic, overallIndex, totalTasks, userId, contentSubType);
                    }
                }
            }
            else {
                for (let i = 0; i < quantity; i++) {
                    overallIndex++;
                    const currentTopic = wf.description || wf.features;
                    await this.processSingleContentTask(wf, wfRef, currentTopic, overallIndex, totalTasks, userId, contentSubType);
                }
            }
            await addBotLog("Bot: Hoàn tất tạo toàn bộ kịch bản!");
            await wfRef.update({
                runs: admin.firestore.FieldValue.increment(1),
                lastRun: new Date().toLocaleTimeString('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            });
            await addBotLog("Bot: Quy trình hoàn thành thành công!");
        }
        catch (error) {
            console.error('Lỗi chạy quy trình tự động:', error);
            await addBotLog(`Bot Lỗi: ${error.message}`, 'error');
            await wfRef.update({ runningStatus: 'error' });
        }
        finally {
            await wfRef.update({ runningStatus: 'idle' });
        }
    }
    async processSingleContentTask(wf, wfRef, topic, currentIndex, total, userId, subType) {
        const stepTitle = subType === 'topics'
            ? `Bot: Đang tạo bản #${currentIndex}/${total} cho chủ đề: "${topic.substring(0, 30)}..."`
            : `Bot: Đang xử lý kịch bản ${currentIndex}/${total}...`;
        const connectionLogRef = await wfRef.collection('logs').add({
            event: stepTitle,
            status: "loading",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const db = this.firebaseAdmin.firestore();
        try {
            let resultData = null;
            if (wf.type === 'script' || wf.type === 'content_creation') {
                const response = await this.generateContent({
                    brand: wf.name,
                    features: topic,
                    platform: wf.targetPlatform || wf.platform || 'General',
                    field: subType === 'topics' ? (wf.category || 'Chung') : (wf.field || 'General'),
                    length: (wf.targetPlatform === 'Facebook' || wf.targetPlatform === 'Zalo') ? 'long' : 'short',
                    price: wf.price || 'Liên hệ',
                    offers: wf.offers || 'Ưu đãi',
                    category: wf.category || 'Chung',
                    mode: (wf.type === 'content_creation' && subType === 'topics') ? 'educational' : (wf.type === 'content_creation' ? 'general' : 'affiliate_viral'),
                    tone: wf.tone || 'Chuyên nghiệp',
                    videoType: wf.videoType
                }, userId);
                let imageUrl = null;
                if (wf.type === 'content_creation') {
                    await wfRef.collection('logs').add({
                        event: `Bot: Đang thiết kế ảnh AI minh họa cho bản #${currentIndex}...`,
                        status: "loading"
                    });
                    try {
                        const imageResult = await this.generateImageMockup(`A professional high-quality marketing image for ${wf.name}. Context: ${topic}. Content: ${response.content.substring(0, 150)}`, undefined, undefined, '1:1', userId);
                        imageUrl = imageResult.url;
                    }
                    catch (imgErr) {
                        console.error("Lỗi tạo ảnh AI:", imgErr);
                    }
                }
                resultData = {
                    content: response.content,
                    imageUrl: imageUrl,
                    topic: subType === 'topics' ? topic : null,
                    type: 'text_with_image'
                };
                if (userId) {
                    await db.collection('ai_viral_scripts').add({
                        userId,
                        brand: wf.name,
                        platform: wf.platform || 'general',
                        framework: 'automation_backend',
                        content: response.content,
                        imageUrl: imageUrl,
                        topic: subType === 'topics' ? topic : null,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
            else if (wf.type === 'analytics') {
                await connectionLogRef.update({ event: `Bot: Đang thu thập dữ liệu xu hướng cho ngành ${wf.field}...` });
                const trendingData = await this.getTikTokTrending('VN', 15, false, wf.field, userId);
                const trendingKeywords = await this.getTrendingKeywords(wf.field, userId);
                await connectionLogRef.update({ event: `Bot: Đang phân tích chiến thuật của đối thủ trong ngành...` });
                const analysisPrompt = `
                Bạn là một chuyên gia Marketing thực chiến. Hãy phân tích dữ liệu sau cho ngành hàng "${wf.field}":
                
                DỮ LIỆU XU HƯỚNG TIKTOK HIỆN TẠI:
                ${JSON.stringify(trendingData.insights || {})}
                
                VIDEO ĐANG HOT (Mô tả):
                ${trendingData.videos?.slice(0, 5).map((v) => `- ${v.title} (${v.digg_count} likes)`).join('\n')}
                
                TỪ KHÓA ĐANG LÊN:
                ${trendingKeywords.slice(0, 5).map(k => `- ${k.keyword} (Tiềm năng: ${k.potential_score})`).join('\n')}

                NHIỆM VỤ: Hãy tạo một báo cáo tóm tắt "Đối thủ & Xu hướng" cực kỳ súc tích.
                YÊU CẦU TRẢ VỀ JSON:
                {
                    "summary": "Tóm tắt 1 câu về thị trường hiện tại",
                    "trends": [
                        {"name": "Tên xu hướng", "reason": "Tại sao đang hot", "score": 9.5}
                    ],
                    "competitors_strategy": [
                        {"tactic": "Chiến thuật đối thủ đang dùng", "effectiveness": "Cao/Trung bình", "detail": "Mô tả chi tiết"}
                    ],
                    "recommended_action": "Hành động cụ thể bạn nên làm ngay hôm nay"
                }
                CHỈ TRẢ VỀ JSON. KHÔNG GIẢI THÍCH THÊM.
                `;
                const aiResult = await this.model.generateContent(analysisPrompt);
                const aiText = aiResult.response.text();
                const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                let report = {
                    summary: "AI không thể trích xuất JSON báo cáo.",
                    trends: [],
                    competitors_strategy: [],
                    recommended_action: "Kiểm tra lại dữ liệu đầu vào."
                };
                try {
                    report = JSON.parse(jsonMatch ? jsonMatch[0] : aiText);
                }
                catch (e) {
                    console.error("Lỗi parse JSON report:", e);
                }
                resultData = {
                    content: `Báo cáo phân tích tự động cho ${wf.field} (Bản #${currentIndex})\n\n${report.summary}`,
                    report: report,
                    type: 'analytics_report',
                    trendingVideos: trendingData.videos?.slice(0, 5) || []
                };
            }
            else if (wf.type === 'scraping') {
                await connectionLogRef.update({ event: `Bot: Đang truy cập dữ liệu thị trường và quét sản phẩm trending ngành ${wf.field}...` });
                const trendingData = await this.getTikTokTrending('VN', 20, false, wf.field, userId);
                const keywords = await this.getTrendingKeywords(wf.field, userId);
                await connectionLogRef.update({ event: `Bot: Đang bóc tách và nhận diện Winning Products tiềm năng dựa trên AI Logic...` });
                const scrapePrompt = `
                BẠN LÀ MỘT CHUYÊN GIA TƯ VẤN CHIẾN LƯỢC E-COMMERCE VÀ NHÀ PHÂN TÍCH DỮ LIỆU THỊ TRƯỜNG CẤP CAO.
                NHIỆM VỤ: Dựa trên nguồn dữ liệu đa chiều dưới đây về ngành hàng "${wf.field}", hãy thực hiện quy trình "REVERSE ENGINEERING" để nhận diện và phân tích các "WINNING PRODUCTS" (Sản phẩm thắng thắng thế).

                MỤC TIÊU PHÂN TÍCH CHI TIẾT: ${wf.actionTarget || 'Nhận diện sản phẩm tiềm năng bùng nổ'}
                CẤP ĐỘ PHÂN TÍCH: ${wf.aiMode === 'creative' ? 'Tư duy bứt phá (Blue Ocean Store)' : wf.aiMode === 'precise' ? 'Dữ liệu thực chứng (Hard Data)' : 'Cân bằng giữa xu hướng & tính khả thi'}

                DỮ LIỆU ĐẦU VÀO TỪ HỆ THỐNG:
                1. INSIGHTS XU HƯỚNG TIKTOK TRONG 7 NGÀY:
                ${JSON.stringify(trendingData.insights || {})}

                2. CHỈ SỐ TỪ KHÓA ĐANG TĂNG TRƯỞNG:
                ${keywords.map(k => `- ${k.keyword} (Độ nóng: ${k.trend})`).join('\n')}

                3. PHÂN TÍCH VIDEO VIRAL (HÀNH VI NGƯỜI DÙNG):
                ${trendingData.videos?.slice(0, 10).map((v) => `- ${v.title} (Lượt tương tác: ${v.digg_count} tim, ${v.comment_count} bình luận)`).join('\n')}

                YÊU CẦU BẢN BÁO CÁO (TRẢ VỀ ĐỊNH DẠNG JSON):
                {
                    "overall_market_sentiment": "Phân tích bối cảnh thị trường ngách, tâm lý khách hàng và dự báo độ dài của sóng trend hiện tại.",
                    "winning_products": [
                        {
                            "name": "Tên sản phẩm chuyên nghiệp kèm từ khóa SEO",
                            "category": "Ngách sản phẩm cụ thể",
                            "win_reason": "Vận dụng mô hình 4P/USP để giải thích tại sao sản phẩm này đang 'Win' (VD: Giá hời, giải quyết nỗi đau mới, bắt kịp trend thẩm mỹ...)",
                            "target_audience": "Chân dung khách hàng mục tiêu chi tiết (Độ tuổi, sở thích, hành vi)",
                            "estimated_price": "Khoảng giá tối ưu để đạt tỷ lệ chuyển đổi cao nhất",
                            "potential_score": "Điểm tiềm năng (Scoring 1-10)",
                            "marketing_strategy": "Chiến lược 'Go-to-market': Cách làm video, Hook tiêu đề, và Angle quảng cáo đề xuất",
                            "pros_cons": {"pros": ["..."], "cons": ["..."]}
                        }
                    ],
                    "niche_opportunities": "Những khoảng trống thị trường (Greenfield) mà đối thủ chưa khai thác hết dựa trên dữ liệu keyword.",
                    "action_plan": "Lộ trình thực thi 3 bước: Kiểm tra nguồn hàng -> Test Content -> Scale Ads"
                }
                LƯU Ý: Nội dung phải mang tính chiến lược, ngôn ngữ chuyên ngành marketing, không viết chung chung.
                CHỈ TRẢ VỀ JSON. KHÔNG GIẢI THÍCH THÊM.
                `;
                const aiResult = await this.model.generateContent(scrapePrompt);
                const responseText = aiResult.response.text();
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                let report = {
                    overall_market_sentiment: "Dữ liệu chưa đủ để phân tích.",
                    winning_products: [],
                    niche_opportunities: "Không tìm thấy cơ hội ngách rõ ràng.",
                    action_plan: "Kiểm tra lại nguồn cấp dữ liệu."
                };
                try {
                    report = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
                }
                catch (e) {
                    console.error("Lỗi parse JSON scraping report:", e);
                }
                resultData = {
                    content: `Báo cáo săn sản phẩm Win: ${wf.field} (Bản #${currentIndex})\n\n${report.overall_market_sentiment}`,
                    report: report,
                    type: 'winning_products_report',
                    trendingVideos: trendingData.videos?.slice(0, 3) || []
                };
            }
            else if (wf.type === 'market_research') {
                await connectionLogRef.update({ event: `Bot: Đang thu thập dữ liệu thị trường toàn cầu cho ngách ${wf.field}...` });
                const trendingData = await this.getTikTokTrending('VN', 30, false, wf.field, userId);
                const keywords = await this.getTrendingKeywords(wf.field, userId);
                await connectionLogRef.update({ event: `Bot: AI đang thiết lập bản đồ xu hướng và phân tích tiềm năng ngách...` });
                const researchPrompt = `
                BẠN LÀ MỘT CHUYÊN GIA PHÂN TÍCH THỊ TRƯỜNG VÀ CHIẾN LƯỢC GIA KINH DOANH QUỐC TẾ.
                NHIỆM VỤ: Thực hiện một cuộc nghiên cứu sâu rộng về ngách "${wf.field}" dựa trên dữ liệu thời gian thực tại thị trường Việt Nam.

                DỮ LIỆU ĐẦU VÀO:
                - Insights TikTok: ${JSON.stringify(trendingData.insights || {})}
                - Dữ liệu video viral mới nhất: ${trendingData.videos?.slice(0, 10).map((v) => `- ${v.title} (Engagement: ${v.digg_count} likes, ${v.play_count} views)`).join('\n')}
                - Keywords hot: ${keywords.map(k => k.keyword).join(', ')}

                YÊU CẦU BÁO CÁO CHI TIẾT (TRẢ VỀ JSON):
                {
                    "niche_name": "Tên ngách chính xác",
                    "market_size_evaluation": "Đánh giá quy mô và sức mua của thị trường ngách này hiện tại.",
                    "trend_data": [
                        {"label": "Tuần 1", "value": 35, "value_display": "1.2k đơn"},
                        {"label": "Tuần 2", "value": 50, "value_display": "1.8k đơn"},
                        {"label": "Tuần 3", "value": 80, "value_display": "3.2k đơn"},
                        {"label": "Tuần 4", "value": 65, "value_display": "2.4k đơn"}
                    ],
                    "trending_analysis": "Phân tích biến động dựa trên số liệu sản lượng bán và tương tác.",
                    "competitor_landscape": "Đánh giá mức độ cạnh tranh và đối thủ chính.",
                    "customer_pain_points": ["Nỗi đau 1", "Nỗi đau 2", "..."],
                    "recommended_platforms": [
                        {"platform": "TikTok", "reason": "...", "priority": "High"},
                        {"platform": "Shopee", "reason": "...", "priority": "Medium"}
                    ],
                    "viral_hooks": ["Hook 1 (Ví dụ: Bí mật mà các shop thời trang không muốn bạn biết...)", "Hook 2", "..."],
                    "key_metrics": ["AOV (Giá trị đơn trung bình)", "Conversion Rate dự kiến", "CAC dự kiến"],
                    "content_direction": "Chủ đề nội dung chủ đạo",
                    "opportunity_score": 85,
                    "swot_analysis": {
                        "strengths": ["..."],
                        "weaknesses": ["..."],
                        "opportunities": ["..."],
                        "threats": ["..."]
                    },
                    "strategic_advice": "Lời khuyên chiến lược cụ thể dựa trên số liệu sản lượng bán."
                }
                LƯU Ý: trend_data PHẢI DỰA TRÊN SẢN LƯỢNG BÁN (SALES VOLUME) ƯỚC TÍNH TỪ DỮ LIỆU THỰC TẾ. value_display là con số cụ thể kèm đơn vị đơn hàng.
                CHỈ TRẢ VỀ JSON. KHÔNG GIẢI THÍCH THÊM.
                `;
                const aiResult = await this.model.generateContent(researchPrompt);
                const responseText = aiResult.response.text();
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                let report = { niche_name: wf.field, opportunity_score: 0, trend_data: [] };
                try {
                    report = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
                }
                catch (e) {
                    console.error("Lỗi parse JSON research report:", e);
                }
                resultData = {
                    content: `Báo cáo nghiên cứu ngách: ${report.niche_name}\nĐiểm cơ hội: ${report.opportunity_score}/100`,
                    report: report,
                    type: 'market_research_report'
                };
            }
            else {
                await new Promise(resolve => setTimeout(resolve, 2000));
                resultData = { content: `Kết quả tự động hóa định kỳ cho ${wf.type}: ${wf.name} (Bản #${currentIndex})`, type: 'text' };
            }
            await connectionLogRef.update({ status: 'success' });
            const resultDoc = {
                ...resultData,
                userId,
                workflowId: wfRef.id,
                workflowName: wf.name,
                workflowType: wf.type,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await wfRef.collection('results').add(resultDoc);
            await db.collection('automation_all_results').add(resultDoc);
        }
        catch (err) {
            await connectionLogRef.update({ status: 'error', event: `Bot: Lỗi ở bước ${currentIndex}: ${err.message}` });
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('FIREBASE_ADMIN')),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], AiService);
//# sourceMappingURL=ai.service.js.map