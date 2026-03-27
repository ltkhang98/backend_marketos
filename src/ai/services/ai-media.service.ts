import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { AiBaseService } from './ai-base.service';
import { MediaService } from '../../media/media.service';

@Injectable()
export class AiMediaService {
    private readonly logger = new Logger(AiMediaService.name);
    constructor(
        private readonly base: AiBaseService,
        private readonly mediaService: MediaService,
    ) { }
    
    async generateImage(prompt: string, aspectRatio: string = '1:1', userId?: string): Promise<{ url: string }> {
        const parts = [{ text: prompt }];
        const models = ["gemini-3.1-flash-image-preview", "gemini-2.1-flash-image", "gemini-2.0-flash"];
        for (const m of models) {
            const url = await this.callSingleGeminiImageGen(m, parts, userId, aspectRatio);
            if (url) return { url };
        }
        return { url: 'https://img.freepik.com/free-vector/abstract-background-design_1297-82.jpg' };
    }

    async generateSpeech(body: { text: string; voice: string; speed?: string | number }, userId: string): Promise<any> {
        if (!this.base.currentFptKey) throw new BadRequestException('FPT AI API Key chưa được cấu hình.');

        const costPer100Chars = this.base.CREDIT_COSTS.TEXT_TO_SPEECH || 10;
        const totalCost = Math.ceil(body.text.length / 100) * costPer100Chars;

        await this.base.deductCredits(userId, totalCost, `Chuyển văn bản thành giọng nói (${body.text.slice(0, 20)}...)`, 'TEXT_TO_SPEECH');

        const cleanedText = body.text.replace(/[#*_\-\r\n]/g, " ").trim();
        if (!cleanedText) return { url: null, success: false, message: 'Nội dung trống' };

        const tryCall = async (tier: 'v5' | 'v3' | 'google', retryCount = 0): Promise<string> => {
            try {
                if (tier === 'v5') {
                    const v5Res = await axios({
                        method: 'post',
                        url: 'https://api.fpt.ai/hmi/tts/v5',
                        data: cleanedText,
                        headers: {
                            'api_key': this.base.currentFptKey,
                            'voice': body.voice || 'banmai',
                            'speed': String(body.speed || '0'),
                            'Content-Type': 'text/plain'
                        },
                        timeout: 12000
                    });
                    if (v5Res.data?.async) return v5Res.data.async;
                } else if (tier === 'v3') {
                    const params = new URLSearchParams();
                    params.append('api_key', this.base.currentFptKey || '');
                    params.append('text', cleanedText);
                    params.append('voice', body.voice || 'banmai');
                    params.append('speed', String(body.speed || '0'));

                    const v3Res = await axios.post('https://api.fpt.ai/hmi/tts/v3', params.toString(), {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        timeout: 30000
                    });
                    if (v3Res.data?.async) return v3Res.data.async;
                } else {
                    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanedText)}&tl=vi&client=tw-ob`;
                }
                throw new Error('Không nhận được URL từ API');
            } catch (err: any) {
                const status = err.response?.status;
                if (retryCount < 1 && (status === 404 || status === 429 || !status) && tier !== 'google') {
                    await new Promise(r => setTimeout(r, 2000));
                    return tryCall(tier, retryCount + 1);
                }
                throw new Error(`${tier} failed: ${err.message}`);
            }
        };

        try {
            let finalUrl = '';
            try {
                finalUrl = await tryCall('v5');
            } catch (v5Err) {
                try {
                    finalUrl = await tryCall('v3');
                } catch (v3Err) {
                    finalUrl = await tryCall('google');
                }
            }
            return { url: finalUrl, success: true };
        } catch (error: any) {
            throw new InternalServerErrorException('Lỗi khi gọi API FPT AI: ' + error.message);
        }
    }

    async generateImageMockup(prompt: string, productImage?: string, logoImage?: string, modelImage?: string, aspectRatio?: string, userId?: string): Promise<any> {
        if (!this.base.genAI) throw new BadRequestException('Gemini API Key chưa được cấu hình.');
        if (userId) {
            await this.base.deductCredits(userId, this.base.CREDIT_COSTS.MOCKUP, 'Tạo Mockup AI', 'MOCKUP');
        }

        try {
            this.logger.log(`--- Mockup Generation via Gemini 2.0 Flash (${aspectRatio}) ---`);

            let enhancedPrompt = prompt;
            const enhanceModel = this.base.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            try {
                let promptParts: any[] = [
                    `Act as a world-class Visual Artist and Visual Clone Expert. 
                    Construct a high-precision prompt for an image generation agent.
                    Idea: "${prompt}".

                    Instructions:
                    1. STRICT PRODUCT IDENTITY: The generated image MUST preserve the EXACT appearance, logo, texture, and structural design of the PRODUCT provided in the image.
                    2. BRAND INTEGRATION: If a LOGO is provided, integrate it masterfully into the product or scene as a professional branding element.
                    3. ZERO MODIFICATION: Do NOT add new text, logos, or modify existing designs on the product except for the provided logo.
                    4. VISUAL CLONING: Perform a direct pixel-level transfer of the product's identity into the new scene.
                    5. SPATIAL REFERENCE: Maintain the correct scale and perspective of the product relative to the environment / person.
                    6. High-End Commercial: Use professional studio lighting (Rembrandt lighting, rim lights), 8k resolution, and photorealistic textures.
                    7. Composition: The product must be the focal point. Ensure natural interaction.
                    8. Target Aspect Ratio: ${aspectRatio}.
                    9. Output ONLY the English descriptive prompt. Max 90 words.`
                ];

                const prodBase64 = productImage ? await this.base.resolveBase64Image(productImage) : null;
                const logoBase64 = logoImage ? await this.base.resolveBase64Image(logoImage) : null;
                const modelBase64 = modelImage ? await this.base.resolveBase64Image(modelImage) : null;

                if (prodBase64) promptParts.push({ inlineData: { data: prodBase64, mimeType: "image/jpeg" } });
                if (logoBase64) promptParts.push({ inlineData: { data: logoBase64, mimeType: "image/jpeg" } });
                if (modelBase64) promptParts.push({ inlineData: { data: modelBase64, mimeType: "image/jpeg" } });

                const enhResult = await enhanceModel.generateContent(promptParts);
                enhancedPrompt = enhResult.response.text().replace(/[*"`]/g, '').trim();
            } catch (e) {
                this.logger.warn("Enhance failed, using original: " + e.message);
            }

            const imageModels = ['gemini-2.5-flash-image', 'gemini-2.0-flash'];
            let lastErrorMessage = "";
            for (const modelName of imageModels) {
                for (let attempt = 1; attempt <= 2; attempt++) {
                    try {
                        const imgModel = this.base.genAI.getGenerativeModel({ model: modelName });
                        const finalParts: any[] = [{ text: enhancedPrompt }];

                        const prodBase64 = productImage ? await this.base.resolveBase64Image(productImage) : null;
                        const logoBase64 = logoImage ? await this.base.resolveBase64Image(logoImage) : null;
                        const modelBase64 = modelImage ? await this.base.resolveBase64Image(modelImage) : null;

                        if (prodBase64) finalParts.push({ inlineData: { data: prodBase64, mimeType: "image/jpeg" } });
                        if (logoBase64) finalParts.push({ inlineData: { data: logoBase64, mimeType: "image/jpeg" } });
                        if (modelBase64) finalParts.push({ inlineData: { data: modelBase64, mimeType: "image/jpeg" } });

                        const ratioKeyword = aspectRatio === '16:9' ? 'Wide Cinematic Landscape (16:9)' : aspectRatio === '9:16' ? 'Ultra-Tall Vertical Portrait (9:16)' : `Standard Square (1:1)`;
                        const result = await imgModel.generateContent({
                            contents: [{
                                role: 'user', parts: [
                                    { text: `[CRITICAL: OUTPUT MUST BE ${ratioKeyword}. DO NOT USE 1:1 SQUARE.]` },
                                    ...finalParts,
                                    { text: `[FINAL COMMAND: RENDER IMAGE IN ${aspectRatio} ${ratioKeyword} ONLY. IGNORE ALL SQUARE INPUTS.]` }
                                ]
                            }]
                        });
                        const imagePart = result.response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
                        if (imagePart?.inlineData) {
                            const storageUrl = await this.uploadBase64ToStorage(imagePart.inlineData.data, imagePart.inlineData.mimeType || 'image/jpeg', userId, aspectRatio);
                            return { url: storageUrl };
                        }
                    } catch (err) {
                        lastErrorMessage = err.message;
                        if (attempt === 1 && (lastErrorMessage.includes('429') || lastErrorMessage.includes('quota'))) {
                            await new Promise(r => setTimeout(r, 2000));
                            continue;
                        }
                        break;
                    }
                }
            }
            throw new Error(lastErrorMessage);
        } catch (error: any) {
            this.logger.error("Mockup Error:", error.message);
            throw new InternalServerErrorException('Không thể tạo ảnh. Vui lòng thử lại sau!');
        }
    }

    async generateVisualClone(modelImage: string, templatePrompt: string, userId: string, templateImage?: string, count: number = 1, fidelity: number = 90, creativity: number = 50): Promise<any> {
        if (!this.base.genAI) throw new BadRequestException('Gemini API Key chưa được cấu hình.');
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.VISUAL_CLONE || 500, 'Sáng tạo ảnh Photo Studio (Gemini)', 'VISUAL_CLONE');

        try {
            const modelBase64 = await this.base.resolveBase64Image(modelImage);
            const templateBase64 = templateImage ? await this.base.resolveBase64Image(templateImage) : null;
            if (!modelBase64) throw new BadRequestException('Không thể xử lý ảnh khuôn mặt đầu vào.');

            const fidelityInstruction = fidelity > 85 ?
                "CRITICAL: The face MUST be 100% identical to the source image. DO NOT modify features." :
                "Maintain strong face resemblance to the source image.";
            const creativityInstruction = creativity > 50 ?
                "Feel free to add artistic lighting, cinematic bokeh, and atmospheric details." :
                "Keep the environment and lighting realistic and clean.";

            let finalPrompt = "";
            const parts: any[] = [];
            if (templateBase64) {
                finalPrompt = `TASK: IMAGE-TO-IMAGE IDENTITY TRANSFORMATION. 
                    - SOURCE IDENTITY: The person shown in the 'source_identity' image.
                    - TARGET CONTEXT: The scene and person shown in the 'target_context' image.
                    - ACTION: COMPLETELY REPLACE the head/face/body of the person in 'target_context' with the person from 'source_identity'.
                    - REQUIREMENTS: Keep the EXACT pose, clothing, and background from 'target_context'. 
                    - IDENTICAL FACE: ${fidelityInstruction}
                    - STYLE: ${creativityInstruction}
                    - OUTPUT: High-quality, professional photography, 8k resolution.`;
                parts.push({ inlineData: { data: templateBase64, mimeType: "image/jpeg" } }, { text: "target_context image" });
                parts.push({ inlineData: { data: modelBase64, mimeType: "image/jpeg" } }, { text: "source_identity image" });
            } else {
                const cleanPrompt = templatePrompt || "Professional studio portrait, elegant lighting";
                finalPrompt = `TASK: NEW IMAGE PRODUCTION WITH IDENTITY.
                    - ACTOR: The person from the 'source_identity' image.
                    - SCENE: ${cleanPrompt}.
                    - INSTRUCTIONS: Generate a high-end, realistic photograph of this PERSON in the specified scene.
                    - IDENTICAL FACE: ${fidelityInstruction}
                    - STYLE: ${creativityInstruction}
                    - OUTPUT: Professional photography, 8k, cinematic lighting, sharp details.`;
                parts.push({ inlineData: { data: modelBase64, mimeType: "image/jpeg" } }, { text: "source_identity image" });
            }
            parts.push({ text: finalPrompt });

            const googleModels = ["gemini-2.5-flash-image", "gemini-2.0-flash-exp", "gemini-2.0-flash"];
            let finalUrls: string[] = [];
            const resultsCount = Math.min(count, 8);

            for (const modelName of googleModels) {
                if (finalUrls.length > 0) break;
                const tasks = Array.from({ length: resultsCount }).map(() => this.callSingleGeminiImageGen(modelName, parts, userId));
                const results = await Promise.all(tasks);
                finalUrls = results.filter((url): url is string => !!url);
            }

            if (finalUrls.length === 0) throw new Error("Không thể tạo ảnh bằng Gemini (Model không phản hồi / Quotas).");

            const db = admin.firestore();
            await db.collection('visual_clone_history').add({
                userId, modelImage, templatePrompt, templateImage: templateImage || null,
                urls: finalUrls,
                meta: { fidelity, creativity, method: templateImage ? 'swap' : 'generate', engine: 'gemini' },
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { urls: finalUrls };
        } catch (error: any) {
            this.logger.error(`[VisualClone] Error: ${error.message}`);
            throw new InternalServerErrorException('Lỗi hệ thống khi thiết kế ảnh với Gemini: ' + error.message);
        }
    }

    private async callSingleGeminiImageGen(modelName: string, parts: any[], userId?: string, aspectRatio?: string): Promise<string | null> {
        if (!this.base.genAI) return null;
        try {
            const model = this.base.genAI.getGenerativeModel({
                model: modelName,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ]
            });
            const ratioKeyword = (aspectRatio === '16:9') ? 'Wide Cinematic Landscape (16:9)' : (aspectRatio === '9:16') ? 'Ultra-Tall Vertical Portrait (9:16)' : (aspectRatio === '1:1') ? 'Standard Square (1:1)' : 'Standard Frame';
            const result = await model.generateContent({
                contents: [{
                    role: 'user', parts: [
                        { text: `[CRITICAL: OUTPUT MUST BE ${ratioKeyword}. DO NOT USE 1:1 SQUARE.]` },
                        ...parts,
                        { text: `[FINAL COMMAND: RENDER IMAGE IN ${aspectRatio || '1:1'} ${ratioKeyword} ONLY. IGNORE ALL SQUARE INPUTS.]` }
                    ]
                }]
            });

            const imagePart = result.response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
            if (imagePart?.inlineData) return await this.uploadBase64ToStorage(imagePart.inlineData.data, imagePart.inlineData.mimeType || 'image/jpeg', userId, aspectRatio || '1:1');

            this.logger.error(`AI Model did not return an image: ${result.response.text() || "Empty response"}`);
            return null;
            return null;
        } catch (e) { return null; }
    }

    async generateKocProductImage(kocId: string, productImage: string, prompt: string, userId: string, modelOverride?: string, bgImage?: string): Promise<{ url: string | null; urls: string[] }> {
        if (!this.base.genAI) throw new BadRequestException('Gemini API Key chưa được cấu hình.');
        const db = admin.firestore();
        const kocDoc = await db.collection('ai_kocs').doc(kocId).get();
        if (!kocDoc.exists) throw new BadRequestException('Không tìm thấy KOC.');
        const modelImage = modelOverride || kocDoc.data()?.imageUrl;

        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.VISUAL_CLONE || 500, 'Tạo ảnh KOC + Sản phẩm', 'VISUAL_CLONE');

        try {
            const replacementPrompt = `CRITICAL PHOTO-EDITING MISSION: 
                  - YOUR GOAL: REPLACE the human model in the BACKGROUND image with THE KOC (Source Identity) provided.
                  - IDENTITY SOURCE: Use the EXACT face, features, body shape, HAIR STYLE, and HAIR COLOR (blonde/grey) from the KOC image.
                  - SPATIAL GUIDE: Use the EXACT pose and position of the person in the BACKGROUND.
                  - PRODUCT: Dress the KOC in the PRODUCT provided.
                  - FINAL MANDATORY CHECK: KẾT QUẢ PHẢI CÓ ĐẦY ĐỦ KIỂU TÓC, MÀU TÓC, GƯƠNG MẶT VÀ HÌNH DÁNG CỦA KOC. KHÔNG ĐƯỢC GIỮ LẠI MẶT CŨ. KHÔNG CÓ NGOẠI LỆ.`;
            const classicPrompt = `Act as a master digital artist. Create a high-end commercial advertisement combining THE KOC and THE PRODUCT.
                  1. IDENTITY: Preserve the KOC's face and features 100%.
                  2. PRODUCT: Preserve the product details 100%.
                  3. SCENE: Create a realistic background based on: ${prompt}.
                  4. STYLE: Photorealistic studio lighting, cinematic 8k.`;
            const finalPrompt = bgImage ? replacementPrompt : classicPrompt;

            const modelBase64 = await this.base.resolveBase64Image(modelImage);
            const productBase64 = await this.base.resolveBase64Image(productImage);
            const bgBase64 = bgImage ? await this.base.resolveBase64Image(bgImage) : null;
            if (!modelBase64 || !productBase64) throw new BadRequestException('Không thể xử lý hình ảnh đầu vào.');

            const parts: any[] = [];
            if (bgBase64) parts.push({ inlineData: { data: bgBase64, mimeType: "image/jpeg" } });
            parts.push({ inlineData: { data: modelBase64, mimeType: "image/jpeg" } });
            parts.push({ inlineData: { data: productBase64, mimeType: "image/jpeg" } });
            parts.push({ text: finalPrompt });

            const googleModels = ["gemini-2.5-flash-image", "gemini-1.5-flash", "gemini-2.0-flash-exp"];
            let finalUrls: string[] = [];
            for (const modelName of googleModels) {
                if (finalUrls.length > 0) break;
                // Sinh 6 ảnh song song để người dùng có nhiều lựa chọn hơn
                const tasks = Array.from({ length: 6 }).map(() => this.callSingleGeminiImageGen(modelName, parts, userId, '1:1'));
                const results = await Promise.all(tasks);
                finalUrls = results.filter((url): url is string => !!url);
            }

            await db.collection('koc_product_history').add({
                userId, kocId, modelImage, productImage, prompt, urls: finalUrls,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { url: finalUrls[0] || null, urls: finalUrls };
        } catch (error: any) {
            this.logger.error(`[KocProduct] Error: ${error.message}`);
            throw new InternalServerErrorException('Lỗi khi tạo ảnh KOC + Sản phẩm: ' + error.message);
        }
    }

    async generateKocVisual(data: { kocId: string; angle: string; outfit: string; hairColor: string; action: string }, userId: string): Promise<{ url: string | null; urls: string[] }> {
        if (!this.base.genAI) throw new BadRequestException('Gemini API Key chưa được cấu hình.');
        const db = admin.firestore();
        const kocDoc = await db.collection('ai_kocs').doc(data.kocId).get();
        if (!kocDoc.exists) throw new BadRequestException('Không tìm thấy nhân vật KOC.');

        const kocData = kocDoc.data();
        const modelImage = kocData?.imageUrl;
        await this.base.deductCredits(userId, 500, `Kiến tạo diện mạo KOC (${data.kocId})`, 'VISUAL_CLONE');

        try {
            const finalPrompt = `Act as a master photographer and digital artist. 
            Your task is to generate a NEW high-quality image of the PERSON (KOC) provided while maintaining their EXACT face, identity, and features.
            
            SCENE CONFIGURATION:
            - Camera Angle: ${data.angle}
            - Outfit / Clothing: ${data.outfit}
            - Hair Style & Color: ${data.hairColor}
            - Action / Context: ${data.action || 'Sáng tạo bối cảnh sang trọng, nghệ thuật'}
            
            REQUIREMENTS:
            - The face of the KOC MUST remain 100% identical to the input image.
            - Ensure the new pose and clothing look natural and high-end.
            - Photorealistic style, 8k, cinematic lighting, professional composition.
            - Background should complement the requested outfit and action.
            - Output: Only return the creative masterpiece image.`;

            const modelBase64 = await this.base.resolveBase64Image(modelImage);
            if (!modelBase64) throw new BadRequestException('Không thể xử lý ảnh gốc của KOC.');

            const parts = [
                { text: finalPrompt },
                { inlineData: { data: modelBase64, mimeType: "image/jpeg" } }
            ];

            const googleModels = ["gemini-2.5-flash-image", "gemini-2.0-flash-exp"];
            let finalUrl: string | null = null;
            for (const modelName of googleModels) {
                if (finalUrl) break;
                finalUrl = await this.callSingleGeminiImageGen(modelName, parts, userId);
            }

            if (finalUrl) {
                await db.collection('koc_visual_history').add({
                    userId, kocId: data.kocId, params: data, url: finalUrl,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                await db.collection('ai_kocs').doc(data.kocId).update({
                    album: admin.firestore.FieldValue.arrayUnion(finalUrl),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            return { url: finalUrl, urls: finalUrl ? [finalUrl] : [] };
        } catch (error: any) {
            this.logger.error(`[KocVisual] Error: ${error.message}`);
            throw new InternalServerErrorException('Lỗi khi kiến tạo bối cảnh KOC: ' + error.message);
        }
    }

    async downloadUniversalVideo(urlInput: string, userId: string): Promise<any> {
        const urlMatch = urlInput.match(/(https?:\/\/[^\s，！。？]+)/);
        let url = urlMatch ? urlMatch[0] : urlInput;
        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            url = url.trim().split('?')[0];
            if (url.endsWith('/')) url = url.slice(0, -1);
        }

        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.VIDEO_DOWNLOADER, 'Tải video Đa kênh', 'VIDEO_DOWNLOADER');
        const platform = this.detectPlatform(url);

        if (platform === 'TikTok' || platform === 'Douyin') {
            try {
                const tikData = await this.downloadTikTokVideo(url, userId, true);
                return {
                    title: tikData.title || `Video ${platform}`,
                    thumbnail: tikData.cover || tikData.origin_cover,
                    source: new URL(url).hostname,
                    platform: platform,
                    quality: [
                        { label: 'Không Logo (HD)', url: tikData.hdplay || tikData.play, type: 'video' },
                        { label: 'Tải Nhạc (MP3)', url: tikData.music, type: 'audio' }
                    ]
                };
            } catch (err) { }
        }

        if (platform === 'Facebook') {
            try {
                const params = new URLSearchParams();
                params.append('id', url);
                const fbRes = await axios.post('https://getmyfb.com/process', params, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 15000
                });
                const html = String(fbRes.data);
                const hdMatch = html.match(/"hd_src":"([^"]+)"/i) || html.match(/href="([^"]+)"[^>]*>HD/i);
                if (hdMatch) return {
                    title: 'Facebook Video', thumbnail: 'https://placehold.co/600x400/1877F2/FFFFFF/png?text=Facebook',
                    source: 'facebook.com', platform,
                    quality: [{ label: 'HD Quality', url: hdMatch[1].replace(/&amp;/g, '&'), type: 'video' }]
                };
            } catch (err) { }
        }

        try {
            const res = await axios.post('https://api.cobalt.tools/api/json', { url, videoQuality: '1080' }, { headers: { 'Accept': 'application/json' }, timeout: 15000 });
            if (res.data?.url) return {
                title: `Video ${platform}`, thumbnail: 'https://placehold.co/600x400/000000/FFFFFF/png?text=Video',
                source: new URL(url).hostname, platform,
                quality: [{ label: 'Chất lượng cao nhất', url: res.data.url, type: 'video' }]
            };
        } catch (e) { }

        throw new BadRequestException(`Không thể tải video từ ${platform}. Vui lòng thử lại sau.`);
    }

    private detectPlatform(url: string): string {
        const u = url.toLowerCase();
        if (u.includes('tiktok.com')) return 'TikTok';
        if (u.includes('douyin.com')) return 'Douyin';
        if (u.includes('facebook.com') || u.includes('fb.watch')) return 'Facebook';
        if (u.includes('instagram.com')) return 'Instagram';
        if (u.includes('youtube.com') || u.includes('youtu.be')) return 'Youtube';
        return 'Website';
    }

    async downloadTikTokVideo(url: string, userId: string, skipDeduction = false): Promise<any> {
        const urlMatch = url.match(/(https?:\/\/[^\s，！。？]+)/);
        url = urlMatch ? urlMatch[0] : url;
        if (!skipDeduction) await this.base.deductCredits(userId, this.base.CREDIT_COSTS.VIDEO_DOWNLOADER, 'Tải video TikTok', 'VIDEO_DOWNLOADER');

        try {
            let cleanUrl = url.trim().split('?')[0];
            if (cleanUrl.includes('v.douyin.com')) {
                const res = await axios.get(cleanUrl, { maxRedirects: 5, timeout: 10000 });
                cleanUrl = res.request.res.responseUrl || res.config.url || cleanUrl;
            }
            const params = new URLSearchParams();
            params.append('url', cleanUrl);
            params.append('hd', '1');
            const response = await axios.post('https://www.tikwm.com/api/', params, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 20000
            });
            if (response.data?.code === 0) return response.data.data;
            throw new Error(response.data?.msg || 'Error');
        } catch (error) {
            throw new BadRequestException('Không thể tải video TikTok/Douyin.');
        }
    }

    private async uploadBase64ToStorage(base64: string, mimeType: string, userId?: string, aspectRatio?: string): Promise<string> {
        try {
            const buffer = Buffer.from(base64, 'base64');
            const fileExt = mimeType === 'image/png' ? '.png' : '.jpg';
            const fileName = `ai_gen_${Date.now()}${fileExt}`;

            // Lưu vào thư mục uploads/ai_generated
            const relativeUrl = await this.mediaService.saveBuffer(buffer, fileName, 'ai_generated');

            return relativeUrl;
        } catch (error: any) {
            this.logger.error('Lỗi lưu ảnh cục bộ:', error);
            return '';
        }
    }

    async getAiKocs(userId: string): Promise<any[]> {
        if (!userId) {
            this.logger.error('userId is missing in getAiKocs');
            return [];
        }
        try {
            const db = admin.firestore();
            const snapshot = await db.collection('ai_kocs').where('userId', '==', userId).get();
            const docs = snapshot.docs || [];
            return docs.map(doc => ({ id: doc.id, ...(doc.data() || {}) }));
        } catch (error: any) {
            this.logger.error('Critical Failure in getAiKocs:', error);
            throw new InternalServerErrorException(error.message || 'Lỗi hệ thống khi tải KOC.');
        }
    }

    async createAiKoc(data: any, userId: string): Promise<any> {
        const db = admin.firestore();
        const koc = { ...data, userId, createdAt: admin.firestore.FieldValue.serverTimestamp() };
        const doc = await db.collection('ai_kocs').add(koc);
        return { id: doc.id, ...koc };
    }

    async deleteAiKoc(id: string, userId: string): Promise<any> {
        const db = admin.firestore();
        await db.collection('ai_kocs').doc(id).delete();
        return { success: true };
    }

    async removeBackground(imageUrl: string, userId: string): Promise<any> {
        await this.base.deductCredits(userId, 100, 'Xóa nền', 'REMOVE_BG');
        return { imageUrl };
    }

    async enhanceImage(imageUrl: string, userId: string): Promise<any> {
        await this.base.deductCredits(userId, 100, 'Nâng cao chất lượng ảnh', 'ENHANCE_IMAGE');
        return { imageUrl };
    }

    async proxyDownload(url: string, filename: string, res: any): Promise<any> {
        try {
            const response = await axios({ method: 'get', url: url, responseType: 'stream' });
            res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
            response.data.pipe(res);
        } catch (error) {
            res.status(500).send("Error downloading file");
        }
    }

    async generateSmartBanner(data: {
        productImage?: string;
        productImages?: string[];
        modelImage?: string;
        logoImage?: string;
        refImage?: string;
        companyName?: string;
        productName?: string;
        slogan: string;
        price: string;
        details?: string;
        industry?: string;
        style: string;
        aspectRatio: string;
        quality: string;
    }, userId: string): Promise<{ url: string }> {
        try {
            this.logger.log(`--- [Smart Banner] Global Generation Strategy Starting (User: ${userId}) ---`);

            const prodImages = data.productImages || (data.productImage ? [data.productImage] : []);
            const prodBase64List = await Promise.all(prodImages.map(img => this.base.resolveBase64Image(img)));
            const validProdBase64List = prodBase64List.filter(b => b !== null) as string[];

            const modelBase64 = await this.base.resolveBase64Image(data.modelImage);
            const refBase64 = await this.base.resolveBase64Image(data.refImage);
            const logoBase64 = await this.base.resolveBase64Image(data.logoImage);

            if (validProdBase64List.length === 0 && !refBase64 && !modelBase64) {
                throw new BadRequestException('Không thể xử lý hình ảnh đầu vào. Vui lòng kiểm tra định dạng ảnh.');
            }

            if (userId) {
                await this.base.deductCredits(userId, this.base.CREDIT_COSTS.SMART_BANNER, 'Thiết kế Banner Studio AI', 'SMART_BANNER');
            }

            const effectiveProductName = data.productName || 'Sản phẩm mới';
            const effectiveCompanyName = data.companyName || 'Công ty mới';

            const stylePrompts: any = {
                'Minimalism': 'Thẩm mỹ tối giản, không gian trắng sạch sẽ, bố cục thoáng đãng, chỉ giữ lại các yếu tố thiết yếu, sự tinh tế trong sự đơn giản.',
                'High-Contrast': 'Ánh sáng nghệ thuật cường độ cao, bóng đổ sâu, màu sắc bão hòa rực rỡ, hiệu ứng thị giác mạnh mẽ, độ tương phản cao.',
                'Elegant': 'Tông màu pastel nhẹ nhàng, phong cách sang trọng cao cấp, họa tiết tinh xảo, đường nét thanh thoát, thẩm mỹ thiết kế cao cấp.',
                'Dynamic': 'Tập trung vào hành động, hiệu ứng mờ chuyển động, các hạt/mảnh vỡ lơ lửng, góc quay năng động, nhịp độ mạnh mẽ.',
                'Professional': 'Bố cục đối xứng ở trung tâm, thẩm mỹ doanh nghiệp chỉn chu, ánh sáng trực tiếp rõ ràng, đáng tin cậy và sắc nét.'
            };

            const styleDesc = stylePrompts[data.style] || stylePrompts['Professional'];

            const industryPrompts: any = {
                "Mỹ phẩm & Làm đẹp": "Bố cục tinh tế, mềm mại, tôn vinh làn da và vẻ đẹp hoàn mỹ. Sản phẩm mỹ phẩm lấp lánh (nếu có), hiệu ứng ánh sáng diệu kỳ (skin-glowing) tôn lên sự trong trẻo.",
                "Thời trang & May mặc": "Phong cách thời trang cao cấp (High-fashion editorial), tư thế người mẫu đẳng cấp, thể hiện nếp gấp vải và chất liệu chân thực, bối cảnh studio tạp chí thời trang danh tiếng.",
                "Công nghệ & Điện tử": "Thẩm mỹ thiết kế sản phẩm hiện đại sắc sảo (Tech-aesthetic), ánh sáng ven tinh tế làm nổi bật chất liệu kim loại/kính, hiệu ứng sci-fi hoặc tối giản tương lai.",
                "Ẩm thực & Nhà hàng": "Chụp ảnh ẩm thực thương mại siêu cận (Commercial Food Photography), chi tiết sắc nét tới từng giọt nước sốt. Ánh sáng ấm áp rực rỡ gợi sự ngon miệng, làn khói nóng bốc lên tự nhiên (nếu là món nóng).",
                "Bất động sản": "Siêu thực kiến trúc (Architectural Photography), góc chụp mở rộng (Wide-angle focus). Ánh sáng giờ vàng ngập tràn (Golden hour lighting). Không gian sống mơ ước, sang trọng.",
                "Giáo dục & Đào tạo": "Môi trường học tập chuyên nghiệp, tự tin. Ánh sáng ban ngày sạch sẽ (Bright daylight) truyền tải sự rõ ràng, tri thức. Tông màu khơi gợi năng lượng tích cực, trí tuệ.",
                "Sức khỏe & Y tế": "Phong cách thiết kế sạch sẽ, vô trùng (Clinical clean aesthetics) nhưng toát lên sự tận tâm êm dịu. Tông màu nhạt dễ chịu, ánh sáng khuếch tán mềm mại tạo sự an tâm tuyệt đối.",
                "Nội thất & Gia dụng": "Nhiếp ảnh sản phẩm phong cách sống (Lifestyle interior). Bài bài trí ấm cúng, tỉ mỉ, đánh sáng tự nhiên từ cửa sổ tạo bóng nghệ thuật. Không gian sống đẳng cấp, cân bằng.",
                "Du lịch & Khách sạn": "Cảnh quan kỳ vĩ, bao la. Bầu trời và màu sắc thiên nhiên được tăng cường (Vivid enhancement). Ánh sáng rực rỡ của khu nghỉ dưỡng hạng sang hoặc phong vị phiêu lưu mãn nhãn.",
                "Sự kiện & Giải trí": "Không khí sôi động náo nhiệt, ánh sáng sân khấu cường độ cao (concert stage lighting, laser, neon spotlight). Cảm giác bùng nổ, đông đúc nhộn nhịp, góc máy hoành tráng năng động.",
                "Tổng hợp": "Bố cục nghệ thuật sáng tạo mạnh, tối ưu thị giác toàn diện làm bật lên thông điệp chính một cách chuyên nghiệp."
            };

            const specificIndustryDesc = data.industry && industryPrompts[data.industry]
                ? `\n                7. ĐẶC TRƯNG NGÀNH (${data.industry.toUpperCase()}): ${industryPrompts[data.industry]}`
                : "";

            const hasProduct = validProdBase64List.length > 0;
            const hasModel = !!modelBase64;
            const isMultiProduct = validProdBase64List.length > 1;

            let integrationInstruction = "";
            if (hasProduct && !hasModel) {
                const prodInstruction = isMultiProduct
                    ? `CHIẾN LƯỢC BỘ SƯU TẬP SẢN PHẨM: Xử lý nhóm sản phẩm như một bộ sưu tập cao cấp. Sắp xếp chúng trong một bố cục cân xứng (chồng chéo, lồng ghép hoặc so le) để thể hiện sự đa dạng nhưng vẫn giữ chung một điểm nhấn cốt lõi.`
                    : `CHIẾN LƯỢC SẢN PHẨM ĐƠN LẺ: Xử lý sản phẩm như một trung tâm cao cấp trong một buổi chụp hình thương mại chất lượng cao.`;

                integrationInstruction = `
                    1. ${prodInstruction}
                    2. BẢN THIẾT KẾ BỐ CỤC: Tuân thủ nghiêm ngặt sự sắp xếp không gian, bố cục và trọng lượng thị giác của hình ảnh THAM KHẢO. Nếu hình tham khảo đặt trọng tâm bên trái, bạn hãy đặt ở bên trái.
                    3. SỰ HIỆN DIỆN CHUNG: Bạn PHẢI hiển thị TẤT CẢ các sản phẩm được cung cấp trong các hình ảnh nguồn trong một bố cục duy nhất này. Tạo một bức ảnh nhóm cao cấp.
                    4. ĐỘ CHÍNH XÁC CỦA SẢN PHẨM: Đảm bảo độ trung thực tuyệt đối với thiết kế, logo và hình dáng của từng sản phẩm. Giữ nguyên từng chi tiết nhỏ và ánh phản xạ của vật liệu.
                    5. SỰ HÀI HÒA CỦA BỐI CẢNH: Tạo một môi trường 3D với ánh sáng toàn cục, nơi tất cả các sản phẩm tương tác thực tế với ánh sáng và bóng đổ, mô phỏng ánh sáng và chiều sâu của hình ảnh THAM KHẢO.
                `;
            } else if (!hasProduct && hasModel) {
                integrationInstruction = `
                    1. CHIẾN LƯỢC ĐẠI SỨ THƯƠNG HIỆU: Người mẫu là gương mặt đại diện của thương hiệu. Tập trung vào tính thẩm mỹ biên tập thời trang cao cấp.
                    2. KHÓA ĐẶC ĐIỂM SINH TRẮC HỌC: KHÔNG ĐƯỢC THAY ĐỔI KHUÔN MẶT gốc. Danh tính phải khớp 100% với hình ảnh NGƯỜI MẪU. Kết cấu da phải chân thực, sử dụng các kỹ thuật chỉnh sửa cao cấp.
                    3. TÍCH HỢP STUDIO: Đặt người mẫu vào một môi trường điện ảnh, sử dụng ánh sáng ven và độ sâu trường ảnh lấy cảm hứng từ hình ảnh THAM KHẢO.
                `;
            } else if (hasProduct && hasModel) {
                const prodInstruction = isMultiProduct
                    ? `bộ sưu tập sản phẩm và người mẫu để kể một câu chuyện thương hiệu gắn kết. Giữ các sản phẩm ở gần hoặc được tương tác với người mẫu một cách tự nhiên.`
                    : `sản phẩm và người mẫu để kể một câu chuyện thương hiệu gắn kết.`;

                integrationInstruction = `
                    1. CHIẾN LƯỢC QUẢNG CÁO PHONG CÁCH SỐNG: Kết hợp một cách đầy nghệ thuật giữa ${prodInstruction}
                    2. BẢN THIẾT KẾ BỐ CỤC: Coi hình ảnh THAM KHẢO như một hướng dẫn bố cục nghiêm ngặt. Phản chiếu lại chính xác vị trí, góc nhìn và thành phần của các đối tượng (người mẫu, sản phẩm, văn bản) được hiển thị trong ảnh tham khảo.
                    3. SỰ HIỆN DIỆN CHUNG: Đảm bảo người mẫu và MỌI sản phẩm được cung cấp xuất hiện cùng nhau trong cùng một khung hình ảnh.
                    4. ĐỘ CHÍNH XÁC CỦA ĐỐI TƯỢNG: 
                       - SẢN PHẨM: Bản sao chính xác về hình dáng và nhãn hiệu cho từng mặt hàng.
                       - KHUÔN MẶT NGƯỜI MẪU: Giữ hoàn hảo các đặc điểm khuôn mặt và danh tính gốc.
                    5. SỰ TƯƠNG TÁC ĐIỆN ẢNH: Thiết lập sự liên kết cảm xúc tự nhiên giữa người mẫu và các sản phẩm.
                    6. THIẾT KẾ KHÔNG GIAN: Sử dụng hệ thống phân cấp tầng hình ảnh nâng cao, sắp xếp các đối tượng theo bố cục THAM KHẢO với kỹ thuật đổ bóng bao quanh chân thực.
                `;
            } else {
                integrationInstruction = "Tạo một banner theo chủ đề nghệ thuật và cao cấp, tập trung vào thiết lập bố cục không gian trừu tượng nhưng chuyên nghiệp.";
            }

            const megaPrompt = `
                VAI TRÒ: Giám đốc Nghệ thuật & Nhà thiết kế Thương mại Đẳng Cấp Thế Giới.
                NHIỆM VỤ: Tổng hợp một quảng cáo kiệt tác cho thương hiệu "${effectiveCompanyName}" và sản phẩm/sự kiện "${effectiveProductName}" bằng cách sử dụng hình ảnh THAM KHẢO làm BẢN THIẾT KẾ BỐ CỤC nghiêm ngặt.
                
                HƯỚNG DẪN NGHỆ THUẬT:
                1. SAO CHÉP BỐ CỤC VẬT LÝ: Phân tích hình ảnh THAM KHẢO một cách nghiêm túc như một bản thiết kế cấu trúc. Nhận thức vị trí không gian của tất cả các đối tượng chính, họa tiết nền và các khối văn bản để làm chuẩn mực.
                2. LOẠI BỎ LOGO & VĂN BẢN (NGOẠI TRỪ LOGO CHÚNG TÔI CUNG CẤP NẾU CÓ): TUYỆT ĐỐI BỎ QUA và LOẠI TRỪ bất kỳ tên, logo cũ, slogan hoặc số điện thoại hiện có nào được tìm thấy trong hình ảnh THAM KHẢO. Hãy sử dụng logo mới được cung cấp (nếu có) và dữ liệu DNA THƯƠNG HIỆU được quy định.
                3. ĐỘ CHÍNH XÁC CỦA KIỂU CHỮ: Mô phỏng lại độ dày (đậm/mảnh), kiểu (có chân/không chân) và thiết lập bảng màu của kiểu chữ được tìm thấy trong ảnh THAM KHẢO để đặt các dòng chữ của chúng ta: Tên Công ty: "${effectiveCompanyName}", Tiêu đề chính/Tên sản phẩm: "${effectiveProductName}", Thông điệp: "${data.slogan}", Ưu đãi/Giá/Thời gian: "${data.price}", và Chi tiết: "${data.details}".
                4. ÁNH SÁNG & BẦU KHÔNG KHÍ: Áp dụng sắc thái ánh sáng (bóng đổ sâu, ánh sáng lan tỏa hay ánh sáng ven viền) và màu sắc từ hình ảnh THAM KHẢO. Phối hợp với: ${data.style === 'phong cách thiên nhiên' ? 'Ánh nắng mặt trời tự nhiên, mềm mại, bokeh điện ảnh' : styleDesc}.
                5. CHẤT CẢM VẬT LÝ: Sử dụng kết cấu siêu thực — độ bóng kim loại, sự đan xen của vải mềm mại, hoặc các bề mặt siêu mịn. Sử dụng tiêu chuẩn độ phân giải 8k.
                ${integrationInstruction}
                6. HẬU KỲ: Áp dụng phân loại màu điện ảnh, lấy nét sắc nét vào đối tượng chính và retouch quảng cáo chuyên nghiệp.${specificIndustryDesc}
                
                DNA THƯƠNG HIỆU (YÊU CẦU CHỈ ĐƯỢC PHÉP SỬ DỤNG VĂN BẢN SAU):
                - Tên Công ty / Thương hiệu: "${effectiveCompanyName}"
                - Tên Sản phẩm / Tiêu đề Sự kiện: "${effectiveProductName}"
                - Thông điệp chính: "${data.slogan}"
                - Giá / Thời gian / Ưu đãi: "${data.price}"
                - Chi tiết phụ trợ: "${data.details}"
            `;

            const enhanceModel = this.base.genAI!.getGenerativeModel({ model: "gemini-2.0-flash" });

            let promptParts: any[] = [
                {
                    text: `Dịch và Viết lại thành một Lời nhắc (Prompt) tiếng Anh thật chi tiết, có chiều sâu về khả năng render và tạo ảnh AI xuất sắc dựa vào định hướng nghệ thuật sau: ${megaPrompt}.
                TRỌNG TÂM: Tập trung vào từ vựng nhiếp ảnh, mô tả vật liệu (textures), ánh sáng, và cấu trúc không gian hình học.
                QUAN TRỌNG: TUYỆT ĐỐI đảm bảo quy tắc "BẢO TỒN HOÀN TOÀN ĐỐI TƯỢNG", SAO CHÉP Y HỆT 100% KHUÔM MẶT người mẫu (Face Identity, Facial Features) và sản phẩm, CẤM tuyệt đối không được tự ý vẽ AI ra khuôn mặt người khác.
                QUY TẮC BẮT BUỘC VỀ TỶ LỆ: Bạn PHẢI chèn cụm từ mô tả kích thước tương ứng với ${data.aspectRatio} vào ngay đoạn đầu của Prompt Tiếng Anh (Ví dụ: "widescreen 16:9 aspect ratio" hoặc "vertical 9:16 portrait ratio").
                YÊU CẦU ĐẦU RA: Chỉ xả ra đoạn Text duy nhất chứa Prompt bằng tiếng Anh, không thêm metadata hay nói chuyện, max 160 words.`
                }
            ];

            if (validProdBase64List.length > 0) {
                validProdBase64List.forEach(base64 => {
                    promptParts.push({ inlineData: { data: base64, mimeType: "image/jpeg" } });
                });
            }
            if (refBase64) promptParts.push({ inlineData: { data: refBase64, mimeType: "image/jpeg" } });
            if (modelBase64) promptParts.push({ inlineData: { data: modelBase64, mimeType: "image/jpeg" } });
            if (logoBase64) promptParts.push({ inlineData: { data: logoBase64, mimeType: "image/png" } });

            let finalPrompt = "";
            try {
                const resultEnhance = await enhanceModel.generateContent(promptParts);
                finalPrompt = resultEnhance.response.text().replace(/[*"`]/g, '').trim();
                this.logger.log('--- [Smart Banner] Enhanced Prompt Generated ---');
            } catch (err) {
                this.logger.warn("Prompt enhancement failed, using fallback: " + err.message);
                finalPrompt = `Professional commercial banner for ${effectiveCompanyName} and ${effectiveProductName}. ${styleDesc}, inspired by reference, preserve original assets. High quality rendering, cinematic lighting. Aspect Ratio: ${data.aspectRatio}.`;
            }

            const imageModels = ['gemini-3.1-flash-image-preview', 'gemini-2.1-flash-image', 'gemini-2.0-flash'];
            let lastErrorMessage = "";

            for (const modelName of imageModels) {
                for (let attempt = 1; attempt <= 2; attempt++) {
                    try {
                        this.logger.log(`--- Trying Model: ${modelName} (Attempt ${attempt}) ---`);
                        const imgModel = this.base.genAI!.getGenerativeModel({ model: modelName });
                        const finalParts: any[] = [{ text: finalPrompt }];

                        if (validProdBase64List.length > 0) {
                            validProdBase64List.forEach(base64 => {
                                finalParts.push({ inlineData: { data: base64, mimeType: "image/jpeg" } });
                            });
                        }
                        if (refBase64) finalParts.push({ inlineData: { data: refBase64, mimeType: "image/jpeg" } });
                        if (modelBase64) finalParts.push({ inlineData: { data: modelBase64, mimeType: "image/jpeg" } });
                        if (logoBase64) finalParts.push({ inlineData: { data: logoBase64, mimeType: "image/png" } });

                        let reinforcement = ` - KHOÁ TỈ LỆ KHUNG: Yêu cầu áp dụng tỉ lệ ${data.aspectRatio}. (CRITICAL: Output image MUST be in ${data.aspectRatio} widescreen/portrait format).
- PHẢN CHIẾU CẤU TRÚC BỐ CỤC: Hình ảnh THAM KHẢO được xem như bộ khung xương. BẠN PHẢI bám sát vị trí, lưới (grid) và tỉ lệ của ảnh tham khảo.
- ĐÀO THẢI SAO CHÉP: BỎ QUA HOÀN TOÀN và XÓA SẠCH MỌI thương hiệu, văn bản, text cũ có sẵn trong ảnh tham khảo ra khỏi hình ảnh mới.
- BƠM VĂN BẢN MỚI${logoBase64 ? ' VÀ LOGO' : ''}: Thay thế vị trí logo cũ bằng logo chúng tôi cung cấp. Chỉ thêm các đoạn text sau: "${effectiveCompanyName}", "${effectiveProductName}", "${data.slogan}", "${data.price}", "${data.details}" vào những vùng mà ảnh mẫu chứa text. 
- SỰ LIÊN KẾT: Tích hợp đầy đủ ${validProdBase64List.length} sản phẩm cung cấp.
- ĐỘ TRUNG THỰC KHUÔM MẶT: Đặt lệnh ưu tiên cao nhất (HIGH PRIORITY). BẮT BUỘC phân tích và KIẾN TRÚC LẠI 100% NHẬN DẠNG KHUÔM MẶT (Face Identity), đường nét, thần thái của người mẫu gốc được tải lên. KHÔNG ĐƯỢC PHÉP THAY ĐỔI hay tự vẽ ra người mẫu khác.
- ĐỘ TRUNG THỰC SẢN PHẨM: Cấm thay đổi màu sắc hay biến dạng tỷ lệ của Sản phẩm${logoBase64 ? ' / Logo' : ''}. `;

                        finalParts.push({ text: `[SYSTEM: CRITICAL INSTRUCTION - SET IMAGE DIMENSIONS TO ${data.aspectRatio} ASPECT RATIO. DO NOT OUTPUT SQUARE 1:1 IMAGE.]\n` + reinforcement + " CLONE THE REFERENCE LAYOUT BUT ERASE ALL ITS ORIGINAL CONTENT." });

                        const ratioKeyword = data.aspectRatio === '16:9' ? 'Wide Cinematic Landscape (16:9)' : data.aspectRatio === '9:16' ? 'Ultra-Tall Vertical Portrait (9:16)' : `Standard Square (1:1)`;
                        const result = await imgModel.generateContent({
                            contents: [{
                                role: 'user', parts: [
                                    { text: `[CRITICAL: OUTPUT MUST BE ${ratioKeyword}. DO NOT USE 1:1 SQUARE.]` },
                                    ...finalParts,
                                    { text: `[FINAL COMMAND: RENDER IMAGE IN ${data.aspectRatio} ${ratioKeyword} ONLY. IGNORE ALL SQUARE INPUTS.]` }
                                ]
                            }],
                            generationConfig: {
                                temperature: 0.7,
                                topP: 0.8,
                                topK: 40
                            }
                        });

                        const imagePart = result.response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
                        if (imagePart?.inlineData) {
                            const storageUrl = await this.uploadBase64ToStorage(imagePart.inlineData.data, imagePart.inlineData.mimeType || 'image/jpeg', userId, data.aspectRatio);
                            return { url: storageUrl };
                        }
                    } catch (err) {
                        lastErrorMessage = err.message || "Lỗi không xác định";
                        if (attempt === 1 && (lastErrorMessage.includes('429') || lastErrorMessage.includes('quota'))) {
                            await new Promise(r => setTimeout(r, 2000));
                            continue;
                        }
                        break;
                    }
                }
            }

            throw new Error(`Hệ thống tạo ảnh hiện không phản hồi. (Chi tiết: ${lastErrorMessage})`);

        } catch (error: any) {
            this.logger.error("Smart Banner Error:", error);
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException(error.message || 'Lỗi không xác định khi tạo banner.');
        }
    }

    async getJobStatus(jobId: string): Promise<any> {
        return this.base.getJobStatus(jobId);
    }
}
