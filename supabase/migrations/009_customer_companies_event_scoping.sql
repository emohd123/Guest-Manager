-- Customer companies are organizer customers of a platform company. Events can
-- be assigned to one customer company, and matching customer accounts are
-- linked server-side to those events without exposing other tenant events.
CREATE TABLE IF NOT EXISTS public.customer_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  legal_name text NOT NULL,
  display_name text,
  email text NOT NULL,
  mobile text,
  vat_number text,
  website text,
  country text,
  address jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS customer_companies_owner_idx ON public.customer_companies(owner_company_id);
CREATE INDEX IF NOT EXISTS customer_companies_owner_email_idx ON public.customer_companies(owner_company_id, lower(email));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS customer_company_id uuid REFERENCES public.customer_companies(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS customer_company_id uuid REFERENCES public.customer_companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS events_company_customer_company_idx ON public.events(company_id, customer_company_id);
CREATE INDEX IF NOT EXISTS users_customer_company_idx ON public.users(customer_company_id);
ALTER TABLE public.customer_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company users manage customer companies" ON public.customer_companies;
CREATE POLICY "Company users manage customer companies" ON public.customer_companies
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.company_id = customer_companies.owner_company_id AND (u.dashboard_access = 'full' OR u.role IN ('owner','admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.company_id = customer_companies.owner_company_id AND (u.dashboard_access = 'full' OR u.role IN ('owner','admin'))));
