import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class WishlistService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async getWishlistItems(userId: string) {
    try {
      const result = await this.pool.query(
        `SELECT l.* 
         FROM vendor_listings l
         JOIN user_wishlist w ON w.listing_id = l.id
         WHERE w.user_id = $1
         ORDER BY w.created_at DESC`,
        [userId]
      );
      
      // The database rows already contain snake_case columns like listing_title, image_1, price_per_day, etc.
      // We can just return them directly since they match ListingModel.fromJson expectations.
      return result.rows;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw new InternalServerErrorException('Failed to fetch wishlist');
    }
  }

  async addToWishlist(userId: string, listingId: number) {
    try {
      await this.pool.query(
        `INSERT INTO user_wishlist (user_id, listing_id) 
         VALUES ($1, $2)
         ON CONFLICT (user_id, listing_id) DO NOTHING`,
        [userId, listingId]
      );
      return { success: true };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw new InternalServerErrorException('Failed to add to wishlist');
    }
  }

  async removeFromWishlist(userId: string, listingId: number) {
    try {
      await this.pool.query(
        `DELETE FROM user_wishlist WHERE user_id = $1 AND listing_id = $2`,
        [userId, listingId]
      );
      return { success: true };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw new InternalServerErrorException('Failed to remove from wishlist');
    }
  }

  async checkWishlistStatus(userId: string, listingId: number) {
    try {
      const result = await this.pool.query(
        `SELECT 1 FROM user_wishlist WHERE user_id = $1 AND listing_id = $2`,
        [userId, listingId]
      );
      return { isWishlisted: (result.rowCount ?? 0) > 0 };
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      return { isWishlisted: false };
    }
  }
}
