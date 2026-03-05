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
exports.LinksService = void 0;
const common_1 = require("@nestjs/common");
const admin = __importStar(require("firebase-admin"));
let LinksService = class LinksService {
    firebaseApp;
    db;
    constructor(firebaseApp) {
        this.firebaseApp = firebaseApp;
        this.db = firebaseApp.firestore();
    }
    async createShortLink(originalUrl, userId, customAlias) {
        const shortId = customAlias || Math.random().toString(36).substring(2, 8);
        if (customAlias) {
            const existing = await this.db.collection('short_links').doc(shortId).get();
            if (existing.exists) {
                throw new Error('Alias already exists');
            }
        }
        const linkData = {
            originalUrl,
            shortId,
            userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            clicks: 0,
        };
        await this.db.collection('short_links').doc(shortId).set(linkData);
        return linkData;
    }
    async getLinksByUser(userId) {
        const snapshot = await this.db.collection('short_links')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    async getOriginalUrl(shortId) {
        const doc = await this.db.collection('short_links').doc(shortId).get();
        const data = doc.data();
        if (!data) {
            return null;
        }
        this.db.collection('short_links').doc(shortId).update({
            clicks: admin.firestore.FieldValue.increment(1)
        }).catch(err => console.error('Error incrementing clicks:', err));
        this.db.collection('link_clicks').add({
            shortId,
            userId: data.userId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(err => console.error('Error logging click:', err));
        return data.originalUrl;
    }
    async deleteLink(shortId, userId) {
        const doc = await this.db.collection('short_links').doc(shortId).get();
        const data = doc.data();
        if (!doc.exists || !data || data.userId !== userId) {
            throw new Error('Unauthorized or not found');
        }
        await this.db.collection('short_links').doc(shortId).delete();
        return { success: true };
    }
    async getAnalytics(userId) {
        const linksSnapshot = await this.db.collection('short_links')
            .where('userId', '==', userId)
            .get();
        const links = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalLinks = links.length;
        const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const clicksSnapshot = await this.db.collection('link_clicks')
            .where('userId', '==', userId)
            .where('timestamp', '>=', thirtyDaysAgo)
            .orderBy('timestamp', 'asc')
            .get();
        const clicksByDate = {};
        clicksSnapshot.docs.forEach(doc => {
            const date = doc.data().timestamp?.toDate()?.toLocaleDateString('vi-VN') || 'N/A';
            clicksByDate[date] = (clicksByDate[date] || 0) + 1;
        });
        const timelineData = Object.entries(clicksByDate).map(([date, count]) => ({
            date,
            clicks: count
        }));
        const topLinks = [...links]
            .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
            .slice(0, 5)
            .map(l => ({
            shortId: l.shortId,
            originalUrl: l.originalUrl,
            clicks: l.clicks
        }));
        return {
            totalLinks,
            totalClicks,
            timelineData,
            topLinks,
            averageClicks: totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : 0
        };
    }
};
exports.LinksService = LinksService;
exports.LinksService = LinksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('FIREBASE_ADMIN')),
    __metadata("design:paramtypes", [Object])
], LinksService);
//# sourceMappingURL=links.service.js.map