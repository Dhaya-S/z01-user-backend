import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

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
}
