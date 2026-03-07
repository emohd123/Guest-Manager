
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const crypto = require('crypto');

async function debugPin() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } });
  
  const accessCode = 'GJVB7S';
  const pin = '5631';

  try {
    const rows = await sql`
      SELECT event_id, pin_hash, is_enabled 
      FROM event_device_access 
      WHERE access_code = ${accessCode}
    `;

    if (rows.length === 0) {
      console.log('Access code not found');
      return;
    }

    const row = rows[0];
    console.log('Found row:', row);

    const storedHash = row.pin_hash;
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'v1') {
      console.log('Invalid hash format');
      return;
    }

    const [, salt, hash] = parts;
    const candidate = crypto.createHash('sha256').update(`${salt}:${pin}`).digest('hex');
    
    console.log('Candidate hash:', candidate);
    console.log('Stored hash:   ', hash);
    console.log('Match:', candidate === hash);

  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

debugPin();
