import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FirebaseGuard } from '../auth/firebase.guard';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @UseGuards(FirebaseGuard)
    @Get()
    async findAll() {
        return this.notificationsService.findAll();
    }

    @UseGuards(FirebaseGuard)
    @Post()
    async create(@Body() body: any, @Req() req: any) {
        const adminUid = req.user.uid;
        return this.notificationsService.create(body, adminUid);
    }

    @UseGuards(FirebaseGuard)
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: any) {
        const adminUid = req.user.uid;
        return this.notificationsService.remove(id, adminUid);
    }
}
