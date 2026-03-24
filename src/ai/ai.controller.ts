import { Controller, Post, Body, UseGuards, Get, Query, Res, Req, InternalServerErrorException, UseInterceptors, UploadedFile, Param, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { FirebaseGuard } from '../auth/firebase.guard';
import type { Response } from 'express';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @UseGuards(FirebaseGuard)
    @Post('generate-social-content')
    async generateSocialContent(@Body() body: any, @Req() req: any) {
        return this.aiService.generateContent(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('text-to-speech')
    async textToSpeech(@Body() body: { text: string; voice: string; speed: number }, @Req() req: any) {
        return this.aiService.generateSpeech(body, req.user.uid);
    }

    @Get('download')
    async download(
        @Query('url') url: string,
        @Query('filename') filename: string,
        @Res() res: Response
    ) {
        try {
            const streamResponse = await this.aiService.downloadProxy(url);

            // Forward các header quan trọng từ nguồn
            const contentType = streamResponse.headers['content-type'] || 'application/octet-stream';
            const contentLength = streamResponse.headers['content-length'];

            const headers: any = {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename || 'marketos-download'}"`,
            };

            if (contentLength) {
                headers['Content-Length'] = contentLength;
            }

            res.set(headers);
            streamResponse.data.pipe(res);
        } catch (error) {
            console.error('Download Proxy Error:', error.message);
            res.status(500).send('Lỗi khi tải file qua proxy: ' + error.message);
        }
    }


    @UseGuards(FirebaseGuard)
    @Post('generate-mockup')
    async generateMockup(@Body() body: { prompt: string; productImage?: string; logoImage?: string; modelImage?: string; aspectRatio?: string }, @Req() req: any) {
        return this.aiService.generateImageMockup(body.prompt, body.productImage, body.logoImage, body.modelImage, body.aspectRatio, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-koc-product')
    async generateKocProduct(@Body() body: { kocId: string; productImage: string; prompt: string; modelImage?: string; bgImage?: string }, @Req() req: any) {
        return this.aiService.generateKocProductImage(body.kocId, body.productImage, body.prompt, req.user.uid, body.modelImage, body.bgImage);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-koc-visual')
    async generateKocVisual(@Body() body: { kocId: string; angle: string; outfit: string; hairColor: string; action: string }, @Req() req: any) {
        return this.aiService.generateKocVisual(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-smart-banner')
    async generateSmartBanner(@Body() body: any, @Req() req: any) {
        return this.aiService.generateSmartBanner(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('scrape-product')
    async scrapeProduct(@Body() body: { url: string }, @Req() req: any) {
        return this.aiService.scrapeProductData(body.url, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-video-concept')
    async generateVideoConcept(@Body() body: any, @Req() req: any) {
        return this.aiService.generateVideoScript(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-planning')
    async generatePlanning(@Body() body: any, @Req() req: any) {
        return this.aiService.generateMarketingPlan(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('tiktok-download')
    async tiktokDownload(@Body() body: { url: string }, @Req() req: any) {
        return this.aiService.downloadTikTokVideo(body.url, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('video-download')
    async videoDownload(@Body() body: { url: string }, @Req() req: any) {
        return this.aiService.downloadUniversalVideo(body.url, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('tiktok-analytics')
    async tiktokAnalytics(@Body() body: { uniqueId: string }, @Req() req: any) {
        try {
            return await this.aiService.analyzeTikTokChannel(body.uniqueId, req.user.uid);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('tiktok-generate-script')
    async tiktokGenerateScript(@Body() body: { uniqueId: string; niche: string }, @Req() req: any) {
        try {
            return await this.aiService.generateTikTokVideoScript(body.uniqueId, body.niche, req.user.uid);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('fb-ad-analysis')
    async fbAdAnalysis(@Body() body: { url: string }, @Req() req: any) {
        try {
            const userId = req.user.uid;
            return await this.aiService.analyzeFacebookAd(body.url, userId);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Get('fb-ad-analysis-history')
    async getAdsAnalysisHistory(@Req() req: any) {
        try {
            const userId = req.user.uid;
            return await this.aiService.getAdsAnalysisHistory(userId);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('fb-ad-comparison')
    async fbAdComparison(@Body() body: { analysisA: any, analysisB: any }, @Req() req: any) {
        try {
            return await this.aiService.compareFacebookAds(body.analysisA, body.analysisB, req.user.uid);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('fetch-social-content')
    async fetchSocialContent(@Body() body: { url: string }, @Req() req: any) {
        try {
            return await this.aiService.fetchContentFromUrl(body.url, req.user.uid);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('discovery-keyword')
    async discoveryKeyword(@Body() body: { keyword: string }, @Req() req: any) {
        try {
            return await this.aiService.searchKeywordDiscovery(body.keyword, 0, req.user.uid);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('keyword-detail')
    async keywordDetail(@Body() body: { keyword: string }, @Req() req: any) {
        try {
            return await this.aiService.getKeywordDetail(body.keyword, req.user.uid);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('trending-keywords')
    async trendingKeywords(@Body() body: { category: string, type?: 'hot' | 'potential' }, @Req() req: any) {
        try {
            return await this.aiService.getTrendingKeywords(body.category, req.user.uid, body.type || 'hot');
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('evaluate-improve-content')
    async evaluateImproveContent(@Body() body: { content: string, platform: string }, @Req() req: any) {
        try {
            return await this.aiService.evaluateAndImproveContent(body.content, body.platform, req.user.uid);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Get('tiktok-trending')
    async tiktokTrending(
        @Query('region') region: string,
        @Query('count') count: number,
        @Query('category') category: string | undefined,
        @Query('refresh') refresh: string | undefined,
        @Req() req: any
    ) {
        try {
            return await this.aiService.getTikTokTrending(region, count, refresh === 'true', category, req.user.uid);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-landing-page')
    async generateLandingPage(@Body() body: { prompt: string }) {
        try {
            // Theo yêu cầu của user: website và landing page không tính phí credit
            return await this.aiService.generateLandingPage(body.prompt);
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('auto-sub')
    @UseInterceptors(FileInterceptor('video'))
    async autoSubtitles(
        @UploadedFile() file: any,
        @Body('srcLang') srcLang: string,
        @Body('targetLang') targetLang: string,
        @Body('style') style: string,
        @Body('fontSize') fontSize: number,
        @Body('yPos') yPos: number,
        @Body('subColor') subColor: string,
        @Body('subBgColor') subBgColor: string,
        @Req() req: any
    ) {
        if (!file) {
            throw new InternalServerErrorException('Không tìm thấy file video tải lên.');
        }
        return await this.aiService.generateAutoSubtitles(file, srcLang || 'Auto', targetLang || 'Vietnamese', style || 'tiktok', Number(fontSize), Number(yPos), req.user.uid, subColor, subBgColor);
    }

    @Get('stream-sub-video/:id')
    async streamBurnedVideo(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
        try {
            // Không tính phí stream/download video đã sub vì đã tính phí lúc tạo sub
            const { stream, size, path } = await this.aiService.streamBurnedVideo(id, req, res);
        } catch (error) {
            if (!res.headersSent) {
                res.status(500).send('Lỗi khi xem video: ' + error.message);
            }
        }
    }

    @Get('download-sub-video/:id')
    async downloadBurnedVideo(@Param('id') id: string, @Res() res: Response) {
        try {
            const { stream, size } = await this.aiService.downloadBurnedVideo(id);
            res.set({
                'Content-Type': 'video/mp4',
                'Content-Length': size.toString(),
                'Content-Disposition': 'attachment; filename="auto-sub-' + id + '.mp4"',
            });
            stream.pipe(res);
        } catch (error) {
            res.status(500).send('Lỗi khi tải video: ' + error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('update-sub')
    async updateSubtitles(
        @Body('videoId') videoId: string,
        @Body('srtContent') srtContent: string,
        @Body('style') style: string,
        @Body('fontSize') fontSize: number,
        @Body('yPos') yPos: number,
        @Body('subColor') subColor: string,
        @Body('subBgColor') subBgColor: string,
        @Req() req: any
    ) {
        // Update sub cũng có thể tính phí nhẹ hoặc không tùy anh, hiện tại em để miễn phí vì là chỉnh sửa
        return await this.aiService.updateSrtContent(videoId, srtContent, style, Number(fontSize), Number(yPos), subColor, subBgColor);
    }

    @UseGuards(FirebaseGuard)
    @Post('run-automation/:id')
    async runAutomation(@Param('id') id: string, @Body() body: { isTest?: boolean }, @Req() req: any) {
        try {
            const isTest = body.isTest === true;
            return await this.aiService.runAutomationById(id, req.user.uid, isTest);
        } catch (error) {
            console.error('Lỗi API run-automation:', error);
            throw new InternalServerErrorException(error.message);
        }
    }
    @UseGuards(FirebaseGuard)
    @Post('render-automation-video/:resultId')
    async renderAutomationVideo(@Param('resultId') resultId: string, @Body() body: { workflowId?: string }, @Req() req: any) {
        try {
            return await this.aiService.renderAutomationVideo(resultId, req.user.uid, body.workflowId);
        } catch (error) {
            console.error('Lỗi API render-video:', error);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Get('stream-dub-video/:jobId')
    async streamDubbedVideo(@Param('jobId') jobId: string, @Req() req: any, @Res() res: Response) {
        try {
            await this.aiService.streamDubbedVideo(jobId, req, res);
        } catch (error) {
            if (!res.headersSent) {
                res.status(500).send('Lỗi khi xem video lồng tiếng: ' + error.message);
            }
        }
    }

    @Get('download-dub-video/:jobId')
    async downloadDubbedVideo(@Param('jobId') jobId: string, @Res() res: Response) {
        try {
            const { stream, size } = await this.aiService.downloadDubbedVideo(jobId);
            res.set({
                'Content-Type': 'video/mp4',
                'Content-Length': size.toString(),
                'Content-Disposition': 'attachment; filename="dubbed-video-' + jobId + '.mp4"',
            });
            stream.pipe(res);
        } catch (error) {
            res.status(500).send('Lỗi khi tải video lồng tiếng: ' + error.message);
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('video-dubbing')
    @UseInterceptors(FileInterceptor('video'))
    async videoDubbing(
        @UploadedFile() file: any,
        @Body('targetVoice') targetVoice: string,
        @Body('targetLang') targetLang: string,
        @Body('bgVolume') bgVolume: string,
        @Body('dubVolume') dubVolume: string,
        @Body('showSubtitles') showSubtitles: string,
        @Body('subColor') subColor: string,
        @Body('subFontSize') subFontSize: string,
        @Body('subBgColor') subBgColor: string,
        @Body('subVerticalPos') subVerticalPos: string,
        @Req() req: any
    ) {
        if (!file) {
            throw new InternalServerErrorException('Không tìm thấy file video tải lên.');
        }
        return await this.aiService.generateVideoDubbing(
            file,
            targetVoice || 'banmai',
            targetLang || 'Vietnamese',
            req.user.uid,
            bgVolume ? parseFloat(bgVolume) : 0.4,
            dubVolume ? parseFloat(dubVolume) : 1.5,
            showSubtitles === 'true',
            {
                color: subColor || '#FFFFFF',
                fontSize: subFontSize ? parseInt(subFontSize) : 20,
                bgColor: subBgColor || '#000000',
                verticalPos: subVerticalPos ? parseInt(subVerticalPos) : 30
            }
        );
    }

    @UseGuards(FirebaseGuard)
    @Get('job-status/:jobId')
    async getJobStatus(@Param('jobId') jobId: string) {
        try {
            return await this.aiService.getJobStatus(jobId);
        } catch (error: any) {
            console.error(`[AiController] Lỗi getJobStatus(jobId=${jobId}):`, error);
            return {
                id: jobId,
                state: 'failed',
                progress: 0,
                reason: 'Internal Server Error: ' + (error.message || String(error))
            };
        }
    }

    @UseGuards(FirebaseGuard)
    @Post('remove-bg')
    async removeBackground(@Body() body: { imageUrl: string }, @Req() req: any) {
        return this.aiService.removeBackground(body.imageUrl, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('enhance-image')
    async enhanceImage(@Body() body: { imageUrl: string }, @Req() req: any) {
        return this.aiService.enhanceImage(body.imageUrl, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('visual-clone')
    async generateVisualClone(@Body() body: any, @Req() req: any) {
        return this.aiService.generateVisualClone(body.modelImage, body.templatePrompt, req.user.uid, body.templateImage, body.count, body.fidelity, body.creativity);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-kol-video')
    async generateKolVideo(@Body() body: { imageUrl: string; videoUrl: string; }, @Req() req: any) {
        if (!body.imageUrl || !body.videoUrl) {
            throw new Error('Bắt buộc phải có ảnh nhân vật và video mẫu.');
        }
        return this.aiService.generateKolVideo(body.imageUrl, body.videoUrl, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Get('koc')
    async getAiKocs(@Req() req: any) {
        return this.aiService.getAiKocs(req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('koc')
    async createAiKoc(@Body() body: { name: string, imageUrl: string, tags?: string[] }, @Req() req: any) {
        return this.aiService.createAiKoc(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Delete('koc/:id')
    async deleteAiKoc(@Param('id') id: string, @Req() req: any) {
        return this.aiService.deleteAiKoc(id, req.user.uid);
    }
}
