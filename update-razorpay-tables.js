import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function updateDB() {
  try {
    console.log('Connecting to database for updates...');

    // Add razorpay_account_id to vendors table
    await pool.query(`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS razorpay_account_id VARCHAR(255);
    `);
    console.log('vendors table updated with razorpay_account_id.');

    // Add deposit_percentage to vendor_listings table
    await pool.query(`
      ALTER TABLE vendor_listings 
      ADD COLUMN IF NOT EXISTS deposit_percentage DECIMAL(5, 2) DEFAULT 100.00;
    `);
    console.log('vendor_listings table updated with deposit_percentage.');

    // Add Razorpay fields to bookings table
    await pool.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS razorpay_transfer_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS work_completed_date TIMESTAMP;
    `);
    console.log('bookings table updated with payment fields.');

    console.log('Database updates complete.');
    process.exit(0);
  } catch (error) {
    console.error('Database update failed:', error);
    process.exit(1);
  }
}

updateDB();
