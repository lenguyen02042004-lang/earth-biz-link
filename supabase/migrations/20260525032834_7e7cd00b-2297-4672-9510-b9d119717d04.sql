
CREATE TABLE public.saved_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL,
  business_name text NOT NULL,
  business_slug text,
  industry text,
  country_name text,
  province text,
  phone text,
  email text,
  website text,
  logo_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX idx_saved_contacts_user ON public.saved_contacts(user_id, created_at DESC);
CREATE INDEX idx_saved_contacts_search ON public.saved_contacts USING gin (to_tsvector('simple', coalesce(business_name,'') || ' ' || coalesce(industry,'') || ' ' || coalesce(country_name,'') || ' ' || coalesce(note,'')));

ALTER TABLE public.saved_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_contacts_select_own" ON public.saved_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_contacts_insert_own" ON public.saved_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_contacts_update_own" ON public.saved_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_contacts_delete_own" ON public.saved_contacts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_contacts_updated_at
BEFORE UPDATE ON public.saved_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
