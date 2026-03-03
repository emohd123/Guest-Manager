const postgres = require('postgres');

const sql = postgres('postgresql://postgres.zworeyksseoicmpthycv:yAKSR32MoeZ6dgZC@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', {
  prepare: false,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const result = await sql`SELECT current_database(), current_user, version()`;
    console.log("✅ SUCCESS:", result[0]);
  } catch(e) {
    console.error("❌ FAILED:", e.message);
  } finally {
    process.exit(0);
  }
}

test();
