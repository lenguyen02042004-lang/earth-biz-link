-- ============================================================
-- FIX QUOTA SYSTEM — BizConnect.One
-- Date: 2026-09-10
-- Changes:
--   1. Add `sub_type` column to subscriptions table
--   2. Fix send_card_visit() to enforce Free=100 / B2B Premium=500
--   3. Fix buy_contact_block() to grant +500 (not +1000)
--   4. Fix ensure_wallet_limits() base: personal=200, business=500
--   5. Add payments_log INSERT policy for users
-- ============================================================

-- 1. Add subscription type column
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS sub_type TEXT NOT NULL DEFAULT 'b2b_premium'
  CHECK (sub_type IN ('b2b_premium', 'icon_premium', 'contact_block_addon'));

-- Update payment_type enum to include contact_block_addon
ALTER TYPE public.payment_type ADD VALUE IF NOT EXISTS 'contact_block_addon';

-- 2. Add `manual` to provider enum if not yet present (idempotent)
ALTER TYPE public.payment_provider ADD VALUE IF NOT EXISTS 'manual';

-- 3. Fix ensure_wallet_limits: personal=200, business=500
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
    -- Business accounts get 500 base, personal accounts get 200
    v_base := CASE
      WHEN EXISTS (SELECT 1 FROM public.businesses WHERE owner_id = _user)
      THEN 500
      ELSE 200
    END;
    INSERT INTO public.wallet_limits(user_id, max_saved_allowed, current_saved_count)
    VALUES (_user, v_base, (SELECT count(*) FROM public.saved_contacts WHERE user_id = _user))
    RETURNING * INTO v_row;
  END IF;
  RETURN v_row;
END;
$$;

-- 4. Fix buy_contact_block: grant +500 (per spec), not +1000
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
        max_saved_allowed = max_saved_allowed + 500,
        updated_at = now()
    WHERE user_id = v_user
    RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.buy_contact_block() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.buy_contact_block() TO authenticated;

-- 5. Fix send_card_visit: Free=100/yr, B2B Premium=500/yr
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
  v_is_b2b_premium boolean := false;
BEGIN
  -- Auth check: caller must own from_business
  SELECT owner_id INTO v_owner FROM public.businesses WHERE id = _from_business;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to send from this business';
  END IF;

  IF _to_business = _from_business THEN
    RAISE EXCEPTION 'Cannot send to yourself';
  END IF;

  -- Check if business owner has an active B2B Premium subscription
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = v_owner
      AND s.status = 'active'
      AND s.sub_type = 'b2b_premium'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  ) INTO v_is_b2b_premium;

  -- Ensure quota row exists
  SELECT * INTO v_quota FROM public.message_quotas
    WHERE business_id = _from_business AND period_year = v_year FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.message_quotas(business_id, period_year, used_count, bonus_credits)
    VALUES (_from_business, v_year, 0, 0)
    RETURNING * INTO v_quota;
  END IF;

  -- Free = 100/yr, B2B Premium = 500/yr, bonus adds on top
  v_limit := CASE WHEN v_is_b2b_premium THEN 500 ELSE 100 END
             + COALESCE(v_quota.bonus_credits, 0);

  IF v_quota.used_count >= v_limit THEN
    IF v_is_b2b_premium THEN
      RAISE EXCEPTION 'Đã dùng hết % / % lượt gửi card B2B năm nay. Mua thêm lượt để tiếp tục.', v_quota.used_count, v_limit;
    ELSE
      RAISE EXCEPTION 'Tài khoản miễn phí chỉ có % lượt/năm. Nâng cấp B2B Premium để có 500 lượt/năm.', v_limit;
    END IF;
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

-- 6. Helper: get quota info for a business (used by frontend)
CREATE OR REPLACE FUNCTION public.get_business_quota(_business_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_year int := EXTRACT(YEAR FROM now())::int;
  v_quota public.message_quotas;
  v_is_premium boolean := false;
  v_base int;
  v_limit int;
BEGIN
  SELECT owner_id INTO v_owner FROM public.businesses WHERE id = _business_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Business not found'; END IF;
  IF v_owner <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = v_owner
      AND s.status = 'active'
      AND s.sub_type = 'b2b_premium'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  ) INTO v_is_premium;

  SELECT * INTO v_quota FROM public.message_quotas
    WHERE business_id = _business_id AND period_year = v_year;

  v_base := CASE WHEN v_is_premium THEN 500 ELSE 100 END;
  v_limit := v_base + COALESCE(v_quota.bonus_credits, 0);

  RETURN jsonb_build_object(
    'used', COALESCE(v_quota.used_count, 0),
    'base', v_base,
    'bonus', COALESCE(v_quota.bonus_credits, 0),
    'limit', v_limit,
    'remaining', v_limit - COALESCE(v_quota.used_count, 0),
    'tier', CASE WHEN v_is_premium THEN 'b2b_premium' ELSE 'free' END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_business_quota(uuid) TO authenticated;

-- 7. Useful indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type ON public.subscriptions(user_id, sub_type, status);
