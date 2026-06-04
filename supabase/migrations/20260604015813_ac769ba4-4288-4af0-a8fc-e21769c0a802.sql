
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "follows_select_all" ON public.follows;
CREATE POLICY "follows_select_own_or_business_owner"
  ON public.follows FOR SELECT
  TO authenticated
  USING (
    auth.uid() = follower_id
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = follows.business_id AND b.owner_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.follows_count_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS follows_count_ins ON public.follows;
DROP TRIGGER IF EXISTS follows_count_del ON public.follows;
CREATE TRIGGER follows_count_ins AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.follows_count_trigger();
CREATE TRIGGER follows_count_del AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.follows_count_trigger();

UPDATE public.businesses b
SET followers_count = COALESCE(c.cnt, 0)
FROM (
  SELECT business_id, COUNT(*)::int AS cnt FROM public.follows GROUP BY business_id
) c
WHERE c.business_id = b.id;
UPDATE public.businesses SET followers_count = 0
WHERE NOT EXISTS (SELECT 1 FROM public.follows f WHERE f.business_id = businesses.id);

DROP POLICY IF EXISTS "Users upload business banners" ON storage.objects;
DROP POLICY IF EXISTS "Users upload business gallery" ON storage.objects;
DROP POLICY IF EXISTS "Users upload business logos" ON storage.objects;

CREATE POLICY "Users upload business banners"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-banners'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users upload business gallery"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-gallery'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users upload business logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-logos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.follows_count_trigger() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_card_visit(uuid, uuid, text, text) FROM anon;
