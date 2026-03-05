import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(userData: any, req: any): Promise<{
        success: boolean;
        message: string;
        user: {
            uid: string;
            name: any;
            email: any;
            role: any;
            createdAt: FirebaseFirestore.FieldValue;
            lastLogin: FirebaseFirestore.FieldValue;
        };
    }>;
    remove(uid: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
