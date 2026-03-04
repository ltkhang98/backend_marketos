import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { FirebaseGuard } from '../auth/firebase.guard';

@Controller('customers')
@UseGuards(FirebaseGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    create(@Body() customerData: any, @Req() req: any) {
        return this.customersService.create(customerData, req.user.uid);
    }

    @Get()
    findAll(@Req() req: any) {
        return this.customersService.findAll(req.user.uid);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() customerData: any) {
        return this.customersService.update(id, customerData);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.customersService.remove(id);
    }
}
