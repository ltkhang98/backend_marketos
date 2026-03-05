import { LandingPagesService } from './landing-pages.service';
export declare class LandingPagesController {
    private readonly landingPagesService;
    constructor(landingPagesService: LandingPagesService);
    savePage(body: {
        userId: string;
        pageData: any;
    }): Promise<any>;
    getPagesByUser(userId: string): Promise<{
        id: string;
    }[]>;
    getPageById(id: string): Promise<FirebaseFirestore.DocumentData | null | undefined>;
    deletePage(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
