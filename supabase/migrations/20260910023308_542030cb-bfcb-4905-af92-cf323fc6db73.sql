CREATE OR REPLACE FUNCTION public.buy_contact_block()
 RETURNS wallet_limits
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;