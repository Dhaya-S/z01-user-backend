import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PaymentsService } from '../payments/payments.service';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly paymentsService: PaymentsService
  ) {}

  @Post()
  async create(@Body() body: any) {
    const data = await this.bookingsService.create(body);
    return { success: true, data };
  }

  @Get(':userId')
  async findByUser(@Param('userId') userId: string) {
    const data = await this.bookingsService.findByUser(userId);
    return { success: true, data };
  }

  @Get('detail/:id')
  async findById(@Param('id') id: string) {
    const data = await this.bookingsService.findById(id);
    return { success: true, data };
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Body() body: { reason: string }) {
    const result = await this.bookingsService.cancel(id, body.reason);
    return result;
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string) {
    const result = await this.bookingsService.complete(id);
    if (result.success) {
      // Trigger Razorpay route transfer immediately to vendor
      try {
        await this.paymentsService.createTransferOnCompletion(id);
      } catch (error: any) {
        console.error(`Razorpay transfer failed for booking ${id}:`, error?.message || error);
        // Do not fail the completion for the user
      }
    }
    return result;
  }
}
