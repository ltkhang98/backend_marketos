import { Module } from '@nestjs/common';
import { LandingPagesController } from './landing-pages.controller';
import { LandingPagesService } from './landing-pages.service';
import { BuilderController } from './builder.controller';

@Module({
    controllers: [LandingPagesController, BuilderController],
    providers: [LandingPagesService],
    exports: [LandingPagesService],
})
export class LandingPagesModule { }
