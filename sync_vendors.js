const { Pool } = require('pg');
const Razorpay = require('razorpay');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function syncVendors() {
  try {
    const { rows } = await pool.query(`
      SELECT v.id as vendor_id, v.company_name, v.email, b.account_holder_name, b.bank_name, b.account_number, b.ifsc_code 
      FROM vendors v 
      JOIN vendor_bank_details b ON v.id = b.vendor_id 
      WHERE v.razorpay_account_id IS NULL
    `);

    console.log(`Found ${rows.length} vendors missing Razorpay Account IDs.`);

    for (const row of rows) {
      console.log(`Creating Razorpay account for vendor ID ${row.vendor_id}...`);
      
      const accountData = {
        name: row.account_holder_name || row.company_name || 'Vendor',
        email: row.email,
        tnc_accepted: true,
        account_details: {
          business_name: row.company_name || 'Vendor Business',
          business_type: 'individual'
        },
        bank_account: {
          ifsc_code: row.ifsc_code,
          beneficiary_name: row.account_holder_name,
          account_type: 'current',
          account_number: row.account_number
        }
      };

      try {
        const account = await razorpay.accounts.create(accountData);
        await pool.query('UPDATE vendors SET razorpay_account_id = $1 WHERE id = $2', [account.id, row.vendor_id]);
        console.log(`Successfully linked Vendor ${row.vendor_id} with Razorpay ID: ${account.id}`);
      } catch (err) {
        console.error(`Failed to create account for Vendor ${row.vendor_id}:`, err?.error || err);
      }
    }

    console.log('Sync complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncVendors();
