
const postgres = require('postgres');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testConnection() {
  // Try pooler port 6543
  const poolerUrl = 'postgresql://postgres.zworeyksseoicmpthycv:yAKSR32MoeZ6dgZC@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require';
  console.log('Testing pooler connection to port 6543');
  
  const sql = postgres(poolerUrl, {
    prepare: false,
    connect_timeout: 10,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const start = Date.now();
    const result = await sql`SELECT 1 as connected`;
    console.log('Connected successfully in', Date.now() - start, 'ms');
    console.log('Result:', result);
    
    const userResult = await sql`SELECT id, company_id FROM public.users WHERE id = '1b304c69-c7be-478a-a8e8-7071715f7fa3' LIMIT 1`;
    console.log('User query result:', userResult);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await sql.end();
  }
}

testConnection();
