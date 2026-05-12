import { Controller, Get, Post, Body } from '@nestjs/common';
import { EquipmentService } from './equipment.service';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  async findAll() {
    const data = await this.equipmentService.findAll();
    return { success: true, data };
  }

  @Post()
  async create(@Body() data: any) {
    const result = await this.equipmentService.create(data);
    return { success: true, data: result };
  }
}
