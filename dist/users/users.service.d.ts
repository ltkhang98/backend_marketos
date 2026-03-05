import * as admin from 'firebase-admin';
export declare class UsersService {
    private auth;
    private db;
    createUser(userData: any, adminUid: string): Promise<{
        success: boolean;
        message: string;
        user: {
            uid: string;
            name: any;
            email: any;
            role: any;
            createdAt: admin.firestore.FieldValue;
            lastLogin: admin.firestore.FieldValue;
        };
    }>;
    deleteUser(uid: string, adminUid: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findOne(email: string): Promise<any | undefined>;
}
