import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BizRow = z.object({
  owner_email: z.string().email(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  short_intro: z.string().max(500).optional().default(""),
  address: z.string().max(500).optional().default(""),
  country_code: z.string().length(2).optional().nullable(),
  province: z.string().max(120).optional().nullable(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
  industry_slug: z.string().optional().nullable(),
  status: z.enum(["draft", "public", "hidden"]).optional().default("draft"),
  icon_tier: z.enum(["standard", "premium"]).optional().default("standard"),
});

async function requireAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin only");
}

export const bulkImportBusinesses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ rows: z.array(z.record(z.string(), z.any())).max(2000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load industry map
    const { data: industries } = await supabaseAdmin.from("industries").select("id, slug");
    const indMap = new Map((industries ?? []).map((i: any) => [i.slug, i.id]));

    const results = { ok: 0, failed: [] as { row: number; error: string }[] };

    for (let i = 0; i < data.rows.length; i++) {
      try {
        const parsed = BizRow.parse(data.rows[i]);
        // Find owner by email via admin API
        const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const user = users?.users.find((u) => u.email?.toLowerCase() === parsed.owner_email.toLowerCase());
        if (!user) { results.failed.push({ row: i + 1, error: `No user with email ${parsed.owner_email}` }); continue; }

        const industry_id = parsed.industry_slug ? indMap.get(parsed.industry_slug) ?? null : null;
        const { error } = await supabaseAdmin.from("businesses").upsert({
          owner_id: user.id,
          name: parsed.name,
          slug: parsed.slug,
          short_intro: parsed.short_intro,
          address: parsed.address,
          country_code: parsed.country_code,
          province: parsed.province,
          lat: parsed.lat,
          lng: parsed.lng,
          phone: parsed.phone,
          email: parsed.email,
          website: parsed.website,
          logo_url: parsed.logo_url,
          banner_url: parsed.banner_url,
          industry_id,
          status: parsed.status,
          icon_tier: parsed.icon_tier,
        }, { onConflict: "slug" });
        if (error) throw error;
        results.ok++;
      } catch (e: any) {
        results.failed.push({ row: i + 1, error: e.message ?? String(e) });
      }
    }
    return results;
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    return { isAdmin: !!data };
  });
