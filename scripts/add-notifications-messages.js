const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // 1. visitor_notifications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitor_notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
      recipient_email varchar(255), -- NULL = broadcast to all event guests
      title varchar(255) NOT NULL,
      body text NOT NULL,
      type varchar(50) NOT NULL DEFAULT 'event_update',
      is_read boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `);
  console.log('✅ visitor_notifications table created');

  // 2. visitor_messages table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitor_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
      guest_email varchar(255) NOT NULL,
      guest_name varchar(255),
      subject varchar(255),
      body text NOT NULL,
      is_read boolean NOT NULL DEFAULT false,
      admin_reply text,
      replied_at timestamp,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `);
  console.log('✅ visitor_messages table created');

  // 3. Indexes for fast lookup
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_visitor_notifs_email ON visitor_notifications(recipient_email);
    CREATE INDEX IF NOT EXISTS idx_visitor_notifs_event ON visitor_notifications(event_id);
    CREATE INDEX IF NOT EXISTS idx_visitor_msgs_event ON visitor_messages(event_id);
    CREATE INDEX IF NOT EXISTS idx_visitor_msgs_email ON visitor_messages(guest_email);
  `);
  console.log('✅ Indexes created');

  await pool.end();
  console.log('Done!');
}
run().catch(e => { console.error(e.message); pool.end(); });
