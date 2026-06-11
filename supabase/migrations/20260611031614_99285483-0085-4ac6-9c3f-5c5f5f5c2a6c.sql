-- Grant admin role to tanloifmc@yahoo.com if account exists; also auto-grant on future signup
DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'tanloifmc@yahoo.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (v_uid, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Trigger to auto-promote this specific email on signup (idempotent)
CREATE OR REPLACE FUNCTION public.auto_promote_designated_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF lower(NEW.email) = 'tanloifmc@yahoo.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS auto_promote_designated_admin_trg ON auth.users;
CREATE TRIGGER auto_promote_designated_admin_trg
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_promote_designated_admin();
