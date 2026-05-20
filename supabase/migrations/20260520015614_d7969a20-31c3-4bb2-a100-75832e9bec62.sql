
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.business_status AS ENUM ('draft', 'public');
CREATE TYPE public.icon_tier AS ENUM ('standard', 'premium');
CREATE TYPE public.payment_provider AS ENUM ('stripe', 'paypal');
CREATE TYPE public.payment_type AS ENUM ('membership', 'extra_quota', 'icon_premium');
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'incomplete');

-- ============= UTILITY FUNCTION =============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= USER ROLES =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles_select_own_or_admin" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============= COUNTRIES =============
CREATE TABLE public.countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  flag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries_select_all" ON public.countries FOR SELECT USING (true);
CREATE POLICY "countries_admin_manage" ON public.countries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============= INDUSTRIES =============
CREATE TABLE public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "industries_select_all" ON public.industries FOR SELECT USING (true);
CREATE POLICY "industries_admin_manage" ON public.industries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============= BUSINESSES =============
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  banner_url TEXT,
  logo_url TEXT,
  address TEXT,
  country_code TEXT REFERENCES public.countries(code),
  province TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  website TEXT,
  short_intro TEXT,
  industry_id UUID REFERENCES public.industries(id),
  status business_status NOT NULL DEFAULT 'draft',
  icon_tier icon_tier NOT NULL DEFAULT 'standard',
  premium_until TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_businesses_country ON public.businesses(country_code);
CREATE INDEX idx_businesses_industry ON public.businesses(industry_id);
CREATE INDEX idx_businesses_status ON public.businesses(status);
CREATE INDEX idx_businesses_owner ON public.businesses(owner_id);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "businesses_select_public_or_own" ON public.businesses FOR SELECT
  USING (status = 'public' OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "businesses_insert_own" ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "businesses_update_own" ON public.businesses FOR UPDATE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "businesses_delete_own" ON public.businesses FOR DELETE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_businesses_updated BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= BUSINESS SOCIALS =============
CREATE TABLE public.business_socials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, platform)
);
ALTER TABLE public.business_socials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "socials_select_all" ON public.business_socials FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.status = 'public' OR b.owner_id = auth.uid()))
);
CREATE POLICY "socials_manage_owner" ON public.business_socials FOR ALL USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

-- ============= BUSINESS GALLERY =============
CREATE TABLE public.business_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_select_all" ON public.business_gallery FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.status = 'public' OR b.owner_id = auth.uid()))
);
CREATE POLICY "gallery_manage_owner" ON public.business_gallery FOR ALL USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

-- ============= FOLLOWS =============
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, business_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select_all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ============= CONNECT MESSAGES =============
CREATE TABLE public.connect_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  to_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_to ON public.connect_messages(to_business_id);
CREATE INDEX idx_messages_from ON public.connect_messages(from_business_id);
ALTER TABLE public.connect_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_participants" ON public.connect_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE (b.id = from_business_id OR b.id = to_business_id) AND b.owner_id = auth.uid())
);
CREATE POLICY "messages_insert_sender" ON public.connect_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = from_business_id AND b.owner_id = auth.uid())
);
CREATE POLICY "messages_update_receiver" ON public.connect_messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = to_business_id AND b.owner_id = auth.uid())
);

-- ============= MESSAGE QUOTAS =============
CREATE TABLE public.message_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, period_year)
);
ALTER TABLE public.message_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotas_select_owner" ON public.message_quotas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE TRIGGER trg_quotas_updated BEFORE UPDATE ON public.message_quotas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= SUBSCRIPTIONS =============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  provider payment_provider NOT NULL,
  provider_subscription_id TEXT,
  status subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_select_own" ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= PAYMENTS LOG =============
CREATE TABLE public.payments_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  type payment_type NOT NULL,
  provider payment_provider NOT NULL,
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_own" ON public.payments_log FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============= SEED INDUSTRIES =============
INSERT INTO public.industries (name, slug, icon) VALUES
  ('Công nghệ thông tin', 'technology', 'cpu'),
  ('Tài chính - Ngân hàng', 'finance', 'banknote'),
  ('Bất động sản', 'real-estate', 'building'),
  ('Sản xuất', 'manufacturing', 'factory'),
  ('Thương mại - Bán lẻ', 'retail', 'shopping-bag'),
  ('Du lịch - Khách sạn', 'hospitality', 'plane'),
  ('Giáo dục', 'education', 'graduation-cap'),
  ('Y tế - Sức khỏe', 'healthcare', 'heart-pulse'),
  ('Thực phẩm & Đồ uống', 'food-beverage', 'utensils'),
  ('Logistics - Vận tải', 'logistics', 'truck'),
  ('Nông nghiệp', 'agriculture', 'wheat'),
  ('Năng lượng', 'energy', 'zap'),
  ('Truyền thông - Marketing', 'marketing', 'megaphone'),
  ('Tư vấn - Pháp lý', 'consulting', 'briefcase'),
  ('Xây dựng', 'construction', 'hard-hat'),
  ('Thời trang - Làm đẹp', 'fashion', 'shirt'),
  ('Giải trí - Nghệ thuật', 'entertainment', 'music'),
  ('Ô tô - Xe máy', 'automotive', 'car'),
  ('Khác', 'other', 'more-horizontal');

-- ============= SEED COUNTRIES (top countries) =============
INSERT INTO public.countries (code, name, flag) VALUES
  ('VN', 'Việt Nam', '🇻🇳'), ('US', 'Hoa Kỳ', '🇺🇸'), ('CN', 'Trung Quốc', '🇨🇳'),
  ('JP', 'Nhật Bản', '🇯🇵'), ('KR', 'Hàn Quốc', '🇰🇷'), ('SG', 'Singapore', '🇸🇬'),
  ('TH', 'Thái Lan', '🇹🇭'), ('MY', 'Malaysia', '🇲🇾'), ('ID', 'Indonesia', '🇮🇩'),
  ('PH', 'Philippines', '🇵🇭'), ('IN', 'Ấn Độ', '🇮🇳'), ('AU', 'Úc', '🇦🇺'),
  ('GB', 'Vương quốc Anh', '🇬🇧'), ('DE', 'Đức', '🇩🇪'), ('FR', 'Pháp', '🇫🇷'),
  ('IT', 'Ý', '🇮🇹'), ('ES', 'Tây Ban Nha', '🇪🇸'), ('NL', 'Hà Lan', '🇳🇱'),
  ('CA', 'Canada', '🇨🇦'), ('MX', 'Mexico', '🇲🇽'), ('BR', 'Brazil', '🇧🇷'),
  ('AR', 'Argentina', '🇦🇷'), ('AE', 'UAE', '🇦🇪'), ('SA', 'Ả Rập Saudi', '🇸🇦'),
  ('ZA', 'Nam Phi', '🇿🇦'), ('EG', 'Ai Cập', '🇪🇬'), ('TR', 'Thổ Nhĩ Kỳ', '🇹🇷'),
  ('RU', 'Nga', '🇷🇺'), ('CH', 'Thụy Sĩ', '🇨🇭'), ('SE', 'Thụy Điển', '🇸🇪');

-- ============= STORAGE BUCKETS =============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('business-logos', 'business-logos', true),
  ('business-banners', 'business-banners', true),
  ('business-gallery', 'business-gallery', true);

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read business logos" ON storage.objects FOR SELECT USING (bucket_id = 'business-logos');
CREATE POLICY "Users upload business logos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users update own business logos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read business banners" ON storage.objects FOR SELECT USING (bucket_id = 'business-banners');
CREATE POLICY "Users upload business banners" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-banners' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users update own business banners" ON storage.objects FOR UPDATE
  USING (bucket_id = 'business-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read business gallery" ON storage.objects FOR SELECT USING (bucket_id = 'business-gallery');
CREATE POLICY "Users upload business gallery" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-gallery' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users update own business gallery" ON storage.objects FOR UPDATE
  USING (bucket_id = 'business-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
