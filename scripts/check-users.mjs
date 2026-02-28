import postgres from 'postgres';
import dns from 'dns';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;
const shouldConfirm = process.argv.includes('--confirm-unverified');

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in .env.local');
  process.exit(1);
}

// Supabase direct connections often require IPv6 resolution behavior.
dns.setDefaultResultOrder('verbatim');

const sql = postgres(databaseUrl, {
  connect_timeout: 15,
  prepare: false,
});

try {
  const users = await sql`
    select id, email, email_confirmed_at, created_at
    from auth.users
    order by created_at desc
    limit 50
  `;

  console.log('Recent auth.users:');
  if (users.length === 0) {
    console.log('  (no users found)');
  } else {
    for (const user of users) {
      console.log(
        `  - ${user.email} | confirmed: ${user.email_confirmed_at ? 'YES' : 'NO'} | created: ${user.created_at}`
      );
    }
  }

  if (!shouldConfirm) {
    console.log('\nRun with --confirm-unverified to update pending users.');
    process.exit(0);
  }

  const pending = users.filter((user) => !user.email_confirmed_at);
  if (pending.length === 0) {
    console.log('\nNo unverified users to confirm.');
    process.exit(0);
  }

  console.log(`\nConfirming ${pending.length} user(s)...`);
  for (const user of pending) {
    await sql`update auth.users set email_confirmed_at = now() where id = ${user.id}`;
    console.log(`  Confirmed: ${user.email}`);
  }

  console.log('\nDone.');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
