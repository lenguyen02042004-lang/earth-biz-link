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
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.business.name} — GlobalBiz.Connect` },
          { name: "description", content: loaderData.business.short_intro },
          { property: "og:title", content: loaderData.business.name },
          { property: "og:description", content: loaderData.business.short_intro },
          { property: "og:image", content: loaderData.business.banner_url },
        ]
      : [],
  }),
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
