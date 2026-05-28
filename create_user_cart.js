import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_cart (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        listing_id INTEGER NOT NULL,
        category VARCHAR(50) NOT NULL,
        listing_title VARCHAR(255),
        price DECIMAL(10, 2),
        image_1 VARCHAR(255),
        location_address VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('user_cart table created');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
