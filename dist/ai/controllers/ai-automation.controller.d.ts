import { AiAutomationService } from '../services/ai-automation.service';
export declare class AiAutomationController {
    private readonly automationService;
    constructor(automationService: AiAutomationService);
    runAutomation(id: string, body: {
        isTest?: boolean;
    }, req: any): Promise<any>;
    generateLandingPage(body: {
        prompt: string;
    }, req: any): Promise<any>;
    scrapeProduct(body: {
        url: string;
    }, req: any): Promise<any>;
    marketingPlan(body: any, req: any): Promise<any>;
}
