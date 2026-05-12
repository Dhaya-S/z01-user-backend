import { Injectable, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class StudiosService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async findAll() {
    try {
      const { rows } = await this.pool.query(
        `SELECT l.*, v.company_name as vendor_name, v.business_type as vendor_business_type 
         FROM vendor_listings l 
         LEFT JOIN vendors v ON l.vendor_id = v.id 
         WHERE l.category = $1 
         ORDER BY l.created_at DESC`,
        ['Studio']
      );
      return rows;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch studios');
    }
  }

  async findOne(id: string) {
    try {
      const { rows } = await this.pool.query('SELECT * FROM vendor_listings WHERE id = $1', [id]);
      if (rows.length === 0) {
        throw new NotFoundException('Studio not found');
      }
      return rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch studio');
    }
  }

  async create(data: any) {
    try {
      const { vendorId, name, description, price, imageUrl } = data;
      const { rows } = await this.pool.query(
        'INSERT INTO vendor_listings (vendor_id, category, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [vendorId, 'Studio', name, description, price, imageUrl]
      );
      return rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Failed to create studio');
    }
  }
}
