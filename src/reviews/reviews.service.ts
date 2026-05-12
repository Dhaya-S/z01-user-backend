import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class ReviewsService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async findAllByListing(listingId: number) {
    try {
      const { rows } = await this.pool.query(
        'SELECT * FROM reviews WHERE listing_id = $1 ORDER BY created_at DESC',
        [listingId]
      );
      return rows;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch reviews');
    }
  }

  async create(data: any) {
    try {
      const { listing_id, user_id, user_name, rating, comment, images } = data;
      const { rows } = await this.pool.query(
        'INSERT INTO reviews (listing_id, user_id, user_name, rating, comment, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [listing_id, user_id, user_name, rating, comment, JSON.stringify(images || [])]
      );
      
      // Update listing average rating (optional but recommended)
      await this.updateListingRating(listing_id);
      
      return rows[0];
    } catch (error) {
      console.error('Create review error:', error);
      throw new InternalServerErrorException('Failed to create review');
    }
  }

  private async updateListingRating(listingId: number) {
    try {
      const { rows } = await this.pool.query(
        'SELECT AVG(rating) as avg_rating FROM reviews WHERE listing_id = $1',
        [listingId]
      );
      const avg = rows[0].avg_rating || 0;
      await this.pool.query(
        'UPDATE vendor_listings SET avg_rating = $1 WHERE id = $2',
        [avg, listingId]
      );
    } catch (error) {
      console.error('Update listing rating error:', error);
    }
  }
}
