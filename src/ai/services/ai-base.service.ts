import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Replicate from 'replicate';
import axios from 'axios';
import { CREDIT_COSTS, DEFAULT_AI_MODELS } from '../ai.constants';

@Injectable()
export class AiBaseService implements OnModuleInit {
    public readonly logger = new Logger(AiBaseService.name);
    public firebaseAdmin: admin.app.App;
    public genAI: GoogleGenerativeAI | null = null;
    public model: any = null;
    public replicate: Replicate | null = null;
    public currentGeminiKey: string | null = null;
    public currentFptKey: string | null = null;
    public currentRapidApiKey: string | null = null;
    public currentScrapingBeeKey: string | null = null;

    public readonly CREDIT_COSTS = CREDIT_COSTS;
    public membershipConfigs: any = {};

    constructor() {
        this.firebaseAdmin = admin.apps.length ? admin.app() : admin.initializeApp();
    }

    async onModuleInit() {
        await this.syncApiKeys();
        await this.syncCreditCosts();
        await this.syncMembershipConfigs();
    }

    async syncApiKeys() {
        const db = admin.firestore();

        // 1. Mặc định lấy từ process.env
        this.currentGeminiKey = process.env.GEMINI_API_KEY || null;
        this.currentFptKey = process.env.FPT_AI_API_KEY || null;
        this.currentRapidApiKey = process.env.RAPID_API_KEY || null;
        this.currentScrapingBeeKey = process.env.SCRAPINGBEE_API_KEY || null;

        // 2. Đồng bộ từ Firestore (ưu tiên hơn nếu có)
        db.collection('settings').doc('api_keys').onSnapshot((doc) => {
            if (doc.exists) {
                const keys = doc.data();
                if (keys) {
                    if (keys.gemini) {
                        this.currentGeminiKey = keys.gemini;
                        this.genAI = new GoogleGenerativeAI(this.currentGeminiKey!);
                        this.model = this.genAI.getGenerativeModel({ model: DEFAULT_AI_MODELS.GEMINI_PRIMARY });
                    }
                    if (keys.fpt_ai) this.currentFptKey = keys.fpt_ai;
                    if (keys.replicate) this.replicate = new Replicate({ auth: keys.replicate });
                    if (keys.rapidapi) this.currentRapidApiKey = keys.rapidapi;
                    if (keys.scrapingbee) this.currentScrapingBeeKey = keys.scrapingbee;
                    
                    this.logger.log('API Keys synchronized from Firestore (including RapidAPI/ScrapingBee).');
                }
            } else {
                // Nếu Firestore không có, khởi tạo Gemini từ env
                if (this.currentGeminiKey && !this.genAI) {
                    this.genAI = new GoogleGenerativeAI(this.currentGeminiKey);
                    this.model = this.genAI.getGenerativeModel({ model: DEFAULT_AI_MODELS.GEMINI_PRIMARY });
                }
            }
        });
    }

    async syncMembershipConfigs() {
        const db = admin.firestore();
        // Lấy từ collection membership_configs để đồng bộ với Admin
        db.collection('membership_configs').onSnapshot((snapshot) => {
            const configs: any = {};
            snapshot.forEach(doc => {
                configs[doc.id] = doc.data();
            });
            this.membershipConfigs = configs;
            this.logger.log(`Membership Configs synchronized from Firestore (${Object.keys(configs).length} plans).`);
        });
    }

    async syncCreditCosts() {
        const db = admin.firestore();
        db.collection('settings').doc('credit_costs').onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data) {
                    Object.assign(this.CREDIT_COSTS, data);
                    this.logger.log('Credit costs synchronized from Firestore.');
                }
            }
        });
    }

    async deductCredits(userId: string, amount: number, description: string, featureId?: string) {
        // Skip if amount is 0 or less (though standard feature costs are positive)
        if (amount === undefined || amount === null) {
            this.logger.warn(`Amount is undefined/null for feature: ${featureId}`);
            return;
        }
        if (amount <= 0) return;

        // Check if feature is marked as FREE in dynamic CREDIT_COSTS
        const isFree = featureId ? (this.CREDIT_COSTS as any)[`${featureId}_isFree`] : false;
        const actualAmount = isFree ? 0 : amount;

        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw new BadRequestException('Không tìm thấy tài khoản (ID: ' + userId + ').');
            
            const userData = userDoc.data()!;
            const currentCredits = Number(Math.max(userData.credits || 0, userData.tokens || 0));
            const userPlan = (userData.plan || 'basic').toLowerCase();
            this.logger.log(`[DeductCredits] Final - Plan: ${userPlan}, Balance: ${currentCredits}, Feature: ${featureId}`);
            
            // 2. Check membership privileges
            let finalAmount = actualAmount;
            
            // Lấy danh sách features được miễn phí của gói này
            const planFeatures = this.membershipConfigs[userPlan]?.features || {};
            const isFeatureFreeInConfig = featureId && planFeatures[featureId] === true;
            
            // Dự phòng (Fallback): Nếu là PRO/AGENCY thì mặc định miễn phí các tính năng TikTok cơ bản nếu config Firestore thiếu
            const isFallbackFree = (userPlan === 'pro' || userPlan === 'agency') && [
                'TIKTOK_TRENDING', 'SOCIAL_CONTENT', 'VIRAL_SCRIPT', 'TIKTOK_SCRIPT', 'AUTO_SUB'
            ].includes(featureId || '');

            if (isFeatureFreeInConfig || isFallbackFree) {
                this.logger.log(`[DeductCredits] Feature ${featureId} is FREE for plan ${userPlan} (Config: ${isFeatureFreeInConfig}, Fallback: ${isFallbackFree})`);
                finalAmount = 0;
            }

            // Only enforce credit limit if not free
            if (finalAmount > 0 && currentCredits < finalAmount) {
                throw new BadRequestException(`Tài khoản ${userPlan.toUpperCase()} không đủ số dư để dùng ${featureId} (${currentCredits} < ${finalAmount} Credits).`);
            }
            
            t.update(userRef, { credits: currentCredits - finalAmount });
            const logRef = db.collection('usage_logs').doc();
            t.set(logRef, {
                userId,
                userName: userData.name || userData.displayName || 'Người dùng',
                userEmail: userData.email || '',
                amount: -finalAmount,
                tokens: finalAmount, // Lưu cả tokens để đồng bộ với FE
                type: 'usage',
                feature: description, // Lưu tên tính năng từ description
                description: finalAmount === 0 ? `${description} (Miễn phí: ${userPlan.toUpperCase()})` : description,
                featureId,
                status: 'success',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
    }

    async getJobStatus(jobId: string) {
        // Mock implementation for now, should link to actual job processor
        return { id: jobId, state: 'unknown' };
    }

    async downloadProxy(url: string) {
        return axios.get(url, { 
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
    }

    public async resolveBase64Image(imageSource: string | undefined | null): Promise<string | null> {
        if (!imageSource) return null;
        if (imageSource.includes('base64,')) return imageSource.split('base64,')[1];
        
        try {
            // Hỗ trợ đọc ảnh từ thư mục uploads cục bộ
            if (imageSource.startsWith('/uploads/')) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const filePath = path.join(process.cwd(), imageSource);
                    if (fs.existsSync(filePath)) {
                        const fileBuffer = await fs.promises.readFile(filePath);
                        return fileBuffer.toString('base64');
                    }
                } catch (localError) {
                    this.logger.warn(`Failed to read local file: ${imageSource}. Error: ${localError.message}`);
                }
            }

            // Nếu là URL của Firebase Storage thuộc dự án này, hãy tải trực tiếp qua Admin SDK để tránh lỗi 403
            if (imageSource.includes('firebasestorage.app') || imageSource.includes('firebasestorage.googleapis.com')) {
                try {
                    const bucket = admin.storage().bucket();
                    // Giải mã path từ URL (bỏ phần domain và query params)
                    const urlObj = new URL(imageSource);
                    let filePath = decodeURIComponent(urlObj.pathname);
                    
                    // Loại bỏ tên bucket nếu nó nằm trong path (thường gặp khi dùng storage.googleapis.com)
                    const bucketName = bucket.name;
                    if (filePath.startsWith(`/${bucketName}/`)) {
                        filePath = filePath.replace(`/${bucketName}/`, '');
                    } else if (filePath.startsWith('/')) {
                        filePath = filePath.substring(1);
                    }

                    const [fileBuffer] = await bucket.file(filePath).download();
                    return fileBuffer.toString('base64');
                } catch (fsError) {
                    this.logger.warn(`Failed to download directly from Firebase Storage: ${fsError.message}. Falling back to axios.`);
                }
            }

            const response = await axios.get(imageSource, { 
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                }
            });
            return Buffer.from(response.data).toString('base64');
        } catch (error) {
            this.logger.error(`Error resolving image to base64 (${imageSource}): ${error.message}`);
            return null;
        }
    }

    public async getMembershipConfigs() {
        if (Object.keys(this.membershipConfigs).length > 0) return this.membershipConfigs;
        
        const db = admin.firestore();
        const snapshot = await db.collection('membership_configs').get();
        const configs: any = {};
        snapshot.forEach(doc => {
            configs[doc.id] = doc.data();
        });
        return configs;
    }
}
