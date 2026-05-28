import { Controller, Get, Post, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(@Body() data: any) {
    const result = await this.reportsService.create(data);
    return { success: true, data: result };
  }

  @Get()
  async findAll() {
    const data = await this.reportsService.findAll();
    return { success: true, data };
  }
}
