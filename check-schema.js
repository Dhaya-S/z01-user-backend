const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/z01_db' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_cart';")
  .then(res => { console.log(res.rows); pool.end(); })
  .catch(err => { console.error(err); pool.end(); });
