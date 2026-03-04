import { Controller, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseGuard } from '../auth/firebase.guard';

@Controller('users')
@UseGuards(FirebaseGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    async create(@Body() userData: any, @Req() req: any) {
        const adminUid = req.user.uid;
        return this.usersService.createUser(userData, adminUid);
    }

    @Delete(':uid')
    async remove(@Param('uid') uid: string, @Req() req: any) {
        const adminUid = req.user.uid;
        return this.usersService.deleteUser(uid, adminUid);
    }
}
