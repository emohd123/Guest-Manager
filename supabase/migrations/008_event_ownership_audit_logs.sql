-- Additive ownership and audit trail for dashboard staff access.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);
CREATE INDEX IF NOT EXISTS events_company_created_by_idx ON public.events(company_id, created_by);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_company_created_idx ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_event_created_idx ON public.audit_logs(event_id, created_at DESC);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full dashboard users can read audit logs" ON public.audit_logs;
CREATE POLICY "Full dashboard users can read audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.company_id = audit_logs.company_id
      AND (u.dashboard_access = 'full' OR u.role IN ('owner', 'admin'))
  )
);
