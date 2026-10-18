-- Stage 3: protect application identity and the public marketplace catalog.
-- Browser clients may read only their own application identity and published,
-- visible marketplace records. Dashboard and mutation routes use the server
-- service-role client after verifying the signed-in user and company.

alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.events enable row level security;
alter table public.ticket_types enable row level security;

drop policy if exists "Users can view their own application record" on public.users;
create policy "Users can view their own application record"
on public.users
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Dashboard users can view their company" on public.companies;
create policy "Dashboard users can view their company"
on public.companies
for select
to authenticated
using (
  id = (
    select application_user.company_id
    from public.users application_user
    where application_user.id = (select auth.uid())
  )
);

drop policy if exists "Public can view published marketplace events" on public.events;
create policy "Public can view published marketplace events"
on public.events
for select
to anon, authenticated
using (
  status = 'published'
  and deleted_at is null
  and event_type is distinct from 'conference'
  and coalesce((settings -> 'publicPage' ->> 'enabled')::boolean, true)
  and coalesce((settings -> 'publicPage' ->> 'showInMarketplace')::boolean, true)
);

drop policy if exists "Dashboard users can view company events" on public.events;
create policy "Dashboard users can view company events"
on public.events
for select
to authenticated
using (
  company_id = (
    select application_user.company_id
    from public.users application_user
    where application_user.id = (select auth.uid())
  )
);

drop policy if exists "Public can view active tickets for public events" on public.ticket_types;
create policy "Public can view active tickets for public events"
on public.ticket_types
for select
to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.events event
    where event.id = ticket_types.event_id
      and event.status = 'published'
      and event.deleted_at is null
      and event.event_type is distinct from 'conference'
      and coalesce((event.settings -> 'publicPage' ->> 'enabled')::boolean, true)
      and coalesce((event.settings -> 'publicPage' ->> 'showInMarketplace')::boolean, true)
  )
);

drop policy if exists "Dashboard users can view company ticket types" on public.ticket_types;
create policy "Dashboard users can view company ticket types"
on public.ticket_types
for select
to authenticated
using (
  company_id = (
    select application_user.company_id
    from public.users application_user
    where application_user.id = (select auth.uid())
  )
);
