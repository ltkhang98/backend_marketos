import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class CustomersService {
    private db = admin.firestore();
    private collection = this.db.collection('customers');

    async create(customerData: any, userId: string) {
        try {
            const docRef = await this.collection.add({
                ...customerData,
                createdBy: userId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { id: docRef.id, ...customerData };
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi tạo khách hàng: ' + error.message);
        }
    }

    async findAll(userId: string) {
        try {
            const snapshot = await this.collection.where('createdBy', '==', userId).orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi lấy danh sách khách hàng: ' + error.message);
        }
    }

    async findOne(id: string) {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    }

    async update(id: string, customerData: any) {
        await this.collection.doc(id).update({
            ...customerData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return this.findOne(id);
    }

    async remove(id: string) {
        await this.collection.doc(id).delete();
        return { success: true };
    }
}
