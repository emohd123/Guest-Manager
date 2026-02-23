import postgres from 'postgres';
import dns from 'dns';

// Force IPv6 since Supabase only provides IPv6 for direct connections
dns.setDefaultResultOrder('verbatim');

const client = postgres('postgresql://postgres:yAKSR32MoeZ6dgZC@db.zworeyksseoicmpthycv.supabase.co:5432/postgres', {
  connect_timeout: 15,
});

try {
  const users = await client`SELECT id, email, email_confirmed_at, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10`;

  console.log('Recent users:');
  if (users.length === 0) {
    console.log('  (no users found)');
  } else {
    users.forEach(u => console.log(`  - ${u.email} | confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'} | created: ${u.created_at}`));
  }

  // Auto-confirm any unconfirmed users
  const unconfirmed = users.filter(u => !u.email_confirmed_at);
  if (unconfirmed.length > 0) {
    console.log(`\nAuto-confirming ${unconfirmed.length} unconfirmed users...`);
    for (const u of unconfirmed) {
      await client`UPDATE auth.users SET email_confirmed_at = now() WHERE id = ${u.id}`;
      console.log(`  Confirmed: ${u.email}`);
    }
  }

  console.log('\nDone!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await client.end();
}
