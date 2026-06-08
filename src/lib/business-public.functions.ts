import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const slugRe = /^[a-z0-9-]+$/;

export const getBusinessBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ slug: z.string().min(1).max(120).regex(slugRe) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: biz, error } = await supabaseAdmin
      .from("businesses")
      .select("*, industries(name, slug), countries(name)")
      .eq("slug", data.slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!biz) return { business: null };
    if (biz.status !== "public") return { business: null };

    const [{ data: socials }, { data: gallery }] = await Promise.all([
      supabaseAdmin.from("business_socials").select("platform, url").eq("business_id", biz.id),
      supabaseAdmin.from("business_gallery").select("image_url").eq("business_id", biz.id).order("order_index"),
    ]);

    const industry = (biz as any).industries?.name ?? "Doanh nghiệp";
    const industry_slug = (biz as any).industries?.slug ?? "other";
    const country_name = (biz as any).countries?.name ?? biz.country_code ?? "";

    return {
      business: {
        id: biz.id,
        slug: biz.slug,
        name: biz.name,
        logo_url: biz.logo_url ?? "",
        banner_url: biz.banner_url ?? "",
        short_intro: biz.short_intro ?? "",
        description: (biz as any).description ?? "",
        certifications: Array.isArray((biz as any).certifications) ? (biz as any).certifications : [],
        address: biz.address ?? "",
        country_code: biz.country_code ?? "",
        country_name,
        province: biz.province ?? "",
        lat: biz.lat ?? 0,
        lng: biz.lng ?? 0,
        phone: biz.phone ?? "",
        email: biz.email ?? "",
        website: biz.website ?? "",
        industry,
        industry_slug,
        views_count: biz.views_count ?? 0,
        icon_tier: biz.icon_tier as "standard" | "premium",
        socials: Object.fromEntries((socials ?? []).map((s) => [s.platform, s.url])),
        gallery: (gallery ?? []).map((g) => g.image_url),
      },
    };
  });
