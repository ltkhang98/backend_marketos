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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiAutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAutomationService = void 0;
const common_1 = require("@nestjs/common");
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const ai_base_service_1 = require("./ai-base.service");
const ai_facebook_service_1 = require("./ai-facebook.service");
const ai_tiktok_service_1 = require("./ai-tiktok.service");
const ai_media_service_1 = require("./ai-media.service");
let AiAutomationService = AiAutomationService_1 = class AiAutomationService {
    base;
    facebook;
    tiktok;
    media;
    logger = new common_1.Logger(AiAutomationService_1.name);
    constructor(base, facebook, tiktok, media) {
        this.base = base;
        this.facebook = facebook;
        this.tiktok = tiktok;
        this.media = media;
    }
    async runAutomationById(id, userId, isTest = false) {
        const db = admin.firestore();
        const wfRef = db.collection('automations').doc(id);
        const wfDoc = await wfRef.get();
        if (!wfDoc.exists)
            throw new Error('Không tìm thấy quy trình tự động hóa.');
        const wf = wfDoc.data();
        if (wf.userId !== userId)
            throw new Error('Không có quyền truy cập quy trình này.');
        const addBotLog = async (event, status = 'success') => {
            await wfRef.collection('logs').add({
                event,
                status,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await wfRef.update({ lastRunLog: event });
        };
        try {
            await wfRef.update({
                lastRunStatus: 'running',
                lastRunAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await addBotLog(`Bot: Bắt đầu thực thi quy trình "${wf.name}"...`);
            await this.base.deductCredits(userId, this.base.CREDIT_COSTS.AUTOMATION_SCRIPT, `Chạy quy trình: ${wf.name}`, 'AUTOMATION_RUN');
            const quantity = parseInt(wf.quantity) || 1;
            const topics = wf.contentSubType === 'topics' && wf.topicList
                ? wf.topicList.split('\n').filter((t) => t.trim() !== '')
                : [];
            const totalTasks = topics.length > 0 ? (topics.length * quantity) : quantity;
            await addBotLog(`Bot: Khởi tạo xử lý tổng cộng ${totalTasks} tác vụ AI...`);
            let overallIndex = 0;
            if (topics.length > 0) {
                for (let t = 0; t < topics.length; t++) {
                    for (let q = 0; q < quantity; q++) {
                        overallIndex++;
                        await this.processSingleTask(wf, wfRef, topics[t], overallIndex, totalTasks, userId, isTest);
                    }
                }
            }
            else {
                for (let i = 0; i < quantity; i++) {
                    overallIndex++;
                    const mainInput = wf.industry || wf.target || 'Chung';
                    await this.processSingleTask(wf, wfRef, mainInput, overallIndex, totalTasks, userId, isTest);
                }
            }
            await wfRef.update({
                lastRunStatus: 'success',
                runCount: admin.firestore.FieldValue.increment(1)
            });
            await addBotLog(`Bot: Quy trình hoàn tất thành công!`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`[Automation] Error: ${error.message}`);
            await wfRef.update({ lastRunStatus: 'failed', lastRunError: error.message });
            await addBotLog(`Bot: Lỗi hệ thống: ${error.message}`, 'error');
            throw error;
        }
    }
    async processSingleTask(wf, wfRef, topic, current, total, userId, isTest) {
        const db = admin.firestore();
        const connectionLogRef = await wfRef.collection('logs').add({
            event: `Bot: Đang xử lý bản #${current}/${total} [${topic.substring(0, 20)}...]`,
            status: 'processing',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        try {
            if (!this.base.model)
                throw new Error('Gemini API Key is not configured');
            let resultData = { content: '', type: 'text' };
            const timestamp = new Date().toLocaleString('vi-VN');
            switch (wf.type) {
                case 'content_creation': {
                    const systemInstruction = `Bạn là một AI chuyên gia viết Content Marketing đỉnh cao. 
                    KHÔNG chào hỏi, KHÔNG giải thích "Với tư cách là...", KHÔNG dùng các câu mở đầu dư thừa. 
                    Hãy đi thẳng vào nội dung bài viết theo yêu cầu. 
                    Nội dung phải cuốn hút, chuẩn SEO và phù hợp với nền tảng.`;
                    const industry = wf.industry || 'Kinh doanh & Marketing';
                    const target = wf.target || 'Tương tác & Chuyển đổi';
                    const audience = wf.audience || 'Người dùng mạng xã hội';
                    const tone = wf.tone || 'Chuyên nghiệp';
                    const style = wf.style || 'Tự nhiên, lôi cuốn';
                    const platform = wf.platform || 'Facebook';
                    const isNews = topic.toLowerCase().includes('kinh tế') || topic.toLowerCase().includes('tin tức') || industry.toLowerCase().includes('kinh tế');
                    const prompt = `${systemInstruction}
                    
                    YÊU CẦU: Viết bài viết mạng xã hội (Social Post) cho:
                    Ngành hàng: ${industry}. 
                    Chủ đề cụ thể: ${topic}.
                    Nền tảng: ${platform}. 
                    Mục tiêu: ${target}.
                    Đối tượng: ${audience}. 
                    Tone giọng: ${tone}. 
                    Phong cách: ${style}.
                    
                    Yêu cầu bài viết:
                    - Tiêu đề cực kỳ thu hút (Hook).
                    - Thân bài ngắn gọn, súc tích, chia đoạn rõ ràng.
                    - Sử dụng Emoji phù hợp.
                    - Có Hashtags liên quan.
                    - KHÔNG chào hỏi! Hãy bắt đầu bằng Tiêu đề ngay lập tức.
                    Bản tin ngày: ${timestamp}.`;
                    const res = await this.base.model.generateContent(prompt);
                    const mainContent = res.response.text();
                    let imageUrl = null;
                    try {
                        await connectionLogRef.update({ event: `Bot: Đang thiết kế ảnh AI minh họa cho bản #${current}...` });
                        let imagePrompt = `A professional high-quality marketing photography for ${industry}. Context: ${topic}. Visual style: ${style}. Professional lighting, 8k resolution.`;
                        if (isNews) {
                            imagePrompt = `A high-end professional News Studio background with a digital screen showing financial charts and trends related to ${topic}. Cinematic lighting, 8k resolution, photorealistic.`;
                        }
                        const imageRes = await this.media.generateImageMockup(imagePrompt, undefined, undefined, undefined, '1:1', userId);
                        imageUrl = imageRes.url;
                    }
                    catch (imgErr) {
                        this.logger.error(`[Automation] Image Gen Error bản #${current}: ${imgErr.message}`);
                    }
                    resultData.content = mainContent;
                    resultData.imageUrl = imageUrl;
                    resultData.type = 'text_with_image';
                    break;
                }
                case 'market_research': {
                    const prompt = `Lập báo cáo nghiên cứu thị trường cho ngành: ${wf.industry}.
                    Phạm vi: ${topic}. Mục tiêu: ${wf.target}.
                    
                    Trả về JSON thuần với cấu trúc đồng bộ với Dashboard Pro:
                    {
                        "summary": "Tổng quan chiến dịch thị trường",
                        "insights": {
                            "reasoning": "Tại sao ngách này đang là xu hướng? (Phân tích chi tiết)",
                            "advice": "Lời khuyên thực chiến để chiếm lĩnh thị trường",
                            "metrics": [
                                {"label": "Viral Potential", "value": "95%"},
                                {"label": "Competition", "value": "Low/Medium"},
                                {"label": "Conversion Rate", "value": "2.5% - 4%"}
                            ],
                            "keywords": ["keyword1", "keyword2"],
                            "target_audience": ["Tệp 1", "Tệp 2"]
                        },
                        "ads_analysis": [
                            {"tactic": "Chiến thuật 1", "detail": "Mô tả sâu", "effectiveness": "HIGH"},
                            {"tactic": "Chieth thuật 2", "detail": "Mô tả sâu", "effectiveness": "MEDIUM"}
                        ],
                        "recommended_action": "Hành động chốt hạ để triển khai ngay"
                    }`;
                    const geminiRes = await this.base.model.generateContent(prompt);
                    const text = geminiRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                    try {
                        resultData.report = JSON.parse(text);
                        resultData.insights = resultData.report.insights;
                        resultData.type = 'analytics_report';
                        resultData.content = resultData.report.summary;
                    }
                    catch (e) {
                        resultData.content = geminiRes.response.text();
                    }
                    break;
                }
                case 'scraping': {
                    const niche = wf.field || wf.industry || 'Thời trang';
                    const prompt = `Bạn là một chuyên gia nghiên cứu thị trường quốc tế (Amazon, TikTok Shop, Shopee). 
                    Hãy tìm 3 sản phẩm "Winning" nhất (Sản phẩm đang bùng nổ, lợi nhuận cao, xu hướng) 
                    cho lĩnh vực/ngách: ${niche}.
                    
                    Yêu cầu trả về JSON thuần với cấu trúc:
                    {
                        "market_summary": "Phân tích vì sao ngách ${niche} đang bùng nổ (tổng quan)",
                        "winning_products": [
                            {
                                "name": "Tên sản phẩm (ngắn gọn, hấp dẫn)",
                                "category": "Phân khúc",
                                "score": 95,
                                "price_range": "Giá dự kiến",
                                "win_reason": "Tại sao nó thắng? (Insight sâu)",
                                "market_gap": "Đối thủ đang bỏ lỡ điều gì?",
                                "target": "Tệp khách hàng tiềm năng",
                                "strategy": "Cách bán: Video TikTok style gì? Hook gì?",
                                "image_prompt": "Mô tả hình ảnh sản phẩm chuyên nghiệp, studio lighting, high resolution cho AI"
                            }
                        ],
                        "strategic_forecast": "Dự báo doanh thu/xu hướng trong 3 tháng tới",
                        "quick_actions": ["Hành động 1", "Hành động 2"]
                    }`;
                    const geminiRes = await this.base.model.generateContent(prompt);
                    const text = geminiRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                    try {
                        const report = JSON.parse(text);
                        report.overall_market_sentiment = report.market_summary;
                        for (const product of report.winning_products) {
                            try {
                                const imgRes = await this.media.generateImage(product.image_prompt, '1:1');
                                product.imageUrl = imgRes.url;
                            }
                            catch (e) {
                                product.imageUrl = 'https://img.freepik.com/free-vector/abstract-background-design_1297-82.jpg';
                            }
                        }
                        resultData.report = report;
                        resultData.type = 'winning_products_report';
                        resultData.content = report.market_summary;
                    }
                    catch (e) {
                        resultData.content = geminiRes.response.text();
                    }
                    break;
                }
                case 'ads_spy': {
                    const prompt = `Bạn là chuyên gia phân tích thị trường và đối thủ. 
                    Hãy thực hiện phân tích sâu về chủ đề: ${topic} trong ngành ${wf.industry}.
                    
                    YÊU CẦU: Trả về JSON thuần (không có dấu Markdown) với cấu trúc sau:
                    {
                        "summary": "Tóm tắt tổng quan thị trường (2-3 câu)",
                        "insights": {
                            "reasoning": "Tại sao chủ đề này đang là xu hướng? Phân tích tâm lý khách hàng.",
                            "advice": "Lời khuyên thực chiến để chiếm lĩnh thị trường ngay lập tức.",
                            "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"],
                            "target_audience": ["Đối tượng 1", "Đối tượng 2"],
                            "metrics": [
                                {"label": "Tiềm năng Viral", "value": "90%"},
                                {"label": "Độ cạnh tranh", "value": "Trung bình"},
                                {"label": "Khả năng chuyển đổi", "value": "Cao"},
                                {"label": "Mức độ quan tâm", "value": "Đang tăng mạnh"}
                            ]
                        },
                        "ads_analysis": [
                            {"tactic": "Chiến thuật nội dung", "effectiveness": "Cao", "detail": "Mô tả chi tiết cách đối thủ đang làm nội dung"},
                            {"tactic": "Chiến thuật chạy Ads", "effectiveness": "Trung bình", "detail": "Mô tả cách nhắm mục tiêu và phễu"}
                        ],
                        "recommended_action": "Kế hoạch hành động cụ thể từng bước."
                    }`;
                    const res = await this.base.model.generateContent(prompt);
                    const text = res.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                    try {
                        resultData.report = JSON.parse(text);
                        resultData.type = 'analytics_report';
                        resultData.content = resultData.report.summary;
                        resultData.insights = resultData.report.insights;
                    }
                    catch (e) {
                        resultData.content = res.response.text();
                        resultData.type = 'text';
                    }
                    break;
                }
                default: {
                    const res = await this.base.model.generateContent(`Tạo nội dung cho ${wf.name} về chủ đề ${topic}`);
                    resultData.content = res.response.text();
                    resultData.type = 'text';
                    break;
                }
            }
            const resultDoc = { ...resultData, userId, workflowId: wfRef.id, workflowName: wf.name, workflowType: wf.type, createdAt: admin.firestore.FieldValue.serverTimestamp() };
            await wfRef.collection('results').add(resultDoc);
            await db.collection('automation_all_results').add(resultDoc);
            await connectionLogRef.update({ status: 'success', event: `Bot: Đã hoàn tất bản #${current}.` });
        }
        catch (err) {
            await connectionLogRef.update({ status: 'error', event: `Bot: Lỗi bản #${current}: ${err.message}` });
            throw err;
        }
    }
    async generateLandingPage(prompt, userId) {
        if (!this.base.model)
            throw new Error('Gemini API Key is not configured');
        if (userId) {
            await this.base.deductCredits(userId, this.base.CREDIT_COSTS.LP_CREATE, 'Sáng tạo Landing Page AI', 'LP_CREATE');
        }
        const result = await this.base.model.generateContent(`Tạo Landing Page cho: ${prompt}`);
        return { html: result.response.text() };
    }
    async scrapeProductData(url, userId) {
        this.logger.log(`[Scraper] Starting scrape for URL: ${url} (User: ${userId})`);
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.PRODUCT_SCRAPER, 'Cào dữ liệu sản phẩm', 'PRODUCT_SCRAPER');
        try {
            const scraperBaseUrl = process.env.SCRAPER_SERVICE_URL || 'http://localhost:8000';
            const endpoint = scraperBaseUrl.endsWith('/') ? `${scraperBaseUrl}scrape` : `${scraperBaseUrl}/scrape`;
            this.logger.log(`[Scraper] Proxying request to: ${endpoint}`);
            const response = await axios_1.default.post(endpoint, { url }, {
                timeout: 120000
            });
            this.logger.log(`[Scraper] Scrape success for URL: ${url}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`[Scraper] Error calling python scraper: ${error.message}`);
            return {
                product_name: 'Lỗi: Không thể kết nối với dịch vụ cào dữ liệu (Python Scraper có thể chưa bật)',
                price: 'N/A',
                images: [],
                description: `Không thể lấy dữ liệu từ ${url}. Lỗi: ${error.message}`
            };
        }
    }
    async generateMarketingPlan(body, userId) {
        if (!this.base.model)
            throw new Error('Gemini API Key is not configured');
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.MARKETING_PLAN, 'Lập kế hoạch Marketing', 'MARKETING_PLAN');
        const result = await this.base.model.generateContent(`Lập kế hoạch marketing cho: ${JSON.stringify(body)}`);
        return { content: result.response.text() };
    }
};
exports.AiAutomationService = AiAutomationService;
exports.AiAutomationService = AiAutomationService = AiAutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_base_service_1.AiBaseService,
        ai_facebook_service_1.AiFacebookService,
        ai_tiktok_service_1.AiTikTokService,
        ai_media_service_1.AiMediaService])
], AiAutomationService);
//# sourceMappingURL=ai-automation.service.js.map