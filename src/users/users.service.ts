import { Injectable, InternalServerErrorException, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
    private auth = admin.auth();
    private db = admin.firestore();

    async createUser(userData: any, adminUid: string) {
        // 1. Kiểm tra quyền Admin
        const adminDoc = await this.db.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            throw new UnauthorizedException('Bạn không có quyền thực hiện hành động này');
        }

        const { email, password, name, role } = userData;

        try {
            // 2. Tạo User trong Firebase Authentication
            const userRecord = await this.auth.createUser({
                email,
                password,
                displayName: name,
            });

            // 3. Lưu thông tin bổ sung vào Firestore
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
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                throw new ConflictException('Email này đã được sử dụng');
            }
            throw new InternalServerErrorException('Lỗi khi tạo người dùng: ' + error.message);
        }
    }

    async deleteUser(uid: string, adminUid: string) {
        const adminDoc = await this.db.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            throw new UnauthorizedException('Bạn không có quyền thực hiện hành động này');
        }

        try {
            await this.auth.deleteUser(uid);
            await this.db.collection('users').doc(uid).delete();
            return { success: true, message: 'Đã xóa tài khoản thành công từ Auth và Firestore' };
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi xóa người dùng: ' + error.message);
        }
    }

    async findOne(email: string): Promise<any | undefined> {
        const snapshot = await this.db.collection('users').where('email', '==', email).limit(1).get();
        if (snapshot.empty) return undefined;
        return { ...snapshot.docs[0].data() };
    }
}
