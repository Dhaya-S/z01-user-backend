import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Razorpay from 'razorpay';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'RAZORPAY_INSTANCE',
      useFactory: (configService: ConfigService) => {
        const keyId = configService.get<string>('RAZORPAY_KEY_ID')?.trim();
        const keySecret = configService.get<string>('RAZORPAY_KEY_SECRET')?.trim();
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
