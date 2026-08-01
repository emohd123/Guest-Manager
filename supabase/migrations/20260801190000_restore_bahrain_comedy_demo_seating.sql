-- Restore the clearly named Bahrain Comedy Night demo only when its enabled
-- seating plan has no sections. Never changes customer events or a populated map.
DO $$
DECLARE
  demo_event_id constant uuid := 'e5000000-0000-4000-8000-000000000002';
  demo_plan_id uuid;
  section_id uuid;
  row_id uuid;
  section_index integer;
  row_index integer;
  seat_index integer;
  tier_names text[] := ARRAY['Premium', 'Royal', 'Standard'];
  tier_prices integer[] := ARRAY[2000, 1500, 800];
  tier_colors text[] := ARRAY['#2563eb', '#9333ea', '#ef4444'];
  section_x integer[] := ARRAY[32, 50, 68];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM events
    WHERE id = demo_event_id
      AND slug = 'bahrain-comedy-night'
      AND title = 'Bahrain Comedy Night'
  ) THEN
    RAISE NOTICE 'Bahrain Comedy Night demo event not found; no data changed.';
    RETURN;
  END IF;

  SELECT id INTO demo_plan_id
  FROM seating_plans
  WHERE event_id = demo_event_id;

  IF demo_plan_id IS NULL THEN
    INSERT INTO seating_plans (event_id, enabled, metadata)
    VALUES (
      demo_event_id,
      true,
      '{"labels":[{"id":"demo-stage","text":"STAGE","x":50,"y":88,"width":40,"height":10,"color":"#64748b"}]}'::jsonb
    )
    RETURNING id INTO demo_plan_id;
  ELSIF EXISTS (SELECT 1 FROM seat_sections WHERE plan_id = demo_plan_id) THEN
    RAISE NOTICE 'Demo seating map is already populated; no data changed.';
    RETURN;
  ELSE
    UPDATE seating_plans
    SET enabled = true,
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{labels}',
          '[{"id":"demo-stage","text":"STAGE","x":50,"y":88,"width":40,"height":10,"color":"#64748b"}]'::jsonb,
          true
        ),
        updated_at = now()
    WHERE id = demo_plan_id;
  END IF;

  FOR section_index IN 1..3 LOOP
    INSERT INTO seat_sections (
      plan_id, name, price, x, y, width, height, rotation, color,
      seat_spacing, row_spacing, sort_order
    ) VALUES (
      demo_plan_id, tier_names[section_index], tier_prices[section_index],
      section_x[section_index], 45, 24, 50, 0, tier_colors[section_index],
      100, 100, section_index - 1
    ) RETURNING id INTO section_id;

    FOR row_index IN 1..6 LOOP
      INSERT INTO seat_rows (section_id, label, price, color, sort_order)
      VALUES (
        section_id,
        chr(64 + row_index),
        tier_prices[section_index],
        tier_colors[section_index],
        row_index - 1
      ) RETURNING id INTO row_id;

      FOR seat_index IN 1..12 LOOP
        INSERT INTO reserved_seats (
          row_id, label, price, x, y, color, category, inventory_status
        ) VALUES (
          row_id,
          seat_index::text,
          tier_prices[section_index],
          round((seat_index::numeric / 13) * 100)::integer,
          round((row_index::numeric / 7) * 100)::integer,
          tier_colors[section_index],
          tier_names[section_index],
          CASE
            WHEN section_index = 3 AND row_index = 6 AND seat_index <= 3
              THEN 'blocked'
            ELSE 'available'
          END
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
