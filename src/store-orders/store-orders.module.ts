import { Module } from '@nestjs/common';
import { StoreOrdersController } from './store-orders.controller';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [MailModule, NotificationsModule],
    controllers: [StoreOrdersController],
})
export class StoreOrdersModule { }
