import { getDb } from "../src/server/db";
import { sentEmails } from "../src/server/db/schema";
import { desc } from "drizzle-orm";

async function run() {
  const db = getDb();
  const recentEmails = await db.select().from(sentEmails).orderBy(desc(sentEmails.createdAt)).limit(1);
  if (recentEmails.length > 0) {
    console.log(recentEmails[0].resendId);
  }
  process.exit(0);
}

run();
