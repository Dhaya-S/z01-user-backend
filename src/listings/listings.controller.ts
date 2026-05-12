import { Controller, Get, Query, Param } from '@nestjs/common';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('recent')
  async findAllRecent() {
    const data = await this.listingsService.findAllRecent();
    return { success: true, data };
  }

  @Get('search')
  async search(@Query('q') query: string) {
    const data = await this.listingsService.search(query || '');
    return { success: true, data };
  }

  @Get('vendor/:vendorId')
  async findByVendor(@Param('vendorId') vendorId: string) {
    const data = await this.listingsService.findByVendor(vendorId);
    return { success: true, data };
  }
}
