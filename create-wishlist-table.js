import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createWishlistTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_wishlist (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        listing_id INTEGER REFERENCES vendor_listings(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, listing_id)
      );
    `);
    console.log('user_wishlist table created successfully');
  } catch (error) {
    console.error('Error creating user_wishlist table:', error);
  } finally {
    await pool.end();
  }
}

createWishlistTable();
