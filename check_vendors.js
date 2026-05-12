const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_CQviMK0fL5yc@ep-withered-violet-aq33ldv6-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkVendors() {
  try {
    const res = await pool.query('SELECT * FROM vendors LIMIT 1');
    if (res.rows.length > 0) {
      console.log('Vendor Columns:', Object.keys(res.rows[0]));
    } else {
      const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'vendors'");
      console.log('Vendor Columns (from schema):', cols.rows.map(r => r.column_name));
    }
    await pool.end();
  } catch (err) {
    console.error(err);
  }
}

checkVendors();
