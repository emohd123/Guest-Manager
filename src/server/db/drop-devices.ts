import { getDb } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Dropping legacy devices table...");
  const db = getDb();
  try {
    await db.execute(sql`DROP TABLE IF EXISTS devices CASCADE;`);
    console.log("Dropped devices table successfully.");
  } catch (error) {
    console.error("Error dropping table:", error);
  }
  process.exit(0);
}

main();
