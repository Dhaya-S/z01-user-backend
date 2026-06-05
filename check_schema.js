const { Pool } = require('pg');
require('dotenv').config();

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const otps = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'otps';
    `);
    console.log('OTPS TABLE:');
    console.table(otps.rows);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkSchema();
