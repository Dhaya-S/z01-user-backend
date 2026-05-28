const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_CQviMK0fL5yc@ep-withered-violet-aq33ldv6-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function addFcmTokenColumn() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;");
    console.log('Successfully added fcm_token column to users table.');
    await pool.end();
  } catch (err) {
    console.error('Error adding fcm_token column:', err);
  }
}

addFcmTokenColumn();
