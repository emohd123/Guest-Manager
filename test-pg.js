require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  const sql = postgres(connectionString, {
    prepare: false,
    connect_timeout: 15,
    ssl: { rejectUnauthorized: false },
  });
  
  try {
    console.log("Adding company_id column...");
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);`;
    console.log("Successfully added company_id column.");
  } catch (err) {
    console.error("Failed to add column:", err);
  } finally {
    await sql.end();
  }
}

run();
