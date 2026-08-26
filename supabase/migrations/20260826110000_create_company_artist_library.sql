-- Reusable company-scoped artist library for event lineups.
CREATE TABLE IF NOT EXISTS public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  role text,
  image_url text,
  bio text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS artists_company_name_unique
  ON public.artists (company_id, lower(name));
CREATE INDEX IF NOT EXISTS artists_company_name_idx
  ON public.artists (company_id, name);

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company users manage artists" ON public.artists;
CREATE POLICY "Company users manage artists"
  ON public.artists
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = (SELECT auth.uid())
        AND u.company_id = artists.company_id
        AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = (SELECT auth.uid())
        AND u.company_id = artists.company_id
        AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
    )
  );
