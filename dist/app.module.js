"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const firebase_module_1 = require("./firebase/firebase.module");
const customers_module_1 = require("./customers/customers.module");
const ai_module_1 = require("./ai/ai.module");
const payments_module_1 = require("./payments/payments.module");
const links_module_1 = require("./links/links.module");
const landing_pages_module_1 = require("./landing-pages/landing-pages.module");
const notifications_module_1 = require("./notifications/notifications.module");
const mail_module_1 = require("./mail/mail.module");
const store_orders_module_1 = require("./store-orders/store-orders.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            firebase_module_1.FirebaseModule,
            customers_module_1.CustomersModule,
            ai_module_1.AiModule,
            payments_module_1.PaymentsModule,
            links_module_1.LinksModule,
            landing_pages_module_1.LandingPagesModule,
            notifications_module_1.NotificationsModule,
            mail_module_1.MailModule,
            store_orders_module_1.StoreOrdersModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map