import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
    private notificationsService: NotificationsService,
  ) {}

  async create(body: any) {
    try {
      const { user_id, listing_id, start_date, end_date, total_amount, status } = body;
      
      const { rows } = await this.pool.query(
        'INSERT INTO bookings (user_id, listing_id, start_date, end_date, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user_id, listing_id, start_date, end_date, total_amount, status || 'pending']
      );

      const booking = rows[0];

      // Send notification to vendor
      try {
        const vendorData = await this.pool.query(
          `SELECT v.email, v.company_name, l.listing_title 
           FROM vendor_listings l 
           JOIN vendors v ON l.vendor_id = v.id 
           WHERE l.id = $1`,
          [listing_id]
        );

        if (vendorData.rows.length > 0) {
          const vendor = vendorData.rows[0];
          const subject = 'New Booking Received - Z01';
          const text = `Hello ${vendor.company_name},\n\nYou have received a new booking for "${vendor.listing_title}".\n\nBooking Details:\nBooking ID: ${booking.id}\nStart Date: ${start_date}\nEnd Date: ${end_date}\nTotal Amount: ${total_amount}\n\nPlease check your dashboard for more details.\n\nBest Regards,\nZ01 Team`;
          
          // Fire and forget so it doesn't block the API response
          this.notificationsService.sendEmail(vendor.email, subject, text)
            .then(() => console.log(`New booking email sent to vendor: ${vendor.email}`))
            .catch(e => console.error('Failed to send notification email:', e));
        }
      } catch (notifyError) {
        console.error('Failed to initiate notification email:', notifyError);
        // We don't throw error here to not break the booking creation flow
      }

      return booking;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create booking');
    }
  }

  async findByUser(userId: string) {
    try {
      const { rows } = await this.pool.query(
        'SELECT b.*, v.listing_title as listing_name, v.category as listing_type, v.image_1, v.location_address, v.location_lat, v.location_lng, ven.company_name as vendor_company_name, ven.contact_person as vendor_contact_person, ven.phone as vendor_phone FROM bookings b LEFT JOIN vendor_listings v ON b.listing_id = v.id LEFT JOIN vendors ven ON v.vendor_id = ven.id WHERE b.user_id = $1 ORDER BY b.created_at DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch bookings');
    }
  }

  async findById(id: string) {
    try {
      const { rows } = await this.pool.query(
        'SELECT b.*, v.listing_title as listing_name, v.category as listing_type, v.image_1, v.location_address, v.location_lat, v.location_lng, ven.company_name as vendor_company_name, ven.contact_person as vendor_contact_person, ven.phone as vendor_phone FROM bookings b LEFT JOIN vendor_listings v ON b.listing_id = v.id LEFT JOIN vendors ven ON v.vendor_id = ven.id WHERE b.id = $1',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch booking');
    }
  }

  async cancel(id: string, reason: string) {
    try {
      // 1. Update status to Canceled immediately to ensure UI reflects it
      const updateResult = await this.pool.query(
        'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING listing_id',
        ['Canceled', id]
      );

      if (updateResult.rows.length === 0) {
        console.error(`Booking with ID ${id} not found for cancellation`);
        return { success: false, message: 'Booking not found' };
      }

      const listingId = updateResult.rows[0].listing_id;

      // 2. Fetch vendor details for notification
      const { rows: vendorInfo } = await this.pool.query(
        `SELECT v.email, v.company_name, l.listing_title 
         FROM vendor_listings l 
         LEFT JOIN vendors v ON l.vendor_id = v.id 
         WHERE l.id = $1`,
        [listingId]
      );

      if (vendorInfo.length > 0 && vendorInfo[0].email) {
        const info = vendorInfo[0];
        try {
          const subject = 'Booking Canceled - Z01';
          const text = `Hello ${info.company_name || 'Vendor'},\n\nA booking for your listing "${info.listing_title || 'Service'}" has been canceled.\n\nBooking ID: ${id}\nCancellation Reason: ${reason}\n\nPlease check your dashboard for updates.\n\nBest Regards,\nZ01 Team`;
          
          // Fire and forget email so it doesn't block the API response if SMTP hangs
          this.notificationsService.sendEmail(info.email, subject, text)
            .then(() => console.log(`Cancellation email sent to vendor: ${info.email}`))
            .catch(e => console.error('Failed to send cancellation notification email:', e));
        } catch (notifyError) {
          console.error('Failed to initiate cancellation notification email:', notifyError);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error canceling booking:', error);
      throw new InternalServerErrorException('Failed to cancel booking');
    }
  }
}
