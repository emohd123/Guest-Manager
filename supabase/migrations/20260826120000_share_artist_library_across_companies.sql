-- Artists remain owned by their creator company, but can be selected
-- in the lineup of any company's event.
DROP POLICY IF EXISTS "Company users manage artists" ON public.artists;
DROP POLICY IF EXISTS "Dashboard users view shared artists" ON public.artists;
DROP POLICY IF EXISTS "Company users create artists" ON public.artists;
DROP POLICY IF EXISTS "Company users update their artists" ON public.artists;
DROP POLICY IF EXISTS "Company users delete their artists" ON public.artists;

CREATE POLICY "Dashboard users view shared artists"
ON public.artists
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users AS u
    WHERE u.id = (SELECT auth.uid())
      AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
  )
);

CREATE POLICY "Company users create artists"
ON public.artists
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users AS u
    WHERE u.id = (SELECT auth.uid())
      AND u.company_id = artists.company_id
      AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
  )
);

CREATE POLICY "Company users update their artists"
ON public.artists
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users AS u
    WHERE u.id = (SELECT auth.uid())
      AND u.company_id = artists.company_id
      AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users AS u
    WHERE u.id = (SELECT auth.uid())
      AND u.company_id = artists.company_id
      AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
  )
);

CREATE POLICY "Company users delete their artists"
ON public.artists
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users AS u
    WHERE u.id = (SELECT auth.uid())
      AND u.company_id = artists.company_id
      AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
  )
);
