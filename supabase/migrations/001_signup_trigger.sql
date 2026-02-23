-- Auto-create a company and user profile when a new user signs up via Supabase Auth
-- This trigger fires on INSERT to auth.users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id uuid;
  company_slug text;
BEGIN
  -- Generate slug from company name (or email)
  company_slug := lower(regexp_replace(
    coalesce(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1)),
    '[^a-z0-9]+', '-', 'g'
  ));

  -- Add random suffix to ensure uniqueness
  company_slug := company_slug || '-' || substr(gen_random_uuid()::text, 1, 6);

  -- Create the company
  INSERT INTO public.companies (id, name, slug)
  VALUES (
    gen_random_uuid(),
    coalesce(NEW.raw_user_meta_data->>'company_name', 'My Company'),
    company_slug
  )
  RETURNING id INTO new_company_id;

  -- Create the user profile linked to the company
  INSERT INTO public.users (id, company_id, email, name, role, email_verified)
  VALUES (
    NEW.id,
    new_company_id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'name', NEW.email),
    'owner',
    NEW.email_confirmed_at IS NOT NULL
  );

  -- Create a free subscription for the company
  INSERT INTO public.subscriptions (company_id, plan, status, max_devices, ticket_fee_rate)
  VALUES (new_company_id, 'free', 'active', 2, 100);

  -- Grant initial 50 free credits
  INSERT INTO public.credit_ledger (company_id, amount, balance_after, action, description)
  VALUES (new_company_id, 50, 50, 'plan_grant', 'Welcome bonus: 50 free credits');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Companies: users can only read their own company
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company"
  ON public.companies FOR SELECT
  USING (id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own company"
  ON public.companies FOR UPDATE
  USING (id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Users: can view users in same company
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view users in same company"
  ON public.users FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Events: company-scoped
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage events in their company"
  ON public.events FOR ALL
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Guests: company-scoped
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage guests in their company"
  ON public.guests FOR ALL
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Check-ins: company-scoped
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage check-ins in their company"
  ON public.check_ins FOR ALL
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Contacts: company-scoped
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage contacts in their company"
  ON public.contacts FOR ALL
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Ticket types: company-scoped
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ticket types in their company"
  ON public.ticket_types FOR ALL
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Tickets: company-scoped
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tickets in their company"
  ON public.tickets FOR ALL
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Orders: company-scoped
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage orders in their company"
  ON public.orders FOR ALL
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Subscriptions: company-scoped
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company subscription"
  ON public.subscriptions FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Credit ledger: company-scoped
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company credits"
  ON public.credit_ledger FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Enable realtime for check_ins table (for live check-in sync)
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
