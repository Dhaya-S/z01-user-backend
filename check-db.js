const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_XF3h4LtvxRcw@ep-snowy-breeze-a875y20c-pooler.eastus2.azure.neon.tech/neondb?sslmode=require'
});

pool.query(`SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id'`)
  .then(res => {
    console.log("ROWS:", JSON.stringify(res.rows));
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
