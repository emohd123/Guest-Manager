-- Compatibility column used by the event verification workflow.
-- Nullable by design: existing and newly-created draft events do not need a reviewer.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.events.verified_by IS
  'Optional user who verified the event for publication.';

-- Ensure PostgREST sees the additive column without waiting for a restart.
NOTIFY pgrst, 'reload schema';
