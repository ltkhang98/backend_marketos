import { CustomersService } from './customers.service';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(customerData: any, req: any): Promise<any>;
    findAll(req: any): Promise<{
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
