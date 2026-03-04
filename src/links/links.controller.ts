import { Controller, Post, Get, Body, Param, Req, UseGuards, Res, Delete, HttpStatus } from '@nestjs/common';
import { LinksService } from './links.service';
import type { Response } from 'express';

@Controller('links')
export class LinksController {
    constructor(private readonly linksService: LinksService) { }

    @Post('shorten')
    async shorten(@Body() body: { url: string, customAlias?: string, userId: string }) {
        return this.linksService.createShortLink(body.url, body.userId, body.customAlias);
    }

    @Get('user/:userId')
    async getUserLinks(@Param('userId') userId: string) {
        return this.linksService.getLinksByUser(userId);
    }

    @Delete(':shortId/:userId')
    async deleteLink(@Param('shortId') shortId: string, @Param('userId') userId: string) {
        return this.linksService.deleteLink(shortId, userId);
    }

    @Get('analytics/:userId')
    async getAnalytics(@Param('userId') userId: string) {
        return this.linksService.getAnalytics(userId);
    }

    @Get('redirect/:shortId')
    async redirect(@Param('shortId') shortId: string, @Res() res: Response) {
        const originalUrl = await this.linksService.getOriginalUrl(shortId);
        if (originalUrl) {
            return res.redirect(originalUrl);
        }
        return res.status(HttpStatus.NOT_FOUND).send('Link not found');
    }
}
