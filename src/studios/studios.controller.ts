import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { StudiosService } from './studios.service';

@Controller('studios')
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}

  @Get()
  async findAll() {
    const data = await this.studiosService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.studiosService.findOne(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() data: any) {
    const result = await this.studiosService.create(data);
    return { success: true, data: result };
  }
}
