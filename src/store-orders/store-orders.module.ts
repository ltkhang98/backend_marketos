import { Module } from '@nestjs/common';
import { StoreOrdersController } from './store-orders.controller';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [MailModule],
    controllers: [StoreOrdersController],
})
export class StoreOrdersModule { }
