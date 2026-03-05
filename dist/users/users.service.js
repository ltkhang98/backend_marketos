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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const admin = __importStar(require("firebase-admin"));
let UsersService = class UsersService {
    auth = admin.auth();
    db = admin.firestore();
    async createUser(userData, adminUid) {
        const adminDoc = await this.db.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            throw new common_1.UnauthorizedException('Bạn không có quyền thực hiện hành động này');
        }
        const { email, password, name, role } = userData;
        try {
            const userRecord = await this.auth.createUser({
                email,
                password,
                displayName: name,
            });
            const userProfile = {
                uid: userRecord.uid,
                name,
                email,
                role: role || 'user',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastLogin: admin.firestore.FieldValue.serverTimestamp(),
            };
            await this.db.collection('users').doc(userRecord.uid).set(userProfile);
            return {
                success: true,
                message: 'Đã tạo tài khoản thành công',
                user: userProfile
            };
        }
        catch (error) {
            if (error.code === 'auth/email-already-exists') {
                throw new common_1.ConflictException('Email này đã được sử dụng');
            }
            throw new common_1.InternalServerErrorException('Lỗi khi tạo người dùng: ' + error.message);
        }
    }
    async deleteUser(uid, adminUid) {
        const adminDoc = await this.db.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            throw new common_1.UnauthorizedException('Bạn không có quyền thực hiện hành động này');
        }
        try {
            await this.auth.deleteUser(uid);
            await this.db.collection('users').doc(uid).delete();
            return { success: true, message: 'Đã xóa tài khoản thành công từ Auth và Firestore' };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Lỗi khi xóa người dùng: ' + error.message);
        }
    }
    async findOne(email) {
        const snapshot = await this.db.collection('users').where('email', '==', email).limit(1).get();
        if (snapshot.empty)
            return undefined;
        return { ...snapshot.docs[0].data() };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map