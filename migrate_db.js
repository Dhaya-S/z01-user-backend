const { Pool } = require('pg');
require('dotenv').config();

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Running ALTER TABLE statements...');
    
    await pool.query('ALTER TABLE users ALTER COLUMN email DROP NOT NULL;');
    console.log('Dropped NOT NULL on email');
    
    await pool.query('ALTER TABLE users ALTER COLUMN password DROP NOT NULL;');
    console.log('Dropped NOT NULL on password');
    
    await pool.query('ALTER TABLE users ALTER COLUMN name DROP NOT NULL;');
    console.log('Dropped NOT NULL on name');

    console.log('Migrations complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
