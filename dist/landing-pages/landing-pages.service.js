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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandingPagesService = void 0;
const common_1 = require("@nestjs/common");
const admin = __importStar(require("firebase-admin"));
let LandingPagesService = class LandingPagesService {
    firebaseApp;
    db;
    constructor(firebaseApp) {
        this.firebaseApp = firebaseApp;
        this.db = firebaseApp.firestore();
    }
    async savePage(userId, pageData) {
        const pageId = pageData.id || this.db.collection('landing_pages').doc().id;
        const data = {
            ...pageData,
            id: pageId,
            userId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: pageData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        };
        await this.db.collection('landing_pages').doc(pageId).set(data);
        return data;
    }
    async getPagesByUser(userId) {
        try {
            const snapshot = await this.db.collection('landing_pages')
                .where('userId', '==', userId)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        catch (error) {
            console.error('Error in getPagesByUser:', error);
            throw error;
        }
    }
    async getPageById(pageId) {
        const doc = await this.db.collection('landing_pages').doc(pageId).get();
        return doc.exists ? doc.data() : null;
    }
    async deletePage(pageId, userId) {
        const doc = await this.db.collection('landing_pages').doc(pageId).get();
        const data = doc.data();
        if (!doc.exists || !data || data.userId !== userId) {
            throw new Error('Unauthorized or not found');
        }
        await this.db.collection('landing_pages').doc(pageId).delete();
        return { success: true };
    }
};
exports.LandingPagesService = LandingPagesService;
exports.LandingPagesService = LandingPagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('FIREBASE_ADMIN')),
    __metadata("design:paramtypes", [Object])
], LandingPagesService);
//# sourceMappingURL=landing-pages.service.js.map