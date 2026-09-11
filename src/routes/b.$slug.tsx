import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { BusinessCard } from "@/components/BusinessCard";
import { DEMO_BUSINESSES } from "@/lib/mock-businesses";
import { getBusinessBySlug } from "@/lib/business-public.functions";

export const Route = createFileRoute("/b/$slug")({
  component: BusinessDetailPage,
  loader: async ({ params }) => {
    // 1) Try database first (covers both demo-seeded and real businesses)
    try {
      const res = await getBusinessBySlug({ data: { slug: params.slug } });
      if (res.business) return { business: res.business };
    } catch {
      // fall through to mock
    }
    // 2) Fallback to legacy mock so old links still work
    const mock = DEMO_BUSINESSES.find((b) => b.slug === params.slug);
    if (!mock) throw notFound();
    return { business: mock };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [] };
    const b: any = loaderData.business;
    const url = `https://earth-biz-link.lovable.app/b/${params.slug}`;
    const sameAs = Object.values(b.socials ?? {}).filter(Boolean) as string[];
    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: b.name,
      description: b.short_intro || b.description || undefined,
      url,
      image: b.banner_url || b.logo_url || undefined,
      logo: b.logo_url || undefined,
      telephone: b.phone || undefined,
      email: b.email || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: b.address || undefined,
        addressLocality: b.province || undefined,
        addressCountry: b.country_code || undefined,
      },
      geo:
        b.lat && b.lng
          ? { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng }
          : undefined,
      sameAs: sameAs.length ? sameAs : undefined,
    };
    return {
      meta: [
        { title: `${b.name} — BizConnect.One` },
        { name: "description", content: b.short_intro },
        { property: "og:title", content: b.name },
        { property: "og:description", content: b.short_intro },
        { property: "og:image", content: b.banner_url },
        { property: "og:url", content: url },
        { property: "og:type", content: "business.business" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: b.banner_url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 text-center px-4">
        <h1 className="font-display text-2xl font-bold mb-2">Không tải được doanh nghiệp</h1>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 text-center px-4">
        <h1 className="font-display text-2xl font-bold mb-2">Không tìm thấy doanh nghiệp</h1>
        <p className="text-muted-foreground">Link có thể đã đổi hoặc doanh nghiệp chưa xuất bản.</p>
      </div>
    </div>
  ),
});

function BusinessDetailPage() {
  const { business } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <BusinessCard business={business as any} onClose={() => navigate({ to: "/" })} />
      </div>
    </div>
  );
}
