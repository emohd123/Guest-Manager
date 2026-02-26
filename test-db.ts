import { getDb } from './src/server/db';
import { guests } from './src/server/db/schema';

// We need to load env vars for TSX if they aren't auto-loaded
import 'dotenv/config';

async function main() {
  try {
    const db = getDb();
    const res = await db.insert(guests).values({
      eventId: 'a1c4c907-388b-4a39-84c4-b89f520d3ef6',
      companyId: '42fa0a7b-4b4f-4389-b472-0404310d1bc7',
      firstName: 'Ebrahim',
      lastName: 'Mohamed',
      email: 'emohd123@hotmail.com',
      phone: '+97336357377',
      tableNumber: '1',
      seatNumber: '3',
      guestType: 'VIP',
      source: 'manual'
    }).returning();
    console.log("SUCCESS:", res);
  } catch (err: any) {
    console.log("DB_ERROR_FULL:");
    console.dir(err, { depth: null });
  } finally {
    process.exit();
  }
}
main();
