import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const sql = postgres('postgresql://postgres:yAKSR32MoeZ6dgZC@db.zworeyksseoicmpthycv.supabase.co:5432/postgres');

  const email = 'emohd123@gmail.com';
  const eventId = 'a1c4c907-388b-4a39-84c4-b89f520d3ef6';

  const guestRes = await sql`SELECT id, company_id, first_name, last_name FROM guests WHERE email = ${email} AND event_id = ${eventId} LIMIT 1`;
  if (guestRes.length === 0) {
    console.log('Guest not found');
    process.exit(1);
  }
  const guest = guestRes[0];
  console.log('Found guest:', guest.id);

  const tktRes = await sql`SELECT id FROM tickets WHERE guest_id = ${guest.id} LIMIT 1`;
  if (tktRes.length > 0) {
    console.log('Ticket already exists:', tktRes[0].id);
    process.exit(0);
  }

  const typesRes = await sql`SELECT id FROM ticket_types WHERE event_id = ${eventId} LIMIT 1`;
  if (typesRes.length === 0) {
      console.log('No ticket types found');
      process.exit(1);
  }
  const ticketType = typesRes[0];

  const ticketId = uuidv4();
  const orderId = uuidv4();
  const barcode = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const attendeeName = `${guest.first_name || ''} ${guest.last_name || ''}`.trim();

  await sql`
    INSERT INTO tickets (id, company_id, event_id, ticket_type_id, guest_id, order_id, barcode, status, attendee_name, attendee_email)
    VALUES (${ticketId}, ${guest.company_id}, ${eventId}, ${ticketType.id}, ${guest.id}, ${orderId}, ${barcode}, 'valid', ${attendeeName}, ${email})
  `;

  console.log('Created ticket:', ticketId);
  process.exit(0);
}

main().catch(console.error);
