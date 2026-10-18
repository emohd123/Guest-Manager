-- Lock down the exposed Data API. Application reads and mutations run through
-- authenticated server routes using the service-role client; browsers are not
-- granted broad table access.

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.event_sessions enable row level security;
alter table public.events enable row level security;
alter table public.venues enable row level security;
alter table public.categories enable row level security;
alter table public.contacts enable row level security;
alter table public.list_contacts enable row level security;
alter table public.lists enable row level security;
alter table public.guests enable row level security;
alter table public.check_ins enable row level security;
alter table public.ticket_types enable row level security;
alter table public.ticket_templates enable row level security;
alter table public.tickets enable row level security;
alter table public.order_items enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.promotions enable row level security;
alter table public.scans enable row level security;
alter table public.campaigns enable row level security;
alter table public.form_responses enable row level security;
alter table public.devices enable row level security;
alter table public.data_imports enable row level security;
alter table public.event_device_access enable row level security;
alter table public.device_pair_tokens enable row level security;
alter table public.device_commands enable row level security;
alter table public.mobile_mutation_dedup enable row level security;
alter table public.sent_emails enable row level security;
alter table public.visitor_messages enable row level security;
alter table public.visitor_notifications enable row level security;
alter table public.seating_plans enable row level security;
alter table public.seat_sections enable row level security;
alter table public.seat_rows enable row level security;
alter table public.reserved_seats enable row level security;
alter table public.seat_holds enable row level security;

-- A signed-in person may read only their own application-user record. There
-- is deliberately no direct write policy: role, company, and access changes
-- are made only by authenticated server endpoints.
drop policy if exists "Users can view their own application record" on public.users;
create policy "Users can view their own application record"
on public.users
for select
to authenticated
using ((select auth.uid()) = id);

-- Public event media remains readable, but browser-side uploads, updates, and
-- deletions are restricted to full dashboard users. This prevents ordinary
-- attendees from turning the public bucket into arbitrary file storage.
drop policy if exists "Authenticated Upload to Events" on storage.objects;
drop policy if exists "Authenticated Update on Events" on storage.objects;
drop policy if exists "Authenticated Delete from Events" on storage.objects;
drop policy if exists "Full dashboard users upload event media" on storage.objects;
drop policy if exists "Full dashboard users update event media" on storage.objects;
drop policy if exists "Full dashboard users delete event media" on storage.objects;

create policy "Full dashboard users upload event media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'events'
  and exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and (u.dashboard_access = 'full' or u.role in ('owner', 'admin'))
  )
);

create policy "Full dashboard users update event media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'events'
  and exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and (u.dashboard_access = 'full' or u.role in ('owner', 'admin'))
  )
)
with check (
  bucket_id = 'events'
  and exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and (u.dashboard_access = 'full' or u.role in ('owner', 'admin'))
  )
);

create policy "Full dashboard users delete event media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'events'
  and exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and (u.dashboard_access = 'full' or u.role in ('owner', 'admin'))
  )
);
