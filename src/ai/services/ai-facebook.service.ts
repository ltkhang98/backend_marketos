import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { AiBaseService } from './ai-base.service';

@Injectable()
export class AiFacebookService {
    constructor(private readonly base: AiBaseService) { }

    async analyzeFacebookAd(url: string, userId: string): Promise<any> {
        if (!this.base.model) {
            throw new Error('Gemini API Key is not configured');
        }

        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.ADS_ANALYSIS, 'Phân tích quảng cáo Facebook', 'ADS_ANALYSIS');

        try {
            console.log('--- Fetching Social Content from URL: ', url);
            const content = await this.fetchContentFromUrl(url, userId, true);
            
            if (!content || content.length < 50) {
                throw new BadRequestException('Không thể bóc tách nội dung chi tiết từ bài viết này. Vui lòng đảm bảo Scraper Python đang chạy tại cổng 8000 và link bài viết là công khai.');
            }

            const prompt = `
            Bạn là một chuyên gia chạy quảng cáo Facebook Ads Expert. Phân tích nội dung sau:
            ${content}
            Trả về JSON chi tiết với các trường: page_name, ad_headline, engagement, ad_metadata, predicted_kpis, targeting_prediction, ai_overall_suggestion, six_stages_analysis.
            `;

            const result = await this.base.model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysisData = JSON.parse(cleanJson);

            const db = admin.firestore();
            await db.collection('ad_analysis_history').add({
                userId,
                url,
                ...analysisData,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return analysisData;
        } catch (error) {
            console.error("Facebook Ad Analysis Error:", error);
            throw new InternalServerErrorException("Không thể phân tích nội dung.");
        }
    }

    async getAdsAnalysisHistory(userId: string) {
        const db = admin.firestore();
        const snapshot = await db.collection('ad_analysis_history')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async compareAds(analysisA: any, analysisB: any, userId: string): Promise<any> {
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.ADS_COMPARISON, 'So sánh quảng cáo', 'ADS_COMPARISON');
        if (!this.base.model) throw new Error('Gemini API Key is not configured');

        const prompt = `
        So sánh hai mẫu quảng cáo sau và trả về JSON chuẩn cho Frontend:
        A: ${JSON.stringify(analysisA)}
        B: ${JSON.stringify(analysisB)}
        
        JSON YÊU CẦU:
        {
            "winner": "Ad A" hoặc "Ad B" hoặc "Draw",
            "reasoning": "Lý do",
            "comparison_points": [
                { "aspect": "Khía cạnh", "ad_a": "Mô tả A", "ad_b": "Mô tả B", "better": "Ad A" }
            ],
            "summary_ad_a": "Tóm tắt A",
            "summary_ad_b": "Tóm tắt B",
            "recommendation": "Gợi ý"
        }
        `;

        try {
            const result = await this.base.model.generateContent(prompt);
            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            return {
                winner: "Draw",
                reasoning: "Cả hai đều tốt.",
                comparison_points: [{ aspect: "Tổng quan", ad_a: "Tốt", ad_b: "Tốt", better: "Ad A" }],
                summary_ad_a: "Ổn", summary_ad_b: "Ổn", recommendation: "Dùng cả hai"
            };
        }
    }

    async fetchContentFromUrl(url: string, userId: string, skipDeduction: boolean = false): Promise<string> {
        if (!skipDeduction) {
            await this.base.deductCredits(userId, this.base.CREDIT_COSTS.FETCH_CONTENT, 'Lấy nội dung từ URL', 'FETCH_CONTENT');
        }
        try {
            const response = await axios.post('http://localhost:8000/scrape', { url });
            return response.data.description || response.data.content || "";
        } catch (error) {
            const response = await axios.get(url, { timeout: 10000 });
            return response.data;
        }
    }

    async searchKeywordDiscovery(keyword: string, cursor: number = 0, userId: string): Promise<any> {
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.FB_KEYWORD, 'Khám phá từ khóa', 'FB_KEYWORD');
        const prompt = `Gợi ý 10 từ khóa liên quan đến "${keyword}" dạng JSON mảng các object có keyword, volume, competition, trend, growth, cpc, difficulty.`;
        try {
            const result = await this.base.model.generateContent(prompt);
            const jsonMatch = result.response.text().match(/\[[\s\S]*\]/);
            const keywords = JSON.parse(jsonMatch[0]);
            return { keywords, total: keywords.length };
        } catch (error) {
            return { keywords: [], total: 0 };
        }
    }

    async getKeywordDetail(keyword: string, userId: string): Promise<any> {
        const prompt = `Phân tích sâu từ khóa "${keyword}" dạng JSON có: keyword, power_score, geographic_distribution, seasonality, market_insight, demographics, content_angles, monetization, related_keywords.`;
        try {
            const result = await this.base.model.generateContent(prompt);
            const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            return {};
        }
    }

    async getTrendingKeywords(category: string, userId: string, type: string = 'hot'): Promise<any[]> {
        const defaults: any = {
            'TẤT CẢ': [
                { keyword: 'Thời trang hè 2024', volume: '150K', trend: 95, growth: '+45%', competition: 'High' },
                { keyword: 'AI marketing tools', volume: '25K', trend: 98, growth: '+120%', competition: 'Low' }
            ]
        };
        const prompt = `Gợi ý 12 từ khóa hot cho ${category} dạng JSON mảng.`;
        try {
            const result = await this.base.model.generateContent(prompt);
            const jsonMatch = result.response.text().match(/\[[\s\S]*\]/);
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            return defaults[category.toUpperCase()] || defaults['TẤT CẢ'];
        }
    }

    async evaluateAndImproveContent(content: string, platform: string, userId: string): Promise<any> {
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.CONTENT_EVALUATION, 'Tối ưu nội dung', 'CONTENT_EVALUATION');
        const prompt = `Tối ưu nội dung sau cho ${platform}:\n${content}`;
        const result = await this.base.model.generateContent(prompt);
        return { original: content, improved: result.response.text() };
    }

    async generateSocialContent(body: any, userId: string): Promise<any> {
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.SOCIAL_CONTENT, 'Tạo nội dung mạng xã hội', 'SOCIAL_CONTENT');
        
        const prompt = `
        Bạn là một đạo diễn kịch bản Video Viral. Hãy tạo kịch bản video cho: ${JSON.stringify(body)}.
        
        QUY TẮC CỰC KỲ QUAN TRỌNG:
        Mỗi phân cảnh BẮT BUỘC phải bắt đầu bằng dòng chữ: "PHÂN CẢNH [Số]:" 
        Ví dụ: "PHÂN CẢNH 1:", "PHÂN CẢNH 2:"...
        
        Cấu trúc mỗi phân cảnh:
        PHÂN CẢNH [X]:
        Góc quay: [Mô tả]
        Hành động: [Mô tả]
        Lời thoại: [Nội dung]
        Thời lượng: [Số giây]
        Âm thanh: [Mô tả]
        
        Hãy tạo ít nhất 4-5 phân cảnh. Trả về nội dung thô theo cấu trúc trên.
        `;

        const result = await this.base.model.generateContent(prompt);
        return { content: result.response.text(), type: 'text' };
    }
}
