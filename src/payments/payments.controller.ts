import { Controller, Post, Body, InternalServerErrorException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  async createOrder(@Body() body: { bookingId: string }) {
    if (!body.bookingId) {
      throw new InternalServerErrorException('bookingId is required');
    }
    return this.paymentsService.createOrderForBooking(body.bookingId);
  }

  @Post('verify')
  async verifyPayment(@Body() body: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) {
    return this.paymentsService.verifyPayment(body);
  }
}
