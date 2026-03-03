const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  await pool.query(`
    ALTER TABLE events ADD COLUMN IF NOT EXISTS visitor_code varchar(10) UNIQUE;
  `);
  console.log('Column visitor_code ensured');

  const res = await pool.query(`
    UPDATE events
    SET visitor_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
    WHERE visitor_code IS NULL
    RETURNING id, visitor_code;
  `);
  console.log('Codes generated for', res.rowCount, 'events');
  res.rows.forEach(r => console.log(' -', r.id, '->', r.visitor_code));
  await pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
