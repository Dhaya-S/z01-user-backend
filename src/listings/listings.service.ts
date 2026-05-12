import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class ListingsService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async findAllRecent() {
    try {
      const { rows } = await this.pool.query(
        `SELECT l.*, v.company_name as vendor_name, v.business_type as vendor_business_type 
         FROM vendor_listings l 
         LEFT JOIN vendors v ON l.vendor_id = v.id 
         WHERE l.status = $1 
         ORDER BY l.created_at DESC LIMIT 20`,
        ['active']
      );
      return rows;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch recent listings');
    }
  }

  async search(query: string) {
    try {
      const { rows } = await this.pool.query(
        `SELECT l.*, v.company_name as vendor_name, v.business_type as vendor_business_type 
         FROM vendor_listings l 
         LEFT JOIN vendors v ON l.vendor_id = v.id 
         WHERE l.status = $1 
         AND (l.listing_title ILIKE $2 OR l.short_description ILIKE $2 OR l.brand ILIKE $2 OR l.category ILIKE $2) 
         ORDER BY l.created_at DESC`,
        ['active', `%${query}%`]
      );
      return rows;
    } catch (error) {
      throw new InternalServerErrorException('Failed to search listings');
    }
  }

  async findByVendor(vendorId: string) {
    try {
      const { rows } = await this.pool.query(
        'SELECT * FROM vendor_listings WHERE vendor_id = $1 AND status = $2 ORDER BY created_at DESC',
        [vendorId, 'active']
      );
      return rows;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch vendor listings');
    }
  }
}
