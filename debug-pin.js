
const { getDb } = require('./src/server/db');
const { eventDeviceAccess, events } = require('./src/server/db/schema');
const { eq } = require('drizzle-orm');
const crypto = require('crypto');

async function debugPairing() {
  const db = getDb();
  const accessCode = 'GJVB7S';
  const pin = '5631';

  console.log('--- Debugging Pairing ---');
  console.log('Access Code:', accessCode);
  console.log('Input PIN:', pin);

  const [row] = await db
    .select({
      eventId: eventDeviceAccess.eventId,
      pinHash: eventDeviceAccess.pinHash,
      isEnabled: eventDeviceAccess.isEnabled,
    })
    .from(eventDeviceAccess)
    .where(eq(eventDeviceAccess.accessCode, accessCode))
    .limit(1);

  if (!row) {
    console.log('ERROR: Access code not found in database.');
    return;
  }

  console.log('Access Code Found. Event ID:', row.eventId);
  console.log('Is Enabled:', row.isEnabled);
  console.log('Stored PIN Hash:', row.pinHash);

  // Manual verification logic from crypto.ts
  const parts = row.pinHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    console.log('ERROR: Invalid hash format.');
    return;
  }

  const [, salt, hash] = parts;
  const candidate = crypto.createHash('sha256').update(`${salt}:${pin}`).digest('hex');
  
  console.log('Salt:', salt);
  console.log('Expected Hash:', hash);
  console.log('Candidate Hash:', candidate);

  if (hash === candidate) {
    console.log('SUCCESS: PIN matches!');
  } else {
    console.log('FAILURE: PIN does not match.');
  }
}

debugPairing().catch(console.error).finally(() => process.exit());
