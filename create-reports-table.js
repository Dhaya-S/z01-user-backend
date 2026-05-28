import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createTable() {
  try {
    console.log('Connecting to database...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER REFERENCES vendor_listings(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Reports table created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating reports table:', error);
    process.exit(1);
  }
}

createTable();
