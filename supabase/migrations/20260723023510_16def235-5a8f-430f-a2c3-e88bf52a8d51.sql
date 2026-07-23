
-- Add WITH CHECK to the owner UPDATE policy so post-update rows must still be owned by the caller (or admin).
DROP POLICY IF EXISTS businesses_update_own ON public.businesses;

CREATE POLICY businesses_update_own ON public.businesses
FOR UPDATE
USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'));

-- Trigger-level guard: block non-admin owners from changing protected/monetized columns.
CREATE OR REPLACE FUNCTION public.businesses_guard_protected_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins and service role bypass the guard.
  IF public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'Not allowed to change owner_id';
  END IF;
  IF NEW.icon_tier IS DISTINCT FROM OLD.icon_tier THEN
    RAISE EXCEPTION 'Not allowed to change icon_tier';
  END IF;
  IF NEW.premium_until IS DISTINCT FROM OLD.premium_until THEN
    RAISE EXCEPTION 'Not allowed to change premium_until';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Not allowed to change status';
  END IF;
  IF NEW.views_count IS DISTINCT FROM OLD.views_count
     OR NEW.shares_count IS DISTINCT FROM OLD.shares_count
     OR NEW.qr_scans_count IS DISTINCT FROM OLD.qr_scans_count
     OR NEW.followers_count IS DISTINCT FROM OLD.followers_count THEN
    RAISE EXCEPTION 'Not allowed to change engagement counters directly';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.businesses_guard_protected_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_businesses_guard_protected ON public.businesses;
CREATE TRIGGER trg_businesses_guard_protected
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.businesses_guard_protected_columns();
