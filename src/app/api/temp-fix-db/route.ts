import postgres from "postgres";
import { NextResponse } from "next/server";

export async function GET() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ success: false, error: "DATABASE_URL is not set" }, { status: 500 });
  }

  const sql = postgres(connectionString, {
    prepare: false,
    ssl: { rejectUnauthorized: false },
  });

  const log: string[] = [];
  try {
    log.push("Connecting to database...");
    
    // Check if company_id exists on users table
    log.push("Checking for 'company_id' column on 'users' table...");
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'company_id'
    `;

    if (columnExists.length === 0) {
      log.push("'company_id' column missing. Attempting to add it...");
      
      // We add it without NOT NULL first to avoid issues with existing data
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id uuid;`;
      log.push("Column added.");

      // Check if companies table exists to add foreign key
      const companiesExist = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'companies'`;
      if (companiesExist.length > 0) {
        log.push("Adding foreign key constraint...");
        await sql`
          ALTER TABLE users 
          ADD CONSTRAINT users_company_id_companies_id_fk 
          FOREIGN KEY (company_id) REFERENCES companies(id) 
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        `.catch(e => log.push("Constraint already exists or error: " + e.message));
      }
    } else {
      log.push("'company_id' column already exists.");
    }

    return NextResponse.json({ success: true, log });
  } catch (err: any) {
    console.error("Migration failed:", err);
    return NextResponse.json({ success: false, error: err.message, log }, { status: 500 });
  } finally {
    await sql.end();
  }
}
