import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendCardVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      from_business: z.string().uuid(),
      to_business: z.string().uuid(),
      subject: z.string().trim().min(1).max(200),
      body: z.string().trim().min(1).max(2000),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: msgId, error } = await supabase.rpc("send_card_visit", {
      _from_business: data.from_business,
      _to_business: data.to_business,
      _subject: data.subject,
      _body: data.body,
    });
    if (error) throw new Error(error.message);
    return { id: msgId };
  });

export const getInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ business_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: messages, error } = await supabase
      .from("connect_messages")
      .select("id, subject, body, created_at, read_at, from_business_id, to_business_id")
      .or(`from_business_id.eq.${data.business_id},to_business_id.eq.${data.business_id}`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set(messages?.flatMap((m) => [m.from_business_id, m.to_business_id]) ?? []));
    const { data: bizes } = await supabase
      .from("businesses")
      .select("id, name, logo_url, slug, phone, email, website, address, province, country_code")
      .in("id", ids);
    const map = new Map((bizes ?? []).map((b) => [b.id, b]));
    return { messages: (messages ?? []).map((m) => ({ ...m, from: map.get(m.from_business_id), to: map.get(m.to_business_id) })) };
  });

export const markMessageRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("connect_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ business_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const year = new Date().getFullYear();
    const { data: row } = await context.supabase
      .from("message_quotas")
      .select("used_count, bonus_credits")
      .eq("business_id", data.business_id)
      .eq("period_year", year)
      .maybeSingle();

    // Tier-based base limit: Member (active sub) = 1000, Free = 100
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", context.userId)
      .eq("status", "active")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isMember = !!sub && (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
    const base = isMember ? 1000 : 100;
    const used = row?.used_count ?? 0;
    const bonus = row?.bonus_credits ?? 0;
    const limit = base + bonus;
    return {
      used, bonus, limit, remaining: limit - used,
      tier: isMember ? ("member" as const) : ("free" as const),
    };
  });

export const getMyBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("businesses")
      .select("id, name, slug, logo_url, status, icon_tier")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { businesses: data ?? [] };
  });
