import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FirebaseModule } from './firebase/firebase.module';
import { CustomersModule } from './customers/customers.module';
import { AiModule } from './ai/ai.module';
import { PaymentsModule } from './payments/payments.module';
import { LinksModule } from './links/links.module';
import { LandingPagesModule } from './landing-pages/landing-pages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';
import { StoreOrdersModule } from './store-orders/store-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    FirebaseModule,
    CustomersModule,
    AiModule,
    PaymentsModule,
    LinksModule,
    LandingPagesModule,
    NotificationsModule,
    MailModule,
    StoreOrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
