
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS qr_scans_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_business_qr_scans(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.businesses SET qr_scans_count = qr_scans_count + 1
  WHERE id = _id AND status = 'public';
$$;

REVOKE ALL ON FUNCTION public.increment_business_qr_scans(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_business_qr_scans(uuid) TO anon, authenticated;
