import { createFileRoute, notFound } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { BusinessCard } from "@/components/BusinessCard";
import { DEMO_BUSINESSES } from "@/lib/mock-businesses";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/b/$slug")({
  component: BusinessDetailPage,
  loader: ({ params }) => {
    const business = DEMO_BUSINESSES.find((b) => b.slug === params.slug);
    if (!business) throw notFound();
    return { business };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.business.name} — GlobalBiz.Connect` },
      { name: "description", content: loaderData.business.short_intro },
      { property: "og:title", content: loaderData.business.name },
      { property: "og:description", content: loaderData.business.short_intro },
      { property: "og:image", content: loaderData.business.banner_url },
    ] : [],
  }),
});

function BusinessDetailPage() {
  const { business } = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <BusinessCard business={business} onClose={() => navigate({ to: "/" })} />
      </div>
    </div>
  );
}
