-- Staged protection for the first production-sensitive data set.
-- These tables are accessed only through server routes using the service-role
-- client, so there are intentionally no browser-facing policies.

alter table public.contacts enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.form_responses enable row level security;
alter table public.guests enable row level security;
alter table public.order_items enable row level security;
alter table public.orders enable row level security;
alter table public.scans enable row level security;
alter table public.sent_emails enable row level security;
alter table public.subscriptions enable row level security;
alter table public.tickets enable row level security;

-- Scanner pairing, device telemetry, and import data are also handled by
-- authenticated server routes or device-token APIs, never by PostgREST.
alter table public.check_ins enable row level security;
alter table public.devices enable row level security;
alter table public.data_imports enable row level security;
alter table public.event_device_access enable row level security;
alter table public.device_pair_tokens enable row level security;
alter table public.device_commands enable row level security;
alter table public.mobile_mutation_dedup enable row level security;

-- Seat holding and ticket scanning are invoked by server-side service-role
-- clients. Never expose these SECURITY DEFINER functions through PostgREST.
revoke execute on function public.finalize_seat_hold(uuid, uuid, uuid[]) from public, anon, authenticated;
revoke execute on function public.hold_event_seats(uuid, uuid[], uuid, integer) from public, anon, authenticated;
revoke execute on function public.process_ticket_scan(uuid, uuid, text, text, text, text, uuid, text, text, text, timestamp with time zone) from public, anon, authenticated;
revoke execute on function public.auth_company_id() from public, anon, authenticated;

-- Keep the signup trigger's resolution deterministic.
alter function public.handle_new_user() set search_path = public, pg_temp;
