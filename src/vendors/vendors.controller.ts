import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.vendorsService.getProfile(id);
  }

  @Put('details/:id')
  updateDetails(@Param('id') id: string, @Body() details: any) {
    return this.vendorsService.updateDetails(id, details);
  }

  @Post('documents/:id')
  uploadDocuments(@Param('id') id: string, @Body() documents: any) {
    return this.vendorsService.uploadDocuments(id, documents);
  }

  @Post('bank-details/:id')
  updateBankDetails(@Param('id') id: string, @Body() bankDetails: any) {
    return this.vendorsService.updateBankDetails(id, bankDetails);
  }
}
