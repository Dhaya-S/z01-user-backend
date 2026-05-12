import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class EquipmentService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async findAll() {
    try {
      const { rows } = await this.pool.query(
        `SELECT l.*, v.company_name as vendor_name, v.business_type as vendor_business_type 
         FROM vendor_listings l 
         LEFT JOIN vendors v ON l.vendor_id = v.id 
         WHERE l.category = $1 
         ORDER BY l.created_at DESC`,
        ['Equipment']
      );
      return rows;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch equipment');
    }
  }

  async create(data: any) {
    try {
      const { vendorId, name, description, price, imageUrl } = data;
      const { rows } = await this.pool.query(
        'INSERT INTO vendor_listings (vendor_id, category, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [vendorId, 'Equipment', name, description, price, imageUrl]
      );
      return rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Failed to create equipment');
    }
  }
}
