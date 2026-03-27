import { Controller, Post, Body, UseGuards, Get, Req, InternalServerErrorException, Delete, Param, Query, Res } from '@nestjs/common';
import { AiMediaService } from '../services/ai-media.service';
import { FirebaseGuard } from '../../auth/firebase.guard';

@Controller('ai/media')
export class AiMediaController {
    constructor(private readonly mediaService: AiMediaService) { }

    @UseGuards(FirebaseGuard)
    @Post('tts') // Standardized
    async textToSpeech(@Body() body: { text: string; voice: string; speed: string | number }, @Req() req: any) {
        return this.mediaService.generateSpeech(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-mockup')
    async generateMockup(@Body() body: { prompt: string; productImage?: string; logoImage?: string; modelImage?: string; aspectRatio?: string }, @Req() req: any) {
        return this.mediaService.generateImageMockup(body.prompt, body.productImage, body.logoImage, body.modelImage, body.aspectRatio, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-smart-banner')
    async generateSmartBanner(@Body() body: any, @Req() req: any) {
        return this.mediaService.generateSmartBanner(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('visual-clone')
    async generateVisualClone(@Body() body: any, @Req() req: any) {
        return this.mediaService.generateVisualClone(body.modelImage, body.templatePrompt, req.user.uid, body.templateImage, body.count, body.fidelity, body.creativity);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-koc-product')
    async generateKocProduct(@Body() body: { kocId: string; productImage: string; prompt: string; modelImage?: string; bgImage?: string }, @Req() req: any) {
        return this.mediaService.generateKocProductImage(body.kocId, body.productImage, body.prompt, req.user.uid, body.modelImage, body.bgImage);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-koc-visual')
    async generateKocVisual(@Body() body: { kocId: string; angle: string; outfit: string; hairColor: string; action: string }, @Req() req: any) {
        return this.mediaService.generateKocVisual(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Get('koc')
    async getAiKocs(@Req() req: any) {
        return this.mediaService.getAiKocs(req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('koc')
    async createAiKoc(@Body() body: { name: string, imageUrl: string, tags?: string[] }, @Req() req: any) {
        return this.mediaService.createAiKoc(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Delete('koc/:id')
    async deleteAiKoc(@Param('id') id: string, @Req() req: any) {
        return this.mediaService.deleteAiKoc(id, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('video-download')
    async videoDownload(@Body() body: { url: string }, @Req() req: any) {
        return this.mediaService.downloadUniversalVideo(body.url, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('remove-background')
    async removeBackground(@Body() body: { url: string }, @Req() req: any) {
        return this.mediaService.removeBackground(body.url, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('enhance-image')
    async enhanceImage(@Body() body: { url: string }, @Req() req: any) {
        return this.mediaService.enhanceImage(body.url, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Get('download')
    async download(@Query('url') url: string, @Query('filename') filename: string, @Res() res: any) {
        return this.mediaService.proxyDownload(url, filename, res);
    }
 
    @UseGuards(FirebaseGuard)
    @Get('job-status/:jobId')
    async getJobStatus(@Param('jobId') jobId: string) {
        return this.mediaService.getJobStatus(jobId);
    }
}
