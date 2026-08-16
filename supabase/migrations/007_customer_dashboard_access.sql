-- Buyer accounts must not receive an organizer workspace by default.
-- Organizer access is explicit and can be full or limited per account.
ALTER TABLE public.users ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dashboard_access text NOT NULL DEFAULT 'none';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dashboard_permissions jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_dashboard_access_check;
ALTER TABLE public.users ADD CONSTRAINT users_dashboard_access_check
  CHECK (dashboard_access IN ('none', 'limited', 'full'));

-- Preserve existing internal owners/admins while making other profiles buyer-only.
UPDATE public.users
SET dashboard_access = CASE
  WHEN company_id IS NOT NULL AND role IN ('owner', 'admin') THEN 'full'
  WHEN company_id IS NOT NULL THEN 'limited'
  ELSE 'none'
END
WHERE dashboard_access = 'none';

-- Re-assert the buyer-safe signup trigger. The admin account is provisioned by 003.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  admin_company_id uuid;
BEGIN
  IF lower(NEW.email) = 'emohd123@gmail.com' THEN
    admin_company_id := public.ensure_events_hub_admin_company();
    INSERT INTO public.users (id, company_id, email, name, role, email_verified, dashboard_access, dashboard_permissions)
    VALUES (NEW.id, admin_company_id, NEW.email,
      coalesce(NEW.raw_user_meta_data->>'name', 'Events Hub Admin'), 'owner',
      NEW.email_confirmed_at IS NOT NULL, 'full', '["*"]'::jsonb)
    ON CONFLICT (id) DO UPDATE SET company_id = EXCLUDED.company_id,
      role = 'owner', dashboard_access = 'full', dashboard_permissions = '["*"]'::jsonb,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
