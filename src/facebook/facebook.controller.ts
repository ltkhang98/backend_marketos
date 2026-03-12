import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FacebookService } from './facebook.service';

@Controller('facebook')
export class FacebookController {
    constructor(private readonly facebookService: FacebookService) { }

    @Post('post')
    async postToFacebook(
        @Body() body: {
            pageAccessToken: string;
            pageId: string;
            message: string;
            imageUrl?: string
        },
    ) {
        return this.facebookService.postToPage(
            body.pageAccessToken,
            body.pageId,
            body.message,
            body.imageUrl,
        );
    }

    @Post('exchange-token')
    async exchangeToken(@Body() body: { shortLivedToken: string }) {
        return this.facebookService.exchangeToLongLivedToken(body.shortLivedToken);
    }

    @Post('pages')
    async getPages(@Body() body: { userAccessToken: string }) {
        return this.facebookService.getUserPages(body.userAccessToken);
    }
}
