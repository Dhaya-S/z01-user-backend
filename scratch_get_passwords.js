const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_CQviMK0fL5yc@ep-withered-violet-aq33ldv6-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const res = await pool.query("SELECT email, password FROM users");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error(err);
  }
}

run();
