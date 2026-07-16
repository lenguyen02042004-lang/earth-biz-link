
-- 1. Remove follows from realtime publication (prevents cross-user follow event leaks)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'follows'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.follows';
  END IF;
END $$;

-- 2. Recreate storage UPDATE policies scoped to `authenticated` only
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own business banners" ON storage.objects;
DROP POLICY IF EXISTS "Users update own business gallery" ON storage.objects;
DROP POLICY IF EXISTS "Users update own business logos" ON storage.objects;

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own business banners"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-banners' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'business-banners' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own business gallery"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-gallery' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'business-gallery' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own business logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'business-logos' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'business-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);
