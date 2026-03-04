import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { LandingPagesService } from './landing-pages.service';

@Controller('landing-pages')
export class LandingPagesController {
    constructor(private readonly landingPagesService: LandingPagesService) { }

    @Post()
    async savePage(@Body() body: { userId: string; pageData: any }) {
        return this.landingPagesService.savePage(body.userId, body.pageData);
    }

    @Get('user/:userId')
    async getPagesByUser(@Param('userId') userId: string) {
        return this.landingPagesService.getPagesByUser(userId);
    }

    @Get(':id')
    async getPageById(@Param('id') id: string) {
        return this.landingPagesService.getPageById(id);
    }

    @Delete(':id/:userId')
    async deletePage(@Param('id') id: string, @Param('userId') userId: string) {
        return this.landingPagesService.deletePage(id, userId);
    }
}
