require('dotenv/config');
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  try {
    const res = await sql`
      select table_schema, table_name, column_name, data_type 
      from information_schema.columns 
      where column_name = 'event_id' and data_type != 'uuid'
    `;
    console.log(res);
  } catch(e) { console.error(e); }
  process.exit();
}
run();
