-- Public buyers can sign up with Supabase Auth, but they must not receive
-- admin dashboard workspaces. Internal company/admin setup is handled manually.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
