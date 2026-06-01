const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_CQviMK0fL5yc@ep-withered-violet-aq33ldv6-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    await client.connect();
    console.log("Connected");

    await client.query('BEGIN');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS kyc_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        full_name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        dob VARCHAR(50),
        address TEXT,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Table created or exists");

    // Try finding user 1 just to see
    const existingUser = await client.query('SELECT id FROM users LIMIT 1');
    const user_id = existingUser.rows[0]?.id;
    console.log("Found user:", user_id);

    if (user_id) {
      const existingKyc = await client.query('SELECT id FROM kyc_records WHERE user_id = $1', [user_id]);
      if (existingKyc.rows.length === 0) {
        await client.query(
          'INSERT INTO kyc_records (user_id, full_name, phone, email, dob, address, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [user_id, 'Test Name', '12345', 'test@test.com', '1990', 'address', 'completed']
        );
        console.log("Inserted kyc record");
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("ERROR:", err);
  } finally {
    await client.end();
  }
}

test();
