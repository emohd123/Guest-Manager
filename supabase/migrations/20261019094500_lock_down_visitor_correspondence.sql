-- Stage 5: attendee messages and notifications contain personal contact data.
-- They are created and read through authenticated server routes only.

alter table public.visitor_messages enable row level security;
alter table public.visitor_notifications enable row level security;
