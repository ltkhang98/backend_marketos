import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiBaseService } from './services/ai-base.service';
import { AiFacebookService } from './services/ai-facebook.service';
import { AiTikTokService } from './services/ai-tiktok.service';
import { AiMediaService } from './services/ai-media.service';
import { AiAutomationService } from './services/ai-automation.service';
import { AiVideoProcessorService } from './services/ai-video-processor.service';
import { AiProcessor } from './ai.processor';
import { AiFacebookController } from './controllers/ai-facebook.controller';
import { AiTikTokController } from './controllers/ai-tiktok.controller';
import { AiMediaController } from './controllers/ai-media.controller';
import { AiAutomationController } from './controllers/ai-automation.controller';
import { AiVideoProcessorController } from './controllers/ai-video-processor.controller';
import { MediaModule } from '../media/media.module';

@Module({
  controllers: [
    AiController, // Still keep for centralized routes like job-status
    AiFacebookController,
    AiTikTokController,
    AiMediaController,
    AiAutomationController,
    AiVideoProcessorController,
  ],
  imports: [
    BullModule.registerQueue({
      name: 'video-processing',
    }),
    MediaModule,
  ],
  providers: [
    AiService,
    AiBaseService,
    AiFacebookService,
    AiTikTokService,
    AiMediaService,
    AiAutomationService,
    AiVideoProcessorService,
    AiProcessor,
  ],
  exports: [
    AiService,
    AiBaseService,
    AiFacebookService,
    AiTikTokService,
    AiMediaService,
    AiAutomationService,
    AiVideoProcessorService,
  ],
})
export class AiModule {}
