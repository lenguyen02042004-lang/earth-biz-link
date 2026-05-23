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

export const getBusinessStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ business_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const businessId = data.business_id;

    // Verify ownership
    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id, name, slug, logo_url, views_count, followers_count, owner_id")
      .eq("id", businessId)
      .single();
    if (bizErr || !biz || biz.owner_id !== context.userId) {
      throw new Error("Not authorized");
    }

    const [{ count: sentCount }, { count: receivedCount }, { count: unreadCount }] = await Promise.all([
      supabase.from("connect_messages").select("*", { count: "exact", head: true }).eq("from_business_id", businessId),
      supabase.from("connect_messages").select("*", { count: "exact", head: true }).eq("to_business_id", businessId),
      supabase.from("connect_messages").select("*", { count: "exact", head: true }).eq("to_business_id", businessId).is("read_at", null),
    ]);

    // Recent history (last 50 connections, both directions)
    const { data: history } = await supabase
      .from("connect_messages")
      .select("id, subject, created_at, read_at, from_business_id, to_business_id")
      .or(`from_business_id.eq.${businessId},to_business_id.eq.${businessId}`)
      .order("created_at", { ascending: false })
      .limit(50);

    const partnerIds = Array.from(
      new Set((history ?? []).map((m) => (m.from_business_id === businessId ? m.to_business_id : m.from_business_id)))
    );
    const { data: partners } = partnerIds.length
      ? await supabase.from("businesses").select("id, name, slug, logo_url").in("id", partnerIds)
      : { data: [] as Array<{ id: string; name: string; slug: string; logo_url: string | null }> };
    const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]));

    // Aggregate by day for last 30 days (sent)
    const since = new Date();
    since.setDate(since.getDate() - 29);
    const { data: recent } = await supabase
      .from("connect_messages")
      .select("created_at, from_business_id")
      .or(`from_business_id.eq.${businessId},to_business_id.eq.${businessId}`)
      .gte("created_at", since.toISOString());

    const byDay: Record<string, { sent: number; received: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      byDay[d.toISOString().slice(0, 10)] = { sent: 0, received: 0 };
    }
    for (const m of recent ?? []) {
      const key = m.created_at.slice(0, 10);
      if (!byDay[key]) continue;
      if (m.from_business_id === businessId) byDay[key].sent++;
      else byDay[key].received++;
    }
    const timeline = Object.entries(byDay).map(([date, v]) => ({ date, ...v }));

    return {
      business: {
        id: biz.id, name: biz.name, slug: biz.slug, logo_url: biz.logo_url,
        views_count: biz.views_count, followers_count: biz.followers_count,
      },
      counts: {
        sent: sentCount ?? 0,
        received: receivedCount ?? 0,
        unread: unreadCount ?? 0,
      },
      timeline,
      history: (history ?? []).map((m) => {
        const isOutgoing = m.from_business_id === businessId;
        const partnerId = isOutgoing ? m.to_business_id : m.from_business_id;
        return {
          id: m.id,
          subject: m.subject,
          created_at: m.created_at,
          read_at: m.read_at,
          direction: isOutgoing ? ("out" as const) : ("in" as const),
          partner: partnerMap.get(partnerId) ?? null,
        };
      }),
    };
  });

