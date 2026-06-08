import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CronService implements OnModuleInit, OnModuleDestroy {
  private interval: NodeJS.Timeout;

  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
    private notificationsService: NotificationsService
  ) {}

  onModuleInit() {
    // Run every day at 10 AM (for simplicity, we check every hour and run if it's 10 AM)
    // Or just run every 24 hours. Here we will use a setInterval for every hour.
    this.interval = setInterval(() => this.checkAndSendNotifications(), 60 * 60 * 1000);
    // Also run once on startup for testing/dev purposes
    setTimeout(() => this.checkAndSendNotifications(), 5000);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  async checkAndSendNotifications() {
    try {
      // Find bookings where start_date is today and status is 'paid' or 'approved'
      const { rows } = await this.pool.query(
        `SELECT b.id, b.user_id, l.listing_title 
         FROM bookings b
         JOIN vendor_listings l ON b.listing_id = l.id
         WHERE DATE(b.start_date) = CURRENT_DATE 
         AND b.status IN ('paid', 'approved', 'pending')`
      );

      for (const booking of rows) {
        const subject = 'Is your booking completed?';
        const text = `Hi! Your booking for ${booking.listing_title} is scheduled for today. Please confirm if the booking was completed successfully so we can proceed with the payment.`;
        
        // Assuming notificationsService.sendNotificationToUser handles push notifications too
        // or we use email as fallback. We could add extra payload data for the app.
        await this.notificationsService.sendNotificationToUser(booking.user_id, subject, text, {
          action: 'BOOKING_COMPLETED_CHECK',
          bookingId: booking.id
        });
        console.log(`Sent completion check notification to user ${booking.user_id} for booking ${booking.id}`);
      }
    } catch (error) {
      console.error('Error running daily cron job:', error);
    }
  }
}
