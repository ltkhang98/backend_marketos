export declare class CustomersService {
    private db;
    private collection;
    create(customerData: any, userId: string): Promise<any>;
    findAll(userId: string): Promise<{
        id: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
    } | null>;
    update(id: string, customerData: any): Promise<{
        id: string;
    } | null>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
