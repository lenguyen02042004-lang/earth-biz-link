
-- Storage DELETE policies (folder name must equal auth.uid())
CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "business_logos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'business-logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "business_banners_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'business-banners' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "business_gallery_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'business-gallery' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- NOTE: realtime.messages RLS skipped — managed by Supabase internally.
-- The app uses postgres_changes subscriptions which respect RLS on the
-- underlying application tables (follows, connect_messages).
