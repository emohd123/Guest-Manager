const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zworeyksseoicmpthycv:yAKSR32MoeZ6dgZC@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT 1');
    console.log("SUCCESS PG:", res.rows[0]);
  } catch (err) {
    console.error('Connection error', err);
  } finally {
    await client.end();
  }
}

run();
