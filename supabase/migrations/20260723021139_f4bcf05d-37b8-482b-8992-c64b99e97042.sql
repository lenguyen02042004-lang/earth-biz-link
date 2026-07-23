
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS shares_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_business_views(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.businesses SET views_count = views_count + 1
  WHERE id = _id AND status = 'public';
$$;

CREATE OR REPLACE FUNCTION public.increment_business_shares(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.businesses SET shares_count = shares_count + 1
  WHERE id = _id AND status = 'public';
$$;

REVOKE ALL ON FUNCTION public.increment_business_views(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_business_shares(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_business_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_business_shares(uuid) TO anon, authenticated;
