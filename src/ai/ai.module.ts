import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiProcessor } from './ai.processor';
import { FacebookModule } from '../facebook/facebook.module';

@Module({
    imports: [
        FacebookModule,
        BullModule.registerQueue({
            name: 'video-processing',
        }),
    ],
    controllers: [AiController],
    providers: [AiService, AiProcessor],
})
export class AiModule { }
