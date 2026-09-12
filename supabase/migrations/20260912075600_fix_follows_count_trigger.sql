CREATE OR REPLACE FUNCTION public.follows_count_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set local setting to bypass engagement guard for this transaction
  PERFORM set_config('bizconnect.bypass_engagement_guard', '1', true);

  IF TG_OP = 'INSERT' THEN
    UPDATE public.businesses SET followers_count = followers_count + 1 WHERE id = NEW.business_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.businesses SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.business_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
