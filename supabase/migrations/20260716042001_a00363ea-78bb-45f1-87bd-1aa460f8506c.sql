
ALTER TABLE public.business_directory ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_directory FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_directory TO authenticated;
GRANT ALL ON public.business_directory TO service_role;

DROP POLICY IF EXISTS "business_directory_admin_all" ON public.business_directory;
CREATE POLICY "business_directory_admin_all"
  ON public.business_directory
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
