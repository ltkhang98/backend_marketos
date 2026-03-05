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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const admin = __importStar(require("firebase-admin"));
let NotificationsService = class NotificationsService {
    db = admin.firestore();
    collection = this.db.collection('notifications');
    async findAll() {
        try {
            const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Lỗi khi lấy danh sách thông báo: ' + error.message);
        }
    }
    async create(notificationData, adminUid) {
        const adminDoc = await this.db.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            throw new common_1.UnauthorizedException('Bạn không có quyền thực hiện hành động này');
        }
        try {
            const docRef = await this.collection.add({
                ...notificationData,
                createdBy: adminUid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { id: docRef.id, ...notificationData };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Lỗi khi tạo thông báo: ' + error.message);
        }
    }
    async createSystemNotification(notificationData) {
        try {
            const docRef = await this.collection.add({
                ...notificationData,
                createdBy: 'system',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { id: docRef.id, ...notificationData };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Lỗi khi tạo thông báo hệ thống: ' + error.message);
        }
    }
    async remove(id, adminUid) {
        const adminDoc = await this.db.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            throw new common_1.UnauthorizedException('Bạn không có quyền thực hiện hành động này');
        }
        try {
            await this.collection.doc(id).delete();
            return { success: true };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Lỗi khi xóa thông báo: ' + error.message);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)()
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map