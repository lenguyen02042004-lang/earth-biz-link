
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

-- Realtime channel authorization
-- The app only uses postgres_changes subscriptions, which respect RLS on the
-- underlying tables (follows, connect_messages). Block broadcast/presence
-- entirely and require authentication.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realtime_authenticated_postgres_changes_only" ON realtime.messages
  FOR SELECT TO authenticated
  USING (extension = 'postgres_changes');

CREATE POLICY "realtime_authenticated_postgres_changes_only_write" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (extension = 'postgres_changes');
