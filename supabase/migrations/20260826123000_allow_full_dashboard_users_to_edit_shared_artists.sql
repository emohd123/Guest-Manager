-- The artist library is shared across companies. Any full-dashboard user can
-- manage its records; users without full dashboard access cannot modify it.
DROP POLICY IF EXISTS "Company users update their artists" ON public.artists;
DROP POLICY IF EXISTS "Company users delete their artists" ON public.artists;
DROP POLICY IF EXISTS "Dashboard users update shared artists" ON public.artists;
DROP POLICY IF EXISTS "Dashboard users delete shared artists" ON public.artists;

CREATE POLICY "Dashboard users update shared artists"
ON public.artists
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users AS u
    WHERE u.id = (SELECT auth.uid())
      AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users AS u
    WHERE u.id = (SELECT auth.uid())
      AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
  )
);

CREATE POLICY "Dashboard users delete shared artists"
ON public.artists
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users AS u
    WHERE u.id = (SELECT auth.uid())
      AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
  )
);
