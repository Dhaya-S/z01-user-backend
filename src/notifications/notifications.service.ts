import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private readonly ONESIGNAL_APP_ID = '8ba49c7c-97fb-4410-8354-ccb8dd2abfb5';
  private readonly ONESIGNAL_REST_API_KEY = 'os_v2_app_rosjy7ex7ncbba2uzs4n2kv7wuvco7hwrv6e2s4nhoogwlbha3zmo5p4fc3qtvb2icvbgm32ica7rbmsaxfiexz4yf4mdmf3e6qn62i';

  /**
   * Send a push notification to a specific user via OneSignal
   * @param userId The database user ID of the recipient
   * @param title The title of the notification
   * @param message The body message of the notification
   */
  async sendNotificationToUser(userId: string, title: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        {
          app_id: this.ONESIGNAL_APP_ID,
          include_external_user_ids: [userId],
          headings: { en: title },
          contents: { en: message },
          channel_for_external_user_ids: 'push'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.ONESIGNAL_REST_API_KEY}`,
          },
        }
      );

      this.logger.log(`OneSignal Notification sent to user ${userId}: ${JSON.stringify(response.data)}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OneSignal notification to user ${userId}`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Broadcast a notification to all subscribed users
   */
  async broadcastNotification(title: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        {
          app_id: this.ONESIGNAL_APP_ID,
          included_segments: ['Subscribed Users'],
          headings: { en: title },
          contents: { en: message },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.ONESIGNAL_REST_API_KEY}`,
          },
        }
      );

      this.logger.log(`OneSignal Broadcast sent: ${JSON.stringify(response.data)}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to broadcast OneSignal notification`, error.response?.data || error.message);
      return false;
    }
  }
}
