-- 1) personal_profiles
CREATE TABLE public.personal_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  job_title text,
  company_name text,
  phone text,
  zalo text,
  email text,
  avatar_url text,
  facebook_url text,
  linkedin_url text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_profiles TO authenticated;
GRANT SELECT ON public.personal_profiles TO anon;
GRANT ALL ON public.personal_profiles TO service_role;

ALTER TABLE public.personal_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY personal_profiles_select_public_or_own ON public.personal_profiles
  FOR SELECT USING (is_public = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY personal_profiles_insert_own ON public.personal_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY personal_profiles_update_own ON public.personal_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY personal_profiles_delete_own ON public.personal_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_personal_profiles_updated BEFORE UPDATE ON public.personal_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) connections
CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'connected',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, business_id)
);

CREATE INDEX idx_connections_business ON public.connections(business_id, created_at DESC);
CREATE INDEX idx_connections_requester ON public.connections(requester_id, created_at DESC);

GRANT SELECT ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY connections_select_participants ON public.connections
  FOR SELECT TO authenticated USING (
    auth.uid() = requester_id
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = connections.business_id AND b.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 3) wallet_limits
CREATE TABLE public.wallet_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  max_saved_allowed integer NOT NULL DEFAULT 200,
  current_saved_count integer NOT NULL DEFAULT 0,
  blocks_purchased integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wallet_limits TO authenticated;
GRANT ALL ON public.wallet_limits TO service_role;

ALTER TABLE public.wallet_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY wallet_limits_select_own ON public.wallet_limits
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_wallet_limits_updated BEFORE UPDATE ON public.wallet_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- helper: ensure wallet row exists with correct base limit
CREATE OR REPLACE FUNCTION public.ensure_wallet_limits(_user uuid)
RETURNS public.wallet_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.wallet_limits;
  v_base int;
BEGIN
  SELECT * INTO v_row FROM public.wallet_limits WHERE user_id = _user FOR UPDATE;
  IF NOT FOUND THEN
    v_base := CASE WHEN EXISTS (SELECT 1 FROM public.businesses WHERE owner_id = _user) THEN 1000 ELSE 200 END;
    INSERT INTO public.wallet_limits(user_id, max_saved_allowed, current_saved_count)
    VALUES (_user, v_base, (SELECT count(*) FROM public.saved_contacts WHERE user_id = _user))
    RETURNING * INTO v_row;
  END IF;
  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_wallet_limits(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_wallet_limits(uuid) TO service_role;

-- keep current_saved_count in sync with saved_contacts
CREATE OR REPLACE FUNCTION public.saved_contacts_count_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.wallet_limits(user_id, current_saved_count)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET current_saved_count = public.wallet_limits.current_saved_count + 1, updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wallet_limits
      SET current_saved_count = GREATEST(0, current_saved_count - 1), updated_at = now()
      WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_saved_contacts_count_ins AFTER INSERT ON public.saved_contacts
  FOR EACH ROW EXECUTE FUNCTION public.saved_contacts_count_trigger();
CREATE TRIGGER trg_saved_contacts_count_del AFTER DELETE ON public.saved_contacts
  FOR EACH ROW EXECUTE FUNCTION public.saved_contacts_count_trigger();

-- backfill wallets for existing users with saved contacts
INSERT INTO public.wallet_limits(user_id, max_saved_allowed, current_saved_count)
SELECT p.id,
       CASE WHEN EXISTS (SELECT 1 FROM public.businesses b WHERE b.owner_id = p.id) THEN 1000 ELSE 200 END,
       (SELECT count(*) FROM public.saved_contacts s WHERE s.user_id = p.id)
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- 4) main connect function
CREATE OR REPLACE FUNCTION public.connect_and_exchange(_business_id uuid, _source text DEFAULT 'manual')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_biz public.businesses;
  v_wallet public.wallet_limits;
  v_recent int;
  v_already boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Bạn cần đăng nhập để kết nối';
  END IF;

  SELECT * INTO v_biz FROM public.businesses WHERE id = _business_id AND status = 'public';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Doanh nghiệp không tồn tại hoặc chưa công khai';
  END IF;

  IF v_biz.owner_id = v_user THEN
    RAISE EXCEPTION 'Không thể tự kết nối với chính mình';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.connections WHERE requester_id = v_user AND business_id = _business_id)
    INTO v_already;

  IF NOT v_already THEN
    SELECT count(*) INTO v_recent FROM public.connections
      WHERE requester_id = v_user AND created_at > now() - interval '1 minute';
    IF v_recent >= 5 THEN
      RAISE EXCEPTION 'Bạn thao tác quá nhanh, vui lòng thử lại sau 1 phút';
    END IF;

    v_wallet := public.ensure_wallet_limits(v_user);
    IF v_wallet.current_saved_count >= v_wallet.max_saved_allowed THEN
      RAISE EXCEPTION 'Đã đạt hạn mức lưu % danh bạ. Vui lòng mua thêm gói mở rộng.', v_wallet.max_saved_allowed;
    END IF;

    INSERT INTO public.connections(requester_id, business_id, source)
    VALUES (v_user, _business_id, COALESCE(_source, 'manual'))
    ON CONFLICT (requester_id, business_id) DO NOTHING;

    INSERT INTO public.saved_contacts(
      user_id, business_id, business_name, business_slug, phone, email, website, logo_url, province)
    VALUES (v_user, v_biz.id, v_biz.name, v_biz.slug, v_biz.phone, v_biz.email, v_biz.website, v_biz.logo_url, v_biz.province)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'connected', true,
    'phone', v_biz.phone,
    'email', v_biz.email,
    'website', v_biz.website,
    'address', v_biz.address
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.connect_and_exchange(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.connect_and_exchange(uuid, text) TO authenticated;

-- 5) buy contact block (+1000)
CREATE OR REPLACE FUNCTION public.buy_contact_block()
RETURNS public.wallet_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.wallet_limits;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
  PERFORM public.ensure_wallet_limits(v_user);
  UPDATE public.wallet_limits
    SET blocks_purchased = blocks_purchased + 1,
        max_saved_allowed = max_saved_allowed + 1000,
        updated_at = now()
    WHERE user_id = v_user
    RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.buy_contact_block() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.buy_contact_block() TO authenticated;

-- 6) my wallet reader
CREATE OR REPLACE FUNCTION public.my_wallet_limits()
RETURNS public.wallet_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_row public.wallet_limits;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
  v_row := public.ensure_wallet_limits(auth.uid());
  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.my_wallet_limits() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.my_wallet_limits() TO authenticated;