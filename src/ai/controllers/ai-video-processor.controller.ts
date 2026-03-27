import { Controller, Post, Body, UseGuards, Get, Req, InternalServerErrorException, UseInterceptors, UploadedFile, Param, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiVideoProcessorService } from '../services/ai-video-processor.service';
import { FirebaseGuard } from '../../auth/firebase.guard';

@Controller('ai/video-processor')
export class AiVideoProcessorController {
    constructor(private readonly videoProcessorService: AiVideoProcessorService) { }

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
        @Body('subBgOpacity') subBgOpacity: number,
        @Req() req: any
    ) {
        if (!file) throw new BadRequestException('Không tìm thấy file video tải lên.');
        return await this.videoProcessorService.generateAutoSubtitles(file, srcLang || 'Auto', targetLang || 'Vietnamese', style || 'tiktok', Number(fontSize), Number(yPos), req.user.uid, subColor, subBgColor, Number(subBgOpacity));
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
        if (!file) throw new BadRequestException('Không tìm thấy file video tải lên.');
        return await this.videoProcessorService.videoDubbing(file, targetVoice || 'banmai', targetLang || 'Vietnamese', req.user.uid, bgVolume ? parseFloat(bgVolume) : 0.4, dubVolume ? parseFloat(dubVolume) : 1.5, showSubtitles === 'true', {
            color: subColor || '#FFFFFF',
            fontSize: subFontSize ? parseInt(subFontSize) : 20,
            bgColor: subBgColor || '#000000',
            verticalPos: subVerticalPos ? parseInt(subVerticalPos) : 30
        });
    }

    @UseGuards(FirebaseGuard)
    @Post('render-automation/:resultId')
    async renderAutomationVideo(@Param('resultId') resultId: string, @Body() body: { workflowId?: string }, @Req() req: any) {
        return this.videoProcessorService.renderAutomationVideo(resultId, req.user.uid, body.workflowId);
    }

    @UseGuards(FirebaseGuard)
    @Post('kol-video')
    async generateKolVideo(@Body() body: { imageUrl: string, videoUrl: string }, @Req() req: any) {
        return this.videoProcessorService.generateKolVideo(body.imageUrl, body.videoUrl, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('generate-concept')
    async generateVideoConcept(@Body() body: any, @Req() req: any) {
        return this.videoProcessorService.generateVideoConcept(body, req.user.uid);
    }

    @Get('stream-sub-video/:videoId')
    async streamSubVideo(@Param('videoId') videoId: string, @Res() res: any) {
        return this.videoProcessorService.streamVideo(videoId, 'auto_sub', res);
    }

    @Get('download-sub-video/:videoId')
    async downloadSubVideo(@Param('videoId') videoId: string, @Res() res: any) {
        return this.videoProcessorService.streamVideo(videoId, 'auto_sub', res, true);
    }

    @Get('stream-dub-video/:videoId')
    async streamDubVideo(@Param('videoId') videoId: string, @Res() res: any) {
        return this.videoProcessorService.streamVideo(videoId, 'video_dub', res);
    }

    @Get('download-dub-video/:videoId')
    async downloadDubVideo(@Param('videoId') videoId: string, @Res() res: any) {
        return this.videoProcessorService.streamVideo(videoId, 'video_dub', res, true);
    }

    @UseGuards(FirebaseGuard)
    @Post('update-sub')
    async updateSub(@Body() body: any, @Req() req: any) {
        return this.videoProcessorService.updateSubtitle(body, req.user.uid);
    }

    @UseGuards(FirebaseGuard)
    @Post('reburn-video')
    async reburnVideo(@Body() body: any, @Req() req: any) {
        return this.videoProcessorService.reburnVideo(body, req.user.uid);
    }
 
    @UseGuards(FirebaseGuard)
    @Get('job-status/:jobId')
    async getJobStatus(@Param('jobId') jobId: string) {
        return this.videoProcessorService.getJobStatus(jobId);
    }
}
