const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    const vendors = await pool.query('SELECT * FROM vendors ORDER BY id DESC LIMIT 2');
    console.log('--- RECENT VENDORS FULL ---');
    console.log(vendors.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
