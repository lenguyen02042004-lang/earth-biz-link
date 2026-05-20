
-- update_updated_at_column doesn't need SECURITY DEFINER
ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER;

-- Revoke direct execute from anon/authenticated; these are only called via RLS/triggers
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
