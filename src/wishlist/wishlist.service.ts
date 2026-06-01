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
      
      // Map database snake_case columns to the camelCase properties the flutter app expects
      const formattedListings = result.rows.map(item => ({
        id: item.id.toString(),
        vendorId: item.vendor_id?.toString() ?? '',
        category: item.category,
        subCategory: item.category, // using category as subCategory as a fallback
        listingTitle: item.name,
        description: item.description,
        pricePerHour: parseFloat(item.price) || 0,
        pricePerDay: (parseFloat(item.price) || 0) * 8, // dummy day price
        images: item.image_url ? [item.image_url] : [],
        locationAddress: 'India', // dummy location
        latitude: 20.5937,
        longitude: 78.9629,
        status: item.status,
      }));
      
      return formattedListings;
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
