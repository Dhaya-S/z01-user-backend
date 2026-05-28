import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class ReportsService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async create(data: any) {
    try {
      const { listing_id, user_id, reason, description } = data;
      const { rows } = await this.pool.query(
        'INSERT INTO reports (listing_id, user_id, reason, description) VALUES ($1, $2, $3, $4) RETURNING *',
        [
          parseInt(listing_id) || null,
          user_id || 'anonymous',
          reason || '',
          description || '',
        ]
      );
      return rows[0];
    } catch (error) {
      console.error('Create report error:', error);
      throw new InternalServerErrorException('Failed to create report');
    }
  }

  async findAll() {
    try {
      const { rows } = await this.pool.query('SELECT * FROM reports ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      console.error('Find all reports error:', error);
      throw new InternalServerErrorException('Failed to fetch reports');
    }
  }
}
