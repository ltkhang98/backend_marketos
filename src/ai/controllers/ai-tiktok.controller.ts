import { Controller, Post, Body, UseGuards, Get, Query, Req, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { AiTikTokService } from '../services/ai-tiktok.service';
import { FirebaseGuard } from '../../auth/firebase.guard';

@Controller('ai/tiktok')
export class AiTikTokController {
    constructor(private readonly tiktokService: AiTikTokService) { }

    @UseGuards(FirebaseGuard)
    @Post('analytics')
    async tiktokAnalytics(@Body() body: { uniqueId: string }, @Req() req: any) {
        return this.tiktokService.analyzeTikTokChannel(body.uniqueId, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-script')
    async tiktokGenerateScript(@Body() body: { uniqueId: string; niche: string }, @Req() req: any) {
        return this.tiktokService.generateTikTokVideoScript(body.uniqueId, body.niche, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-video-script') // Support both if needed, but standardize to generate-script
    async generateVideoScript(@Body() body: { uniqueId: string; niche: string }, @Req() req: any) {
        return this.tiktokService.generateTikTokVideoScript(body.uniqueId, body.niche, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Get('trending')
    async tiktokTrending(
        @Query('region') region: string,
        @Query('count') count: any,
        @Query('category') category: string | undefined,
        @Query('refresh') refresh: any,
        @Req() req: any
    ) {
        try {
            const countNum = parseInt(count?.toString() || '50', 10);
            const isRefresh = (refresh === 'true' || refresh === true);

            return await this.tiktokService.getTikTokTrending(
                region || 'VN', 
                countNum, 
                isRefresh, 
                category, 
                req.user.uid
            );
        } catch (error: any) {
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException('Lỗi khi lấy dữ liệu TikTok: ' + error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('download')
    async tiktokDownload(@Body() body: { url: string }, @Req() req: any) {
        return this.tiktokService.downloadTikTokVideo(body.url, req.user.uid);
    }
}
