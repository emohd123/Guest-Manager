-- Applied to Supabase as migration 20261110110038.
-- Server-owned push destinations. Device secrets are stored only as hashes.
create table public.notification_devices (
  id uuid primary key,
  secret_hash text not null check (length(secret_hash) = 64),
  token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  user_id uuid references auth.users(id) on delete cascade,
  recipient_email text,
  conference_event_id uuid references public.events(id) on delete cascade,
  conference_role text check (conference_role in ('attendee', 'speaker')),
  conference_expires_at timestamptz,
  event_updates boolean not null default true,
  new_events boolean not null default false,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create index notification_devices_email_idx on public.notification_devices(recipient_email) where enabled;
create index notification_devices_conference_idx on public.notification_devices(conference_event_id, conference_expires_at);
create index notification_devices_user_idx on public.notification_devices(user_id);
alter table public.notification_devices enable row level security;
revoke all on public.notification_devices from public, anon, authenticated;
grant select, insert, update, delete on public.notification_devices to service_role;
