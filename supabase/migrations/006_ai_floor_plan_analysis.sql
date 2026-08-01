-- Additive individual-seat editing and inventory controls.
ALTER TABLE reserved_seats ADD COLUMN IF NOT EXISTS category varchar(80);
ALTER TABLE reserved_seats ADD COLUMN IF NOT EXISTS inventory_status varchar(20) NOT NULL DEFAULT 'available';
ALTER TABLE reserved_seats DROP CONSTRAINT IF EXISTS reserved_seats_inventory_status_check;
ALTER TABLE reserved_seats ADD CONSTRAINT reserved_seats_inventory_status_check CHECK (inventory_status IN ('available','blocked'));

CREATE OR REPLACE FUNCTION hold_event_seats(p_event_id uuid, p_seat_ids uuid[], p_hold_token uuid, p_minutes integer DEFAULT 10)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_expires timestamptz := now() + make_interval(mins => LEAST(GREATEST(p_minutes, 1), 10)); v_count integer;
BEGIN
  DELETE FROM seat_holds WHERE status = 'pending' AND expires_at <= now();
  PERFORM rs.id FROM reserved_seats rs JOIN seat_rows r ON r.id=rs.row_id JOIN seat_sections s ON s.id=r.section_id
    JOIN seating_plans p ON p.id=s.plan_id WHERE p.event_id=p_event_id AND rs.id=ANY(p_seat_ids) FOR UPDATE OF rs;
  SELECT count(*) INTO v_count FROM reserved_seats rs JOIN seat_rows r ON r.id=rs.row_id JOIN seat_sections s ON s.id=r.section_id
    JOIN seating_plans p ON p.id=s.plan_id WHERE p.event_id=p_event_id AND rs.id=ANY(p_seat_ids) AND rs.sold_ticket_id IS NULL AND rs.inventory_status='available';
  IF v_count <> cardinality(p_seat_ids) THEN RAISE EXCEPTION 'One or more seats are unavailable'; END IF;
  IF EXISTS (SELECT 1 FROM seat_holds WHERE seat_id=ANY(p_seat_ids) AND status='pending' AND expires_at>now() AND hold_token<>p_hold_token) THEN RAISE EXCEPTION 'One or more seats are temporarily held';
  END IF;
  INSERT INTO seat_holds(seat_id,event_id,hold_token,expires_at,status)
    SELECT unnest(p_seat_ids),p_event_id,p_hold_token,v_expires,'pending'
    ON CONFLICT(seat_id) DO UPDATE SET hold_token=EXCLUDED.hold_token,expires_at=EXCLUDED.expires_at,status='pending',order_id=NULL;
  RETURN v_expires;
END $$;
