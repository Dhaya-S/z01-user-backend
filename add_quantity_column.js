const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function addQuantityColumn() {
  try {
    console.log('Connecting to database...');
    await pool.query(`
      ALTER TABLE user_cart 
      ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
    `);
    console.log('Successfully added quantity column to user_cart table.');
    process.exit(0);
  } catch (error) {
    console.error('Error adding column:', error);
    process.exit(1);
  }
}

addQuantityColumn();
