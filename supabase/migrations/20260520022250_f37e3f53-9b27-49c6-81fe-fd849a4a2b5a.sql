
-- Quota policies (function uses SECURITY DEFINER so it bypasses, but allow admin manage)
CREATE POLICY "quotas_admin_manage" ON public.message_quotas
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Helper to check if current user is admin (client convenience)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT has_role(auth.uid(), 'admin')
$$;

-- Atomic send card visit
CREATE OR REPLACE FUNCTION public.send_card_visit(
  _from_business uuid,
  _to_business uuid,
  _subject text,
  _body text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_year int := EXTRACT(YEAR FROM now())::int;
  v_quota public.message_quotas;
  v_limit int;
  v_msg_id uuid;
BEGIN
  -- Auth check: caller must own from_business
  SELECT owner_id INTO v_owner FROM public.businesses WHERE id = _from_business;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to send from this business';
  END IF;

  IF _to_business = _from_business THEN
    RAISE EXCEPTION 'Cannot send to yourself';
  END IF;

  -- Ensure quota row
  SELECT * INTO v_quota FROM public.message_quotas
    WHERE business_id = _from_business AND period_year = v_year FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.message_quotas(business_id, period_year, used_count, bonus_credits)
    VALUES (_from_business, v_year, 0, 0)
    RETURNING * INTO v_quota;
  END IF;

  v_limit := 1000 + COALESCE(v_quota.bonus_credits, 0);
  IF v_quota.used_count >= v_limit THEN
    RAISE EXCEPTION 'Quota exceeded: % / %', v_quota.used_count, v_limit;
  END IF;

  INSERT INTO public.connect_messages(from_business_id, to_business_id, subject, body)
  VALUES (_from_business, _to_business, _subject, _body)
  RETURNING id INTO v_msg_id;

  UPDATE public.message_quotas
    SET used_count = used_count + 1, updated_at = now()
    WHERE id = v_quota.id;

  RETURN v_msg_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_card_visit(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Auto-grant admin to the first signed up user (no-op if any admin already)
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bootstrap_first_admin ON auth.users;
CREATE TRIGGER trg_bootstrap_first_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_connect_messages_to ON public.connect_messages(to_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connect_messages_from ON public.connect_messages(from_business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status) WHERE status = 'public';
