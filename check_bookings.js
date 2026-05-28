const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_CQviMK0fL5yc@ep-withered-violet-aq33ldv6-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkBookings() {
  try {
    console.log('Connecting to database...');
    
    const bookings = await pool.query(`
      SELECT b.*, v.listing_title as listing_name, v.category as listing_type, v.image_1, v.location_address, v.latitude, v.longitude, ven.company_name as vendor_company_name, ven.contact_person as vendor_contact_person, ven.phone as vendor_phone 
      FROM bookings b 
      LEFT JOIN vendor_listings v ON b.listing_id = v.id 
      LEFT JOIN vendors ven ON v.vendor_id = ven.id
      ORDER BY b.created_at DESC
    `);
    
    console.log(`Found ${bookings.rows.length} bookings.`);
    if (bookings.rows.length > 0) {
      console.log('Sample booking:', JSON.stringify(bookings.rows[0], null, 2));
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkBookings();
