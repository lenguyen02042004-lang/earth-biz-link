-- Drop the old trigger logic
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

  -- Bypass engagement counters check if explicitly requested by an RPC function
  IF current_setting('bizconnect.bypass_engagement_guard', true) = '1' THEN
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
  
  -- Users should be able to change status to publish/unpublish their business!
  -- Removing the status check that previously blocked this.

  IF NEW.views_count IS DISTINCT FROM OLD.views_count
     OR NEW.shares_count IS DISTINCT FROM OLD.shares_count
     OR NEW.qr_scans_count IS DISTINCT FROM OLD.qr_scans_count
     OR NEW.followers_count IS DISTINCT FROM OLD.followers_count THEN
    RAISE EXCEPTION 'Not allowed to change engagement counters directly';
  END IF;

  RETURN NEW;
END;
$$;

-- Redefine the RPC functions to set the bypass flag

CREATE OR REPLACE FUNCTION public.increment_business_views(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('bizconnect.bypass_engagement_guard', '1', true);
  UPDATE public.businesses SET views_count = views_count + 1
  WHERE id = _id AND status = 'public';
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_business_shares(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('bizconnect.bypass_engagement_guard', '1', true);
  UPDATE public.businesses SET shares_count = shares_count + 1
  WHERE id = _id AND status = 'public';
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_business_qr_scans(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('bizconnect.bypass_engagement_guard', '1', true);
  UPDATE public.businesses SET qr_scans_count = qr_scans_count + 1
  WHERE id = _id AND status = 'public';
END;
$$;
