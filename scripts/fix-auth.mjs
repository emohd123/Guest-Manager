import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zworeyksseoicmpthycv.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3b3JleWtzc2VvaWNtcHRoeWN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA3ODMzNiwiZXhwIjoyMDg2NjU0MzM2fQ.kDmEZKUxGxrgVUEEwDbsuMU5GWjd5B4BUmHdlO9rJHs';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3b3JleWtzc2VvaWNtcHRoeWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNzgzMzYsImV4cCI6MjA4NjY1NDMzNn0.vfEnudE5JnS08dE_-fpbJE4ggykF1Uwqm5gJPYCs3CU';

// Admin client with service role
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. List and confirm existing users
console.log('=== Listing existing users ===');
const { data: listData, error: listError } = await admin.auth.admin.listUsers();
if (listError) {
  console.log('Error listing users:', listError.message);
} else {
  const users = listData.users || [];
  console.log(`Found ${users.length} users`);
  for (const u of users) {
    console.log(`  - ${u.email} | confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'} | id: ${u.id}`);
    if (!u.email_confirmed_at) {
      const { error } = await admin.auth.admin.updateUserById(u.id, { email_confirm: true });
      console.log(`    -> ${error ? 'Failed: ' + error.message : 'Auto-confirmed!'}`);
    }
  }
}

// 2. Create a dev test user (auto-confirmed)
console.log('\n=== Creating dev test user ===');
const { data: newUser, error: createError } = await admin.auth.admin.createUser({
  email: 'dev@guestmanager.app',
  password: 'password123',
  email_confirm: true,
  user_metadata: {
    name: 'Dev Admin',
    company_name: 'Guest Manager Dev',
  },
});

if (createError) {
  console.log('Create error:', createError.message);
} else {
  console.log(`Created: ${newUser.user.email} (id: ${newUser.user.id})`);
}

// 3. Test sign in with the new user
console.log('\n=== Testing sign in ===');
const anonClient = createClient(SUPABASE_URL, ANON_KEY);
const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
  email: 'dev@guestmanager.app',
  password: 'password123',
});

if (signInError) {
  console.log('Sign in error:', signInError.message);
} else {
  console.log('Sign in SUCCESS!');
  console.log('  Email:', signInData.user?.email);
  console.log('  Session:', signInData.session ? 'YES' : 'NO');
}

// 4. Test fresh signup with email confirm off
console.log('\n=== Testing fresh signup (email confirm should be OFF) ===');
const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
  email: 'signuptest@gmail.com',
  password: 'TestPass123',
  options: {
    data: { name: 'Signup Tester', company_name: 'Signup Co' },
  },
});

if (signUpError) {
  console.log('Signup error:', signUpError.message);
} else {
  console.log('Signup result:');
  console.log('  Has session:', signUpData.session ? 'YES (auto-confirmed!)' : 'NO (still needs email)');
  if (signUpData.session) {
    console.log('  Email:', signUpData.user?.email);
  }
}

console.log('\nDone! You can now log in at http://localhost:3000/login');
console.log('  Email: dev@guestmanager.app');
console.log('  Password: password123');
