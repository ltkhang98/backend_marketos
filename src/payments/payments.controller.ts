import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Get, Headers, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(private readonly paymentsService: PaymentsService) { }

    @Post(['webhook', 'sepay-webhook'])
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() data: any, @Headers() headers: any, @Query() query: any) {
        this.logger.log('Receiving SePay Webhook - Attempting to process...');
        this.logger.log(`Headers: ${JSON.stringify(headers)}`);
        this.logger.log(`Data: ${JSON.stringify(data)}`);

        try {
            const authHeader = headers['authorization'] || headers['apikey'] || headers['api-key'];
            let apiKey = query.token || query.apikey || undefined;
            if (authHeader) {
                apiKey = authHeader.replace(/^Bearer\s+/i, '').replace(/^Apikey\s+/i, '').trim();
            }
            return await this.paymentsService.handleSePayWebhook(data, apiKey);
        } catch (err) {
            this.logger.error('Error processing SePay webhook', err);
            return { status: 'error', message: 'Internal error' };
        }
    }

    @Get(['webhook', 'sepay-webhook'])
    verifyWebhook() {
        return {
            status: "Active",
            message: "SePay Webhook Endpoint is Active",
            tested_paths: [
                "/payments/sepay-webhook"
            ],
            note: "Please use the URL above without the /api prefix in your SePay configuration."
        };
    }

    @Get()
    rootVerify() {
        return "Payments Controller is reachable";
    }
}
