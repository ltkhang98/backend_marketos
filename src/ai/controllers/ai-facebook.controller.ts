import { Controller, Post, Body, UseGuards, Get, Req, InternalServerErrorException, Query } from '@nestjs/common';
import { AiFacebookService } from '../services/ai-facebook.service';
import { FirebaseGuard } from '../../auth/firebase.guard';

@Controller('ai/facebook')
export class AiFacebookController {
    constructor(private readonly facebookService: AiFacebookService) { }

    @UseGuards(FirebaseGuard)
    @Post('generate-content')
    async generateContent(@Body() body: any, @Req() req: any) {
        return this.facebookService.generateSocialContent(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('ad-analysis')
    async fbAdAnalysis(@Body() body: { url: string }, @Req() req: any) {
        return this.facebookService.analyzeFacebookAd(body.url, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Get('ad-analysis-history')
    async getAdsAnalysisHistory(@Req() req: any) {
        return this.facebookService.getAdsAnalysisHistory(req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('ad-comparison')
    async fbAdComparison(@Body() body: { analysisA: any, analysisB: any }, @Req() req: any) {
        return this.facebookService.compareAds(body.analysisA, body.analysisB, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('fetch-social-content')
    async fetchSocialContent(@Body() body: { url: string }, @Req() req: any) {
        return this.facebookService.fetchContentFromUrl(body.url, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('discovery-keyword')
    async discoveryKeyword(@Body() body: { keyword: string }, @Req() req: any) {
        return this.facebookService.searchKeywordDiscovery(body.keyword, 0, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('keyword-detail')
    async getKeywordDetail(@Body('keyword') keyword: string, @Req() req: any) {
        return this.facebookService.getKeywordDetail(keyword, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('trending-keywords')
    async getTrendingKeywords(@Body() body: { category: string, type: string }, @Req() req: any) {
        return this.facebookService.getTrendingKeywords(body.category, req.user.uid, body.type);
    }

    @UseGuards(FirebaseGuard)
    @Post('evaluate-improve-content') // Standardized
    async evaluateContent(@Body() body: { content: string, platform: string }, @Req() req: any) {
        return this.facebookService.evaluateAndImproveContent(body.content, body.platform, req.user.uid);
    }
}
