-- Refresh only the two named demo conferences; no real-event records change.
begin;

update public.events
set starts_at = timestamp '2026-11-05 09:00:00',
    ends_at = timestamp '2026-11-06 18:00:00',
    timezone = 'Asia/Bahrain',
    settings = jsonb_set(
      coalesce(replace(settings::text, 'https://events-hub-vert.vercel.app', 'https://www.iticket.info')::jsonb, '{}'::jsonb),
      '{publicPage}',
      coalesce(settings->'publicPage', '{}'::jsonb) || jsonb_build_object(
        'venueName', 'Exhibition World Bahrain',
        'locationText', 'Sakhir, Bahrain',
        'mapUrl', 'https://www.google.com/maps/search/?api=1&query=Exhibition%20World%20Bahrain'
      )
    ),
    updated_at = now()
where id = 'e7000000-0000-4000-8000-000000000001';

update public.event_sessions
set starts_at = starts_at + interval '21 days',
    ends_at = ends_at + interval '21 days'
where event_id = 'e7000000-0000-4000-8000-000000000001'
  and starts_at >= timestamp '2026-10-15' and starts_at < timestamp '2026-10-17';

update public.events
set starts_at = timestamp '2026-11-12 09:00:00',
    ends_at = timestamp '2026-11-12 18:00:00',
    timezone = 'Asia/Bahrain', visitor_code = 'TECH2026', updated_at = now()
where id = 'e1111111-1111-4111-8111-111111111111';

update public.event_sessions
set starts_at = starts_at + interval '120 days', ends_at = ends_at + interval '120 days'
where event_id = 'e1111111-1111-4111-8111-111111111111'
  and starts_at >= timestamp '2026-07-15' and starts_at < timestamp '2026-07-16';

update public.guests g
set guest_type = d.role,
    custom_data = coalesce(g.custom_data, '{}'::jsonb) || jsonb_build_object(
      'conferenceRole', d.role, 'accessUsername', d.username,
      'accessCode', d.code, 'position', d.position, 'organization', d.organization
    ),
    updated_at = now()
from (values
  ('Demo', 'Demo Attendee', 'DEMO2026', 'guest', 'VIP Delegate', 'Bahrain Demo Company'),
  ('Lina', 'Lina Horizon', 'LINA2026', 'speaker', 'Chief Executive Officer', 'Vision Labs Demo'),
  ('Omar', 'Omar Nova', 'OMAR2026', 'speaker', 'Chief Product Officer', 'Nova Systems Demo'),
  ('Maya', 'Maya Cedar', 'MAYA2026', 'speaker', 'Community Strategy Director', 'Connective Demo'),
  ('Zayd', 'Zayd Atlas', 'ZAYD2026', 'speaker', 'Investor', 'Atlas Ventures Demo')
) as d(first_name, username, code, role, position, organization)
where g.event_id = 'e7000000-0000-4000-8000-000000000001'
  and g.first_name = d.first_name;

insert into public.ticket_types(company_id,event_id,name,description,price,currency,status)
select company_id,id,'Conference Access','Private conference credential and QR entry pass',0,'BHD','active'
from public.events e
where e.id = 'e7000000-0000-4000-8000-000000000001'
  and not exists(select 1 from public.ticket_types t where t.event_id=e.id and t.name='Conference Access');

insert into public.tickets(company_id,event_id,ticket_type_id,guest_id,barcode,barcode_type,status,attendee_name,attendee_email,metadata)
select g.company_id,g.event_id,t.id,g.id,
  'CONF-DEMO-' || replace(g.id::text, '-', ''),'qr','valid',
  trim(g.first_name || ' ' || coalesce(g.last_name,'')),g.email,
  jsonb_build_object('conferenceCredential',true,'conferenceRole',g.custom_data->>'conferenceRole')
from public.guests g
join public.ticket_types t on t.event_id=g.event_id and t.name='Conference Access'
where g.event_id = 'e7000000-0000-4000-8000-000000000001'
  and g.custom_data->>'accessCode' is not null
  and not exists(select 1 from public.tickets existing where existing.guest_id=g.id and existing.event_id=g.event_id and existing.status='valid');

commit;
