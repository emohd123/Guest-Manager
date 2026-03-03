import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from './src/server/db/index.js';
import { getArrivals, getCheckinSummary } from './src/server/services/checkin/scan-service.js';

async function test() {
  const db = getDb();
  console.log('Testing arrivals...');
  const arrivals = await getArrivals(db, {
    eventId: '5378a421-a3e7-43ca-accd-43a5c842f124',
    companyId: '42fa0a7b-4b4f-4389-b472-0404310d1bc7',
  });
  console.log('Arrivals:', arrivals.scans.length);
  
  console.log('Testing checkin summary...');
  const summary = await getCheckinSummary(db, {
    eventId: '5378a421-a3e7-43ca-accd-43a5c842f124',
    companyId: '42fa0a7b-4b4f-4389-b472-0404310d1bc7',
  });
  console.log('Summary:', summary);
  process.exit(0);
}
test().catch(console.error);
