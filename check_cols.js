import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendor_listings'
    `);
    console.log('Columns in vendor_listings:', res.rows);
    
    // Check if avg_rating exists
    const hasAvgRating = res.rows.some(r => r.column_name === 'avg_rating');
    if (!hasAvgRating) {
      console.log('Adding avg_rating column to vendor_listings...');
      await pool.query('ALTER TABLE vendor_listings ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT 0.0');
      console.log('avg_rating column added.');
    } else {
      console.log('avg_rating column already exists.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
