import { Controller, Post, Body, UseGuards, Get, Req, InternalServerErrorException, Param } from '@nestjs/common';
import { AiBaseService } from './services/ai-base.service';
import { FirebaseGuard } from '../auth/firebase.guard';

@Controller('ai')
export class AiController {
    constructor(private readonly baseService: AiBaseService) { }

    @UseGuards(FirebaseGuard)
    @Get('job-status/:jobId')
    async getJobStatus(@Param('jobId') jobId: string) {
        try {
            return await this.baseService.getJobStatus(jobId);
        } catch (error: any) {
            return {
                id: jobId,
                state: 'failed',
                reason: 'Internal Server Error: ' + (error.message || String(error))
            };
        }
    }

    @Get('membership-configs')
    async getMembershipConfigs() {
        return this.baseService.getMembershipConfigs();
    }
}
