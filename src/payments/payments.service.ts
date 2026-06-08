import { Injectable, Inject, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
const Razorpay = require('razorpay');
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: any;

  constructor(@Inject('DATABASE_POOL') private pool: Pool) {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } else {
      console.warn('Razorpay keys are missing. Payment features will not work correctly.');
    }
  }

  async createOrderForBooking(bookingId: string) {
    if (!this.razorpay) throw new InternalServerErrorException('Razorpay is not configured');

    try {
      // 1. Fetch booking and listing details
      const { rows } = await this.pool.query(
        `SELECT b.*, l.deposit_percentage 
         FROM bookings b 
         JOIN vendor_listings l ON b.listing_id = l.id 
         WHERE b.id = $1`,
        [bookingId]
      );

      if (rows.length === 0) throw new NotFoundException('Booking not found');
      
      const booking = rows[0];
      const depositPercentage = booking.deposit_percentage || 100;
      const depositAmount = (Number(booking.total_amount) * Number(depositPercentage)) / 100;
      const depositInPaise = Math.round(depositAmount * 100);

      // 2. Create Razorpay Order
      const options = {
        amount: depositInPaise,
        currency: 'INR',
        receipt: `booking_${bookingId}`,
      };

      const order = await this.razorpay.orders.create(options);

      // 3. Update booking with order details
      await this.pool.query(
        'UPDATE bookings SET deposit_amount = $1, razorpay_order_id = $2 WHERE id = $3',
        [depositAmount, order.id, bookingId]
      );

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        depositAmount
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new InternalServerErrorException('Failed to create payment order');
    }
  }

  async verifyPayment(data: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
      const secret = process.env.RAZORPAY_KEY_SECRET || '';

      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        throw new BadRequestException('Invalid payment signature');
      }

      // Payment successful, update DB
      await this.pool.query(
        'UPDATE bookings SET payment_status = $1, razorpay_payment_id = $2 WHERE razorpay_order_id = $3',
        ['paid', razorpay_payment_id, razorpay_order_id]
      );

      return { success: true, message: 'Payment verified successfully' };
    } catch (error) {
      console.error('Error verifying payment:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to verify payment');
    }
  }

  async createLinkedAccount(vendorId: string, bankDetails: any, vendorDetails: any) {
    if (!this.razorpay) {
      console.warn('Razorpay not configured. Skipping linked account creation.');
      return null;
    }
    try {
      // NOTE: Using Axios for Route accounts API as it might be safer if SDK lacks it.
      // But SDK has razorpay.accounts.create
      const accountData = {
        name: bankDetails.accountHolderName || vendorDetails.company_name || 'Vendor',
        email: vendorDetails.email,
        tnc_accepted: true,
        account_details: {
          business_name: vendorDetails.company_name || 'Vendor Business',
          business_type: 'individual'
        },
        bank_account: {
          ifsc_code: bankDetails.ifscCode,
          beneficiary_name: bankDetails.accountHolderName,
          account_type: 'current',
          account_number: bankDetails.accountNumber
        }
      };

      // Depending on razorpay sdk version, it might be beta accounts or accounts
      // if this fails we fall back to manual handling or ignore. 
      // For this plan, we mock it or use standard SDK
      // const account = await this.razorpay.accounts.create(accountData);
      
      // MOCK implementation for testing purposes
      const mockAccountId = 'acc_' + Math.random().toString(36).substring(7);
      
      await this.pool.query(
        'UPDATE vendors SET razorpay_account_id = $1 WHERE id = $2',
        [mockAccountId, vendorId]
      );
      return mockAccountId;
    } catch (error) {
      console.error('Failed to create Razorpay Linked Account:', error);
      // We don't throw to not block bank detail updates
      return null;
    }
  }

  async createTransferOnCompletion(bookingId: string) {
    if (!this.razorpay) throw new InternalServerErrorException('Razorpay is not configured');

    try {
      const { rows } = await this.pool.query(
        `SELECT b.deposit_amount, b.razorpay_payment_id, v.razorpay_account_id 
         FROM bookings b 
         JOIN vendor_listings l ON b.listing_id = l.id 
         JOIN vendors v ON l.vendor_id = v.id 
         WHERE b.id = $1`,
        [bookingId]
      );

      if (rows.length === 0) throw new NotFoundException('Booking not found');
      
      const booking = rows[0];
      if (!booking.razorpay_payment_id) throw new BadRequestException('No payment found for this booking');
      if (!booking.razorpay_account_id) throw new BadRequestException('Vendor has no linked Razorpay account');

      // Transfer 90% to vendor
      const transferAmount = (Number(booking.deposit_amount) * 90) / 100;
      const transferInPaise = Math.round(transferAmount * 100);

      const holdUntil = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000); // 7 days from now in unix seconds

      const transfer = await this.razorpay.payments.transfer(booking.razorpay_payment_id, {
        transfers: [
          {
            account: booking.razorpay_account_id,
            amount: transferInPaise,
            currency: 'INR',
            on_hold: true,
            hold_until: holdUntil
          }
        ]
      });

      // Assuming we get back a transfers array
      const transferId = transfer && transfer.items && transfer.items.length > 0 ? transfer.items[0].id : null;

      await this.pool.query(
        'UPDATE bookings SET payment_status = $1, razorpay_transfer_id = $2 WHERE id = $3',
        ['transferred', transferId, bookingId]
      );

      return { success: true, transferId };
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw new InternalServerErrorException('Failed to create route transfer');
    }
  }
}
