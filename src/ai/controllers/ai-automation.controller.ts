import { Controller, Post, Body, UseGuards, Req, InternalServerErrorException, Param } from '@nestjs/common';
import { AiAutomationService } from '../services/ai-automation.service';
import { FirebaseGuard } from '../../auth/firebase.guard';

@Controller('ai/automation')
export class AiAutomationController {
    constructor(private readonly automationService: AiAutomationService) { }

    @UseGuards(FirebaseGuard)
    @Post('run/:id')
    async runAutomation(@Param('id') id: string, @Body() body: { isTest?: boolean }, @Req() req: any) {
        return this.automationService.runAutomationById(id, req.user.uid, body.isTest === true);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-landing-page')
    async generateLandingPage(@Body() body: { prompt: string }, @Req() req: any) {
        return this.automationService.generateLandingPage(body.prompt, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('scrape-product')
    async scrapeProduct(@Body() body: { url: string }, @Req() req: any) {
        return this.automationService.scrapeProductData(body.url, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('marketing-plan')
    async marketingPlan(@Body() body: any, @Req() req: any) {
        return this.automationService.generateMarketingPlan(body, req.user.uid);
    }
}
