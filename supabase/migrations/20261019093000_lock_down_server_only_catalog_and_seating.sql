-- Stage 4: these records are served through audited server routes only.
-- Dashboard procedures use the service role after authorization, and public
-- pages use purpose-built API routes. Direct browser access is not required.

alter table public.campaigns enable row level security;
alter table public.categories enable row level security;
alter table public.event_sessions enable row level security;
alter table public.list_contacts enable row level security;
alter table public.lists enable row level security;
alter table public.promotions enable row level security;
alter table public.reserved_seats enable row level security;
alter table public.seat_holds enable row level security;
alter table public.seat_rows enable row level security;
alter table public.seat_sections enable row level security;
alter table public.seating_plans enable row level security;
alter table public.ticket_templates enable row level security;
alter table public.venues enable row level security;
