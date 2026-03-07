import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from './src/server/db/index.js';
import { exportCheckinsCsv, exportArrivalsCsv } from './src/server/services/checkin/scan-service.js';

async function test() {
  const db = getDb();
  console.log('Testing exportCheckinsCsv...');
  const checkins = await exportCheckinsCsv(db, {
    eventId: '5378a421-a3e7-43ca-accd-43a5c842f124',
    companyId: '42fa0a7b-4b4f-4389-b472-0404310d1bc7',
  });
  console.log('Checkins CSV lengths:', checkins.length);
  
  console.log('Testing exportArrivalsCsv...');
  const arrivals = await exportArrivalsCsv(db, {
    eventId: '5378a421-a3e7-43ca-accd-43a5c842f124',
    companyId: '42fa0a7b-4b4f-4389-b472-0404310d1bc7',
  });
  console.log('Arrivals CSV lengths:', arrivals.length);
  process.exit(0);
}
test().catch(console.error);
