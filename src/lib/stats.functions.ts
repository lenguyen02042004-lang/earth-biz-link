import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const [{ count: connections }, { count: businesses }] = await Promise.all([
    supabaseAdmin.from("connect_messages").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("businesses").select("*", { count: "exact", head: true }).eq("status", "public"),
  ]);
  return {
    connections: connections ?? 0,
    businesses: businesses ?? 0,
  };
});
