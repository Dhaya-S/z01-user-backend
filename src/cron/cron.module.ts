import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [CronService],
})
export class CronModule {}
