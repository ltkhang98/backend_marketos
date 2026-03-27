import { Controller, Post, Get, Body, Param, Req, UseGuards, Res, Delete, HttpStatus, Query } from '@nestjs/common';
import { FirebaseGuard } from '../auth/firebase.guard';
import { LinksService } from './links.service';
import type { Response } from 'express';

@Controller('links')
export class LinksController {
    constructor(private readonly linksService: LinksService) { }

    @Post('shorten')
    @UseGuards(FirebaseGuard)
    async shorten(@Body() body: { url: string, customAlias?: string }, @Req() req: any) {
        return this.linksService.createShortLink(body.url, req.user.uid, body.customAlias);
    }

    @Get('user')
    @UseGuards(FirebaseGuard)
    async getUserLinks(@Req() req: any) {
        return this.linksService.getLinksByUser(req.user.uid);
    }

    @Delete(':shortId')
    @UseGuards(FirebaseGuard)
    async deleteLink(@Param('shortId') shortId: string, @Req() req: any) {
        return this.linksService.deleteLink(shortId, req.user.uid);
    }

    @Get('analytics')
    @UseGuards(FirebaseGuard)
    async getAnalytics(@Req() req: any, @Query('shortId') shortId?: string) {
        return this.linksService.getAnalytics(req.user.uid, shortId);
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

