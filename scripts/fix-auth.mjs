import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const shouldConfirm = process.argv.includes('--confirm-unverified');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('=== Listing auth users ===');
  const { data, error } = await admin.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error.message);
    process.exit(1);
  }

  const users = data.users || [];
  console.log(`Found ${users.length} users`);

  for (const user of users) {
    console.log(
      `- ${user.email} | confirmed: ${user.email_confirmed_at ? 'YES' : 'NO'} | id: ${user.id}`
    );
  }

  if (!shouldConfirm) {
    console.log('\nRun with --confirm-unverified to auto-confirm pending users.');
    return;
  }

  const pending = users.filter((u) => !u.email_confirmed_at);
  if (pending.length === 0) {
    console.log('\nNo unverified users to confirm.');
    return;
  }

  console.log(`\nAuto-confirming ${pending.length} user(s)...`);
  for (const user of pending) {
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (updateError) {
      console.error(`  Failed: ${user.email} -> ${updateError.message}`);
    } else {
      console.log(`  Confirmed: ${user.email}`);
    }
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
