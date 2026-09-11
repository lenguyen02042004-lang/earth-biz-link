-- Admin helpers for granting add-on credits/blocks
-- Called by adminUpdatePaymentStatus after payment verification

-- Grant extra quota credits to a business (incremental)
CREATE OR REPLACE FUNCTION public.admin_add_quota_bonus(_business_id uuid, _credits int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year int := EXTRACT(YEAR FROM now())::int;
BEGIN
  INSERT INTO public.message_quotas(business_id, period_year, used_count, bonus_credits)
  VALUES (_business_id, v_year, 0, _credits)
  ON CONFLICT (business_id, period_year)
  DO UPDATE SET bonus_credits = public.message_quotas.bonus_credits + _credits,
                updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_add_quota_bonus(uuid, int) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_quota_bonus(uuid, int) TO service_role;

-- Grant extra wallet block to a user (+500 contacts)
CREATE OR REPLACE FUNCTION public.admin_add_wallet_block(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallet_limits(user_id, max_saved_allowed, current_saved_count, blocks_purchased)
  VALUES (_user_id, 700, 0, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    blocks_purchased = public.wallet_limits.blocks_purchased + 1,
    max_saved_allowed = public.wallet_limits.max_saved_allowed + 500,
    updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_add_wallet_block(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_wallet_block(uuid) TO service_role;
