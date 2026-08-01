-- Additive visual layout controls for the reserved seating hall map.
ALTER TABLE seat_sections ADD COLUMN IF NOT EXISTS width integer NOT NULL DEFAULT 30;
ALTER TABLE seat_sections ADD COLUMN IF NOT EXISTS height integer NOT NULL DEFAULT 20;
ALTER TABLE seat_sections ADD COLUMN IF NOT EXISTS rotation integer NOT NULL DEFAULT 0;
ALTER TABLE seat_sections ADD COLUMN IF NOT EXISTS color varchar(20) NOT NULL DEFAULT '#22d3ee';
ALTER TABLE seat_sections ADD COLUMN IF NOT EXISTS seat_spacing integer NOT NULL DEFAULT 100;
ALTER TABLE seat_sections ADD COLUMN IF NOT EXISTS row_spacing integer NOT NULL DEFAULT 100;
ALTER TABLE seat_rows ADD COLUMN IF NOT EXISTS color varchar(20);
ALTER TABLE reserved_seats ADD COLUMN IF NOT EXISTS color varchar(20);

ALTER TABLE seat_sections DROP CONSTRAINT IF EXISTS seat_sections_layout_bounds;
ALTER TABLE seat_sections ADD CONSTRAINT seat_sections_layout_bounds CHECK (
  x BETWEEN 0 AND 100 AND y BETWEEN 0 AND 100 AND
  width BETWEEN 5 AND 100 AND height BETWEEN 5 AND 100 AND
  rotation BETWEEN -180 AND 180 AND
  seat_spacing BETWEEN 40 AND 200 AND row_spacing BETWEEN 40 AND 200
);
