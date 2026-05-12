const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_CQviMK0fL5yc@ep-withered-violet-aq33ldv6-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkData() {
  try {
    console.log('Connecting to database...');
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', tables.rows.map(r => r.table_name).join(', '));

    // Check listings
    if (tables.rows.some(r => r.table_name === 'vendor_listings')) {
      const listings = await pool.query('SELECT * FROM vendor_listings');
      console.log(`\nFound ${listings.rows.length} listings.`);
      if (listings.rows.length > 0) {
        console.log('\nColumns in vendor_listings:', Object.keys(listings.rows[0]));
        console.log('\nFirst listing sample:', JSON.stringify(listings.rows[0], null, 2));
      } else {
        console.log('\nvendor_listings table is EMPTY.');
      }
    } else {
      console.log('\nvendor_listings table DOES NOT EXIST.');
    }

    await pool.end();
  } catch (err) {
    console.error('Error during database check:', err);
  }
}

checkData();
