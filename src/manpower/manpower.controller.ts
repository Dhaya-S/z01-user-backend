import { Controller, Get, Post, Body } from '@nestjs/common';
import { ManpowerService } from './manpower.service';

@Controller('manpower')
export class ManpowerController {
  constructor(private readonly manpowerService: ManpowerService) {}

  @Get()
  async findAll() {
    const data = await this.manpowerService.findAll();
    return { success: true, data };
  }

  @Post()
  async create(@Body() data: any) {
    const result = await this.manpowerService.create(data);
    return { success: true, data: result };
  }
}
