-- Unified Quota and Wallet Limits Migration
-- B2B Block and Contact Block Addon should both increase BOTH message sends and contact saving limits by 500.

DROP FUNCTION IF EXISTS get_my_quota();
CREATE OR REPLACE FUNCTION get_my_quota()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used_count int;
  v_limit int;
  v_active_blocks int;
BEGIN
  -- 1. Count messages sent this year
  SELECT COALESCE(SUM(used_count), 0) INTO v_used_count
  FROM message_quotas
  WHERE user_id = auth.uid() AND period_year = EXTRACT(YEAR FROM CURRENT_DATE);

  -- 2. Count active blocks (b2b_block_500 AND contact_block_addon)
  SELECT COUNT(*) INTO v_active_blocks
  FROM subscriptions
  WHERE user_id = auth.uid() 
    AND status = 'active'
    AND sub_type IN ('b2b_block_500', 'contact_block_addon')
    AND (current_period_end IS NULL OR current_period_end > now());

  -- 3. Calculate limit: Base 200 + 500 per block
  v_limit := 200 + (v_active_blocks * 500);

  RETURN jsonb_build_object(
    'used_count', v_used_count,
    'bonus_credits', 0,
    'limit', v_limit
  );
END;
$$;

DROP FUNCTION IF EXISTS my_wallet_limits();
CREATE OR REPLACE FUNCTION my_wallet_limits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
  v_limit int;
  v_active_blocks int;
BEGIN
  -- 1. Count saved contacts
  SELECT count(*) INTO v_count
  FROM saved_contacts
  WHERE user_id = auth.uid();

  -- 2. Count active blocks (b2b_block_500 AND contact_block_addon)
  SELECT COUNT(*) INTO v_active_blocks
  FROM subscriptions
  WHERE user_id = auth.uid() 
    AND status = 'active'
    AND sub_type IN ('b2b_block_500', 'contact_block_addon')
    AND (current_period_end IS NULL OR current_period_end > now());
    
  -- 3. Calculate limit: Base 200 + 500 per block
  v_limit := 200 + (v_active_blocks * 500);

  RETURN jsonb_build_object(
    'current_saved_count', v_count,
    'max_saved_allowed', v_limit,
    'blocks_purchased', v_active_blocks
  );
END;
$$;
