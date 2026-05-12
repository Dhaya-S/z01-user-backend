import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':listingId')
  async findAllByListing(@Param('listingId') listingId: string) {
    const data = await this.reviewsService.findAllByListing(parseInt(listingId));
    return { success: true, data };
  }

  @Post()
  async create(@Body() data: any) {
    const result = await this.reviewsService.create(data);
    return { success: true, data: result };
  }
}
