import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
    private db = admin.firestore();
    private collection = this.db.collection('notifications');

    async findAll() {
        try {
            const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi lấy danh sách thông báo: ' + error.message);
        }
    }

    async create(notificationData: any, adminUid: string) {
        // Verify Admin role
        const adminDoc = await this.db.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            throw new UnauthorizedException('Bạn không có quyền thực hiện hành động này');
        }

        try {
            const docRef = await this.collection.add({
                ...notificationData,
                createdBy: adminUid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { id: docRef.id, ...notificationData };
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi tạo thông báo: ' + error.message);
        }
    }

    async createSystemNotification(notificationData: any) {
        try {
            const docRef = await this.collection.add({
                ...notificationData,
                createdBy: 'system',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { id: docRef.id, ...notificationData };
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi tạo thông báo hệ thống: ' + error.message);
        }
    }

    async remove(id: string, adminUid: string) {
        // Verify Admin role
        const adminDoc = await this.db.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            throw new UnauthorizedException('Bạn không có quyền thực hiện hành động này');
        }

        try {
            await this.collection.doc(id).delete();
            return { success: true };
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi xóa thông báo: ' + error.message);
        }
    }
}
