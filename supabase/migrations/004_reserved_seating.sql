-- Additive reserved-seating inventory. Safe to apply after existing migrations.
CREATE TABLE IF NOT EXISTS seating_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  floor_plan_url text,
  enabled boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS seat_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), plan_id uuid NOT NULL REFERENCES seating_plans(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL, price integer, x integer NOT NULL DEFAULT 0, y integer NOT NULL DEFAULT 0, sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS seat_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), section_id uuid NOT NULL REFERENCES seat_sections(id) ON DELETE CASCADE,
  label varchar(30) NOT NULL, price integer, sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(section_id, label)
);
CREATE TABLE IF NOT EXISTS reserved_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), row_id uuid NOT NULL REFERENCES seat_rows(id) ON DELETE CASCADE,
  label varchar(30) NOT NULL, price integer, x integer, y integer, accessible boolean NOT NULL DEFAULT false,
  sold_ticket_id uuid REFERENCES tickets(id), UNIQUE(row_id, label)
);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS seat_id uuid REFERENCES reserved_seats(id);
CREATE TABLE IF NOT EXISTS seat_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seat_id uuid NOT NULL UNIQUE REFERENCES reserved_seats(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE, hold_token uuid NOT NULL,
  order_id uuid REFERENCES orders(id), status varchar(20) NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('pending','purchased','released'))
);
CREATE INDEX IF NOT EXISTS seat_holds_token_idx ON seat_holds(hold_token);
CREATE INDEX IF NOT EXISTS seat_holds_expiry_idx ON seat_holds(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS reserved_seats_sold_ticket_idx ON reserved_seats(sold_ticket_id) WHERE sold_ticket_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tickets_seat_idx ON tickets(seat_id) WHERE seat_id IS NOT NULL;

CREATE OR REPLACE FUNCTION hold_event_seats(p_event_id uuid, p_seat_ids uuid[], p_hold_token uuid, p_minutes integer DEFAULT 10)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_expires timestamptz := now() + make_interval(mins => LEAST(GREATEST(p_minutes, 1), 10)); v_count integer;
BEGIN
  DELETE FROM seat_holds WHERE status = 'pending' AND expires_at <= now();
  PERFORM rs.id FROM reserved_seats rs JOIN seat_rows r ON r.id=rs.row_id JOIN seat_sections s ON s.id=r.section_id
    JOIN seating_plans p ON p.id=s.plan_id WHERE p.event_id=p_event_id AND rs.id=ANY(p_seat_ids) FOR UPDATE OF rs;
  SELECT count(*) INTO v_count FROM reserved_seats rs JOIN seat_rows r ON r.id=rs.row_id JOIN seat_sections s ON s.id=r.section_id
    JOIN seating_plans p ON p.id=s.plan_id WHERE p.event_id=p_event_id AND rs.id=ANY(p_seat_ids) AND rs.sold_ticket_id IS NULL;
  IF v_count <> cardinality(p_seat_ids) THEN RAISE EXCEPTION 'One or more seats are unavailable'; END IF;
  IF EXISTS (SELECT 1 FROM seat_holds WHERE seat_id=ANY(p_seat_ids) AND status='pending' AND expires_at>now() AND hold_token<>p_hold_token) THEN
    RAISE EXCEPTION 'One or more seats are temporarily held';
  END IF;
  INSERT INTO seat_holds(seat_id,event_id,hold_token,expires_at,status)
    SELECT unnest(p_seat_ids),p_event_id,p_hold_token,v_expires,'pending'
    ON CONFLICT(seat_id) DO UPDATE SET hold_token=EXCLUDED.hold_token,expires_at=EXCLUDED.expires_at,status='pending',order_id=NULL;
  RETURN v_expires;
END $$;

CREATE OR REPLACE FUNCTION finalize_seat_hold(p_hold_token uuid, p_order_id uuid, p_ticket_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE h record; i integer := 1;
BEGIN
  FOR h IN SELECT sh.id,sh.seat_id,rs.label AS seat_label,sr.label AS row_label,ss.name AS section_name
    FROM seat_holds sh JOIN reserved_seats rs ON rs.id=sh.seat_id JOIN seat_rows sr ON sr.id=rs.row_id JOIN seat_sections ss ON ss.id=sr.section_id
    WHERE sh.hold_token=p_hold_token AND sh.status='pending' AND sh.expires_at>now() ORDER BY ss.sort_order,sr.sort_order,rs.label FOR UPDATE OF sh,rs
  LOOP
    IF p_ticket_ids[i] IS NULL THEN RAISE EXCEPTION 'Ticket count does not match held seats'; END IF;
    UPDATE reserved_seats SET sold_ticket_id=p_ticket_ids[i] WHERE id=h.seat_id AND sold_ticket_id IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Seat is no longer available'; END IF;
    UPDATE tickets SET seat_id=h.seat_id, metadata=COALESCE(metadata,'{}'::jsonb)||jsonb_build_object('seat',jsonb_build_object('section',h.section_name,'row',h.row_label,'seat',h.seat_label)) WHERE id=p_ticket_ids[i];
    UPDATE guests g SET table_number=h.section_name, seat_number=h.row_label||'-'||h.seat_label FROM tickets t WHERE t.id=p_ticket_ids[i] AND g.id=t.guest_id;
    UPDATE seat_holds SET status='purchased',order_id=p_order_id WHERE id=h.id; i:=i+1;
  END LOOP;
  IF i-1 <> cardinality(p_ticket_ids) THEN RAISE EXCEPTION 'Ticket count does not match held seats'; END IF;
END $$;
