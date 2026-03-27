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
var AiBaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiBaseService = void 0;
const common_1 = require("@nestjs/common");
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const replicate_1 = __importDefault(require("replicate"));
const axios_1 = __importDefault(require("axios"));
const ai_constants_1 = require("../ai.constants");
let AiBaseService = AiBaseService_1 = class AiBaseService {
    logger = new common_1.Logger(AiBaseService_1.name);
    firebaseAdmin;
    genAI = null;
    model = null;
    replicate = null;
    currentGeminiKey = null;
    currentFptKey = null;
    currentRapidApiKey = null;
    currentScrapingBeeKey = null;
    CREDIT_COSTS = ai_constants_1.CREDIT_COSTS;
    membershipConfigs = {};
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
        this.currentGeminiKey = process.env.GEMINI_API_KEY || null;
        this.currentFptKey = process.env.FPT_AI_API_KEY || null;
        this.currentRapidApiKey = process.env.RAPID_API_KEY || null;
        this.currentScrapingBeeKey = process.env.SCRAPINGBEE_API_KEY || null;
        db.collection('settings').doc('api_keys').onSnapshot((doc) => {
            if (doc.exists) {
                const keys = doc.data();
                if (keys) {
                    if (keys.gemini) {
                        this.currentGeminiKey = keys.gemini;
                        this.genAI = new generative_ai_1.GoogleGenerativeAI(this.currentGeminiKey);
                        this.model = this.genAI.getGenerativeModel({ model: ai_constants_1.DEFAULT_AI_MODELS.GEMINI_PRIMARY });
                    }
                    if (keys.fpt_ai)
                        this.currentFptKey = keys.fpt_ai;
                    if (keys.replicate)
                        this.replicate = new replicate_1.default({ auth: keys.replicate });
                    if (keys.rapidapi)
                        this.currentRapidApiKey = keys.rapidapi;
                    if (keys.scrapingbee)
                        this.currentScrapingBeeKey = keys.scrapingbee;
                    this.logger.log('API Keys synchronized from Firestore (including RapidAPI/ScrapingBee).');
                }
            }
            else {
                if (this.currentGeminiKey && !this.genAI) {
                    this.genAI = new generative_ai_1.GoogleGenerativeAI(this.currentGeminiKey);
                    this.model = this.genAI.getGenerativeModel({ model: ai_constants_1.DEFAULT_AI_MODELS.GEMINI_PRIMARY });
                }
            }
        });
    }
    async syncMembershipConfigs() {
        const db = admin.firestore();
        db.collection('membership_configs').onSnapshot((snapshot) => {
            const configs = {};
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
    async deductCredits(userId, amount, description, featureId) {
        if (amount === undefined || amount === null) {
            this.logger.warn(`Amount is undefined/null for feature: ${featureId}`);
            return;
        }
        if (amount <= 0)
            return;
        const isFree = featureId ? this.CREDIT_COSTS[`${featureId}_isFree`] : false;
        const actualAmount = isFree ? 0 : amount;
        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists)
                throw new common_1.BadRequestException('Không tìm thấy tài khoản (ID: ' + userId + ').');
            const userData = userDoc.data();
            const currentCredits = Number(Math.max(userData.credits || 0, userData.tokens || 0));
            const userPlan = (userData.plan || 'basic').toLowerCase();
            this.logger.log(`[DeductCredits] Final - Plan: ${userPlan}, Balance: ${currentCredits}, Feature: ${featureId}`);
            let finalAmount = actualAmount;
            const planFeatures = this.membershipConfigs[userPlan]?.features || {};
            const isFeatureFreeInConfig = featureId && planFeatures[featureId] === true;
            const isFallbackFree = (userPlan === 'pro' || userPlan === 'agency') && [
                'TIKTOK_TRENDING', 'SOCIAL_CONTENT', 'VIRAL_SCRIPT', 'TIKTOK_SCRIPT', 'AUTO_SUB'
            ].includes(featureId || '');
            if (isFeatureFreeInConfig || isFallbackFree) {
                this.logger.log(`[DeductCredits] Feature ${featureId} is FREE for plan ${userPlan} (Config: ${isFeatureFreeInConfig}, Fallback: ${isFallbackFree})`);
                finalAmount = 0;
            }
            if (finalAmount > 0 && currentCredits < finalAmount) {
                throw new common_1.BadRequestException(`Tài khoản ${userPlan.toUpperCase()} không đủ số dư để dùng ${featureId} (${currentCredits} < ${finalAmount} Credits).`);
            }
            t.update(userRef, { credits: currentCredits - finalAmount });
            const logRef = db.collection('usage_logs').doc();
            t.set(logRef, {
                userId,
                userName: userData.name || userData.displayName || 'Người dùng',
                userEmail: userData.email || '',
                amount: -finalAmount,
                tokens: finalAmount,
                type: 'usage',
                feature: description,
                description: finalAmount === 0 ? `${description} (Miễn phí: ${userPlan.toUpperCase()})` : description,
                featureId,
                status: 'success',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
    }
    async getJobStatus(jobId) {
        return { id: jobId, state: 'unknown' };
    }
    async downloadProxy(url) {
        return axios_1.default.get(url, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
    }
    async resolveBase64Image(imageSource) {
        if (!imageSource)
            return null;
        if (imageSource.includes('base64,'))
            return imageSource.split('base64,')[1];
        try {
            if (imageSource.startsWith('/uploads/')) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const filePath = path.join(process.cwd(), imageSource);
                    if (fs.existsSync(filePath)) {
                        const fileBuffer = await fs.promises.readFile(filePath);
                        return fileBuffer.toString('base64');
                    }
                }
                catch (localError) {
                    this.logger.warn(`Failed to read local file: ${imageSource}. Error: ${localError.message}`);
                }
            }
            if (imageSource.includes('firebasestorage.app') || imageSource.includes('firebasestorage.googleapis.com')) {
                try {
                    const bucket = admin.storage().bucket();
                    const urlObj = new URL(imageSource);
                    let filePath = decodeURIComponent(urlObj.pathname);
                    const bucketName = bucket.name;
                    if (filePath.startsWith(`/${bucketName}/`)) {
                        filePath = filePath.replace(`/${bucketName}/`, '');
                    }
                    else if (filePath.startsWith('/')) {
                        filePath = filePath.substring(1);
                    }
                    const [fileBuffer] = await bucket.file(filePath).download();
                    return fileBuffer.toString('base64');
                }
                catch (fsError) {
                    this.logger.warn(`Failed to download directly from Firebase Storage: ${fsError.message}. Falling back to axios.`);
                }
            }
            const response = await axios_1.default.get(imageSource, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                }
            });
            return Buffer.from(response.data).toString('base64');
        }
        catch (error) {
            this.logger.error(`Error resolving image to base64 (${imageSource}): ${error.message}`);
            return null;
        }
    }
    async getMembershipConfigs() {
        if (Object.keys(this.membershipConfigs).length > 0)
            return this.membershipConfigs;
        const db = admin.firestore();
        const snapshot = await db.collection('membership_configs').get();
        const configs = {};
        snapshot.forEach(doc => {
            configs[doc.id] = doc.data();
        });
        return configs;
    }
};
exports.AiBaseService = AiBaseService;
exports.AiBaseService = AiBaseService = AiBaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiBaseService);
//# sourceMappingURL=ai-base.service.js.map