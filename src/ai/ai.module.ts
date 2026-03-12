import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

import { FacebookModule } from '../facebook/facebook.module';

@Module({
    imports: [FacebookModule],
    controllers: [AiController],
    providers: [AiService],
})
export class AiModule { }
