require('dotenv').config({path: '.env.local'});
const { getDb } = require('./src/server/db');
const { getDeviceStats } = require('./src/server/services/checkin');

async function run() {
  const db = getDb();
  const eventId = '5378a421-a3e7-43ca-accd-43a5c842f124';
  const companyId = '42fa0a7b-4b4f-4389-b472-0404310d1bc7';
  console.log("Fetching stats...");
  const stats = await getDeviceStats(db, eventId, companyId);
  console.log(stats);
  process.exit(0);
}
run().catch(console.error);
