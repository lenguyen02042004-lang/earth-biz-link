-- 1. Modify connect_messages to support user_id
ALTER TABLE public.connect_messages ADD COLUMN from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.connect_messages ADD COLUMN to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Relax NOT NULL constraints on business_ids
ALTER TABLE public.connect_messages ALTER COLUMN from_business_id DROP NOT NULL;
ALTER TABLE public.connect_messages ALTER COLUMN to_business_id DROP NOT NULL;

-- Enforce that a message must have either a business or a user sender/receiver
ALTER TABLE public.connect_messages ADD CONSTRAINT chk_msg_sender CHECK (from_business_id IS NOT NULL OR from_user_id IS NOT NULL);
ALTER TABLE public.connect_messages ADD CONSTRAINT chk_msg_receiver CHECK (to_business_id IS NOT NULL OR to_user_id IS NOT NULL);

-- Create indexes for the new columns
CREATE INDEX idx_messages_to_user ON public.connect_messages(to_user_id);
CREATE INDEX idx_messages_from_user ON public.connect_messages(from_user_id);

-- Update RLS for connect_messages
DROP POLICY IF EXISTS "messages_select_participants" ON public.connect_messages;
CREATE POLICY "messages_select_participants" ON public.connect_messages FOR SELECT USING (
  -- I am the direct user sender/receiver
  auth.uid() = from_user_id OR auth.uid() = to_user_id OR
  -- Or I own the business sender/receiver
  EXISTS (SELECT 1 FROM public.businesses b WHERE (b.id = from_business_id OR b.id = to_business_id) AND b.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "messages_insert_sender" ON public.connect_messages;
CREATE POLICY "messages_insert_sender" ON public.connect_messages FOR INSERT WITH CHECK (
  (from_user_id IS NOT NULL AND auth.uid() = from_user_id) OR
  (from_business_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = from_business_id AND b.owner_id = auth.uid()))
);


-- 2. Modify message_quotas to operate on user_id instead of business_id
ALTER TABLE public.message_quotas ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from business_id
UPDATE public.message_quotas mq
SET user_id = b.owner_id
FROM public.businesses b
WHERE mq.business_id = b.id;

-- If any old quotas have no owner (orphaned businesses), delete them
DELETE FROM public.message_quotas WHERE user_id IS NULL;

-- Drop dependent policy first
DROP POLICY IF EXISTS "quotas_select_owner" ON public.message_quotas;

-- Make user_id NOT NULL and drop business_id
ALTER TABLE public.message_quotas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.message_quotas DROP CONSTRAINT message_quotas_business_id_period_year_key;
ALTER TABLE public.message_quotas DROP COLUMN business_id;

-- Recreate policy for user_id
CREATE POLICY "quotas_select_owner" ON public.message_quotas FOR SELECT USING (auth.uid() = user_id);

-- Handle duplicates (if user had multiple businesses, sum their quotas)
WITH duplicates AS (
  SELECT user_id, period_year, CAST(MIN(CAST(id AS text)) AS UUID) as keep_id, SUM(used_count) as total_used, SUM(bonus_credits) as total_bonus
  FROM public.message_quotas
  GROUP BY user_id, period_year
  HAVING COUNT(*) > 1
)
UPDATE public.message_quotas mq
SET used_count = d.total_used, bonus_credits = d.total_bonus
FROM duplicates d
WHERE mq.id = d.keep_id;

-- Delete the non-kept duplicates
DELETE FROM public.message_quotas mq
WHERE EXISTS (
  SELECT 1 FROM public.message_quotas dup
  WHERE dup.user_id = mq.user_id AND dup.period_year = mq.period_year AND dup.id < mq.id
);

-- Add the new unique constraint
ALTER TABLE public.message_quotas ADD CONSTRAINT message_quotas_user_id_period_year_key UNIQUE (user_id, period_year);


-- 3. Dynamic Wallet Limits via Trigger on Subscriptions
-- First, make sure ensure_wallet_limits correctly computes max_saved_allowed based on subscriptions
CREATE OR REPLACE FUNCTION public.ensure_wallet_limits(_user uuid)
RETURNS public.wallet_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.wallet_limits;
  v_base int := 200;
  v_addon_blocks int := 0;
  v_max_allowed int;
BEGIN
  -- Count active contact block add-ons for the user
  SELECT COUNT(*) INTO v_addon_blocks
  FROM public.subscriptions
  WHERE user_id = _user 
    AND status = 'active' 
    AND sub_type = 'contact_block_addon'
    AND (current_period_end IS NULL OR current_period_end > now());
    
  v_max_allowed := v_base + (v_addon_blocks * 500);

  SELECT * INTO v_row FROM public.wallet_limits WHERE user_id = _user FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.wallet_limits(user_id, max_saved_allowed, current_saved_count, blocks_purchased)
    VALUES (_user, v_max_allowed, (SELECT count(*) FROM public.saved_contacts WHERE user_id = _user), v_addon_blocks)
    RETURNING * INTO v_row;
  ELSE
    -- Update existing limit just in case
    UPDATE public.wallet_limits 
    SET max_saved_allowed = v_max_allowed, blocks_purchased = v_addon_blocks
    WHERE user_id = _user
    RETURNING * INTO v_row;
  END IF;
  
  RETURN v_row;
END;
$$;

-- Trigger to auto-update wallet limits when subscriptions change
CREATE OR REPLACE FUNCTION public.trg_update_wallet_limits_on_sub()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.ensure_wallet_limits(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM public.ensure_wallet_limits(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_wallet_limits ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_wallet_limits 
AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.trg_update_wallet_limits_on_sub();

-- Run ensure_wallet_limits for all users to update their current limits
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM auth.users LOOP
    PERFORM public.ensure_wallet_limits(r.id);
  END LOOP;
END;
$$;

-- 4. Trigger to prevent adding contacts if wallet is full
CREATE OR REPLACE FUNCTION public.check_wallet_limit_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int;
  v_current int;
BEGIN
  -- We do not block UPDATE or DELETE, only INSERT
  SELECT max_saved_allowed, current_saved_count 
  INTO v_limit, v_current
  FROM public.wallet_limits 
  WHERE user_id = NEW.user_id;

  -- Allow insert if limit not found (rare) or if current is below limit
  IF v_limit IS NOT NULL AND v_current >= v_limit THEN
    RAISE EXCEPTION 'Hạn mức ví danh bạ đã đầy (tối đa %). Vui lòng nâng cấp gói Mở rộng danh bạ.', v_limit USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_wallet_limit_ins ON public.saved_contacts;
CREATE TRIGGER trg_check_wallet_limit_ins BEFORE INSERT ON public.saved_contacts
  FOR EACH ROW EXECUTE FUNCTION public.check_wallet_limit_before_insert();


-- 5. RPC send_card_visit refactored to support user_id and business_id
CREATE OR REPLACE FUNCTION public.send_card_visit(
  _from_business uuid DEFAULT NULL,
  _to_business uuid DEFAULT NULL,
  _from_user uuid DEFAULT NULL,
  _to_user uuid DEFAULT NULL,
  _subject text DEFAULT '',
  _body text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg_id uuid;
  v_is_b2b_premium boolean;
  v_quota public.message_quotas;
  v_limit int;
  v_year int := extract(year from now());
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF _from_business IS NULL AND _from_user IS NULL THEN
    RAISE EXCEPTION 'Must specify a sender (from_business or from_user)';
  END IF;

  IF _to_business IS NULL AND _to_user IS NULL THEN
    RAISE EXCEPTION 'Must specify a receiver (to_business or to_user)';
  END IF;

  -- Validate sender authorization
  IF _from_business IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = _from_business AND owner_id = auth.uid()) THEN
      RAISE EXCEPTION 'Not authorized to send from this business';
    END IF;
  END IF;
  
  IF _from_user IS NOT NULL THEN
    IF _from_user <> auth.uid() THEN
      RAISE EXCEPTION 'Not authorized to send from this user';
    END IF;
  END IF;

  -- Check if user has an active B2B Premium subscription
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.status = 'active'
      AND s.sub_type = 'b2b_premium'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  ) INTO v_is_b2b_premium;

  -- Ensure quota row exists for user
  SELECT * INTO v_quota FROM public.message_quotas
    WHERE user_id = auth.uid() AND period_year = v_year FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.message_quotas(user_id, period_year, used_count, bonus_credits)
    VALUES (auth.uid(), v_year, 0, 0)
    RETURNING * INTO v_quota;
  END IF;

  -- Free = 100/yr, B2B Premium = 500/yr, bonus adds on top
  v_limit := CASE WHEN v_is_b2b_premium THEN 500 ELSE 100 END
             + COALESCE(v_quota.bonus_credits, 0);

  IF v_quota.used_count >= v_limit THEN
    IF v_is_b2b_premium THEN
      RAISE EXCEPTION 'Bạn đã dùng hết % / % lượt gửi danh thiếp năm nay. Mua thêm lượt để tiếp tục.', v_quota.used_count, v_limit;
    ELSE
      RAISE EXCEPTION 'Tài khoản miễn phí chỉ có % lượt gửi/năm. Nâng cấp B2B Premium để có 500 lượt/năm.', v_limit;
    END IF;
  END IF;

  INSERT INTO public.connect_messages(from_business_id, to_business_id, from_user_id, to_user_id, subject, body)
  VALUES (_from_business, _to_business, _from_user, _to_user, _subject, _body)
  RETURNING id INTO v_msg_id;

  UPDATE public.message_quotas
    SET used_count = used_count + 1, updated_at = now()
    WHERE id = v_quota.id;

  RETURN v_msg_id;
END;
$$;

-- 6. Replace get_business_quota with get_my_quota
CREATE OR REPLACE FUNCTION public.get_my_quota()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_b2b_premium boolean;
  v_quota public.message_quotas;
  v_limit int;
  v_year int := extract(year from now());
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.status = 'active'
      AND s.sub_type = 'b2b_premium'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  ) INTO v_is_b2b_premium;

  SELECT * INTO v_quota FROM public.message_quotas
    WHERE user_id = auth.uid() AND period_year = v_year;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'used_count', 0,
      'bonus_credits', 0,
      'limit', CASE WHEN v_is_b2b_premium THEN 500 ELSE 100 END
    );
  END IF;

  v_limit := CASE WHEN v_is_b2b_premium THEN 500 ELSE 100 END
             + COALESCE(v_quota.bonus_credits, 0);

  RETURN json_build_object(
    'used_count', v_quota.used_count,
    'bonus_credits', v_quota.bonus_credits,
    'limit', v_limit
  );
END;
$$;
