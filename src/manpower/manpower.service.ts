import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class ManpowerService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async findAll() {
    try {
      const { rows } = await this.pool.query(
        `SELECT l.*, v.company_name as vendor_name 
         FROM vendor_listings l 
         LEFT JOIN vendors v ON l.vendor_id = v.id 
         WHERE l.category = $1 AND l.status = $2 
         ORDER BY l.created_at DESC`,
        ['Manpower', 'active']
      );
      return rows;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch manpower');
    }
  }

  async create(data: any) {
    try {
      const { vendorId, name, description, price, imageUrl } = data;
      const { rows } = await this.pool.query(
        'INSERT INTO vendor_listings (vendor_id, category, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [vendorId, 'Manpower', name, description, price, imageUrl]
      );
      return rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Failed to create manpower');
    }
  }
}
