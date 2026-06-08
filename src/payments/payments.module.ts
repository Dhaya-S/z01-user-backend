import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
const Razorpay = require('razorpay');

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'RAZORPAY_INSTANCE',
      useFactory: (configService: ConfigService) => {
        const keyId = process.env.RAZORPAY_KEY_ID?.trim();
        const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
        console.log('Initializing Razorpay with keyId:', keyId?.substring(0, 5), 'len:', keyId?.length);
        console.log('keySecret:', keySecret?.substring(0, 5), 'len:', keySecret?.length);
        if (!keyId || !keySecret) {
          console.warn('Razorpay keys not configured properly');
          return null;
        }
        return new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
