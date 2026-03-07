import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from './src/server/db/index.js';
import { sql, and, eq } from 'drizzle-orm';
import { ticketTypes, tickets, guests, scans } from './src/server/db/schema/index.js';

async function test() {
  const db = getDb();
  const eventId = '5378a421-a3e7-43ca-accd-43a5c842f124';
  const companyId = '42fa0a7b-4b4f-4389-b472-0404310d1bc7';

  const checkinsByTicketTypeRows = await db
    .select({
      id: ticketTypes.id,
      name: ticketTypes.name,
      checkedIn: sql<number>`count(${tickets.id}) filter (where ${guests.attendanceState} = 'checked_in')`.mapWith(Number),
      checkedOut: sql<number>`count(${tickets.id}) filter (where ${guests.attendanceState} = 'checked_out')`.mapWith(Number),
      noShow: sql<number>`count(${tickets.id}) filter (where ${guests.status} = 'no_show')`.mapWith(Number),
      total: sql<number>`count(${tickets.id})`.mapWith(Number),
    })
    .from(ticketTypes)
    .leftJoin(tickets, eq(ticketTypes.id, tickets.ticketTypeId))
    .leftJoin(guests, eq(tickets.guestId, guests.id))
    .where(and(eq(ticketTypes.eventId, eventId), eq(ticketTypes.companyId, companyId)))
    .groupBy(ticketTypes.id, ticketTypes.name)
    .orderBy(ticketTypes.name);

  console.log('Ticket types:', checkinsByTicketTypeRows);

  const rawTimeSeries = await db.execute(sql`
    SELECT 
      date_trunc('hour', scanned_at) as "hour",
      count(*) filter (where scan_type <> 'invalid') as "success",
      count(*) filter (where scan_type = 'invalid') as "failure"
    FROM scans
    WHERE event_id = ${eventId} AND company_id = ${companyId}
    GROUP BY 1
    ORDER BY 1 ASC
  `);
  
  console.log('Time series: ', rawTimeSeries.rows);

  process.exit();
}

test().catch(console.error);
