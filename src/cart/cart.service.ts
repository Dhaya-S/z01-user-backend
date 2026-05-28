import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class CartService {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async getCartItems(userId: string) {
    const result = await this.pool.query(
      `SELECT 
        c.id as cart_item_id, 
        c.listing_id as id, 
        c.category, 
        c.listing_title, 
        c.price, 
        c.price as price_per_day, 
        c.image_1, 
        c.location_address, 
        c.created_at,
        COALESCE(c.quantity, 1) as quantity,
        COALESCE(l.deposit_amount, 0) as deposit_amount
       FROM user_cart c
       LEFT JOIN vendor_listings l ON c.listing_id = l.id
       WHERE c.user_id = $1 
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return { success: true, data: result.rows };
  }

  async addToCart(userId: string, item: any) {
    // Check if it already exists to avoid duplicates
    const checkResult = await this.pool.query(
      'SELECT id, COALESCE(quantity, 1) as quantity FROM user_cart WHERE user_id = $1 AND listing_id = $2 AND category = $3',
      [userId, item.id, item.category]
    );

    if (checkResult.rows.length > 0) {
      const currentQty = checkResult.rows[0].quantity;
      await this.pool.query(
        'UPDATE user_cart SET quantity = $1 WHERE id = $2',
        [currentQty + 1, checkResult.rows[0].id]
      );
      return { success: true, message: 'Item quantity incremented in cart' };
    }

    const price = item.price_per_day || item.price_per_hour || item.price || 0;
    const quantity = item.quantity || 1;

    await this.pool.query(
      `INSERT INTO user_cart (user_id, listing_id, category, listing_title, price, image_1, location_address, quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        item.id,
        item.category,
        item.listing_title || item.name,
        price,
        item.image_1 || item.image_url,
        item.location_address || 'Nearby',
        quantity,
      ]
    );

    return { success: true, message: 'Added to cart' };
  }

  async updateCartItemQuantity(userId: string, listingId: number, category: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeFromCart(userId, listingId, category);
    }
    await this.pool.query(
      'UPDATE user_cart SET quantity = $1 WHERE user_id = $2 AND listing_id = $3 AND category = $4',
      [quantity, userId, listingId, category]
    );
    return { success: true, message: 'Quantity updated successfully' };
  }

  async removeFromCart(userId: string, listingId: number, category: string | null) {
    if (category == null || category === 'null') {
      await this.pool.query(
        'DELETE FROM user_cart WHERE user_id = $1 AND listing_id = $2 AND (category IS NULL OR category = $3)',
        [userId, listingId, category]
      );
    } else {
      await this.pool.query(
        'DELETE FROM user_cart WHERE user_id = $1 AND listing_id = $2 AND category = $3',
        [userId, listingId, category]
      );
    }
    return { success: true, message: 'Removed from cart' };
  }

  async clearCart(userId: string) {
    await this.pool.query('DELETE FROM user_cart WHERE user_id = $1', [userId]);
    return { success: true, message: 'Cart cleared' };
  }
}
