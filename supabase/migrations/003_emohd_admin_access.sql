-- Grant internal dashboard access only to the company admin email.
-- Public buyer signups remain buyer-only and do not receive company workspaces.

CREATE OR REPLACE FUNCTION public.ensure_events_hub_admin_company()
RETURNS uuid AS $$
DECLARE
  admin_company_id uuid;
BEGIN
  INSERT INTO public.companies (name, slug, timezone, settings)
  VALUES ('Events Hub Admin', 'events-hub-admin', 'Asia/Bahrain', '{"managedBy":"Events Hub"}'::jsonb)
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        timezone = EXCLUDED.timezone,
        updated_at = now()
  RETURNING id INTO admin_company_id;

  RETURN admin_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  admin_company_id uuid;
BEGIN
  IF lower(NEW.email) = 'emohd123@gmail.com' THEN
    admin_company_id := public.ensure_events_hub_admin_company();

    INSERT INTO public.users (id, company_id, email, name, role, email_verified)
    VALUES (
      NEW.id,
      admin_company_id,
      NEW.email,
      coalesce(NEW.raw_user_meta_data->>'name', 'Events Hub Admin'),
      'owner',
      NEW.email_confirmed_at IS NOT NULL
    )
    ON CONFLICT (id) DO UPDATE
      SET company_id = EXCLUDED.company_id,
          email = EXCLUDED.email,
          name = coalesce(public.users.name, EXCLUDED.name),
          role = 'owner',
          email_verified = EXCLUDED.email_verified,
          updated_at = now();

    INSERT INTO public.subscriptions (company_id, plan, status, max_devices, ticket_fee_rate)
    VALUES (admin_company_id, 'enterprise', 'active', 50, 0)
    ON CONFLICT (company_id) DO UPDATE
      SET plan = EXCLUDED.plan,
          status = EXCLUDED.status,
          max_devices = EXCLUDED.max_devices,
          ticket_fee_rate = EXCLUDED.ticket_fee_rate,
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

WITH admin_company AS (
  SELECT public.ensure_events_hub_admin_company() AS id
),
admin_auth_user AS (
  SELECT id, email, raw_user_meta_data, email_confirmed_at
  FROM auth.users
  WHERE lower(email) = 'emohd123@gmail.com'
  LIMIT 1
)
INSERT INTO public.users (id, company_id, email, name, role, email_verified)
SELECT
  admin_auth_user.id,
  admin_company.id,
  admin_auth_user.email,
  coalesce(admin_auth_user.raw_user_meta_data->>'name', 'Events Hub Admin'),
  'owner',
  admin_auth_user.email_confirmed_at IS NOT NULL
FROM admin_auth_user
CROSS JOIN admin_company
ON CONFLICT (id) DO UPDATE
  SET company_id = EXCLUDED.company_id,
      email = EXCLUDED.email,
      name = coalesce(public.users.name, EXCLUDED.name),
      role = 'owner',
      email_verified = EXCLUDED.email_verified,
      updated_at = now();

INSERT INTO public.subscriptions (company_id, plan, status, max_devices, ticket_fee_rate)
SELECT id, 'enterprise', 'active', 50, 0
FROM public.companies
WHERE slug = 'events-hub-admin'
ON CONFLICT (company_id) DO UPDATE
  SET plan = EXCLUDED.plan,
      status = EXCLUDED.status,
      max_devices = EXCLUDED.max_devices,
      ticket_fee_rate = EXCLUDED.ticket_fee_rate,
      updated_at = now();
