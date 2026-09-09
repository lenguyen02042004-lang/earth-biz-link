CREATE OR REPLACE FUNCTION public.ensure_wallet_limits(_user uuid)
 RETURNS wallet_limits
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.wallet_limits;
  v_base int;
BEGIN
  SELECT * INTO v_row FROM public.wallet_limits WHERE user_id = _user FOR UPDATE;
  IF NOT FOUND THEN
    v_base := CASE WHEN EXISTS (SELECT 1 FROM public.businesses WHERE owner_id = _user) THEN 500 ELSE 200 END;
    INSERT INTO public.wallet_limits(user_id, max_saved_allowed, current_saved_count)
    VALUES (_user, v_base, (SELECT count(*) FROM public.saved_contacts WHERE user_id = _user))
    RETURNING * INTO v_row;
  END IF;
  RETURN v_row;
END;
$function$;

UPDATE public.wallet_limits w
SET max_saved_allowed = 500, updated_at = now()
WHERE w.blocks_purchased = 0
  AND w.max_saved_allowed = 1000;