REVOKE ALL ON FUNCTION public.saved_contacts_count_trigger() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_wallet_limits(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.saved_contacts_count_trigger() TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_wallet_limits(uuid) TO service_role;