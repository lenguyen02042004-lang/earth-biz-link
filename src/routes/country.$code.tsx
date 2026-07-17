import { useState, useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { MapView } from "@/components/MapView";
import { BusinessCard } from "@/components/BusinessCard";
import { FollowButton } from "@/components/FollowButton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DEMO_BUSINESSES, type DemoBusiness } from "@/lib/mock-businesses";
import { COUNTRY_LIST, INDUSTRY_LIST } from "@/lib/constants";
import { formatCount } from "@/lib/format";
import { Eye, Search, MapPin, Building2, ArrowLeft, Globe2, Map as MapIcon } from "lucide-react";

export const Route = createFileRoute("/country/$code")({
  loader: ({ params }) => {
    const country = COUNTRY_LIST.find(
      (c) => c.code.toLowerCase() === params.code.toLowerCase(),
    );
    if (!country) throw notFound();
    return { country };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Không tìm thấy quốc gia — GlobalBiz.Connect" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { country } = loaderData;
    const title = `Doanh nghiệp ${country.name} — GlobalBiz.Connect`;
    const description = `Khám phá doanh nghiệp tại ${country.name} (${country.code}) trên bản đồ doanh nghiệp toàn cầu.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: CountryPage,
  notFoundComponent: CountryNotFound,
});

function CountryNotFound() {
  const { code } = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 max-w-xl mx-auto text-center px-4">
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy quốc gia</h1>
        <p className="text-muted-foreground mb-4">
          Mã quốc gia "{code}" không có trong danh sách.
        </p>
        <Link to="/explore" className="text-primary hover:underline">
          ← Quay lại khám phá
        </Link>
      </div>
    </div>
  );
}

function CountryPage() {
  const { country } = Route.useLoaderData();
  const [selected, setSelected] = useState<DemoBusiness | null>(null);
  const [industry, setIndustry] = useState("all");
  const [search, setSearch] = useState("");

  const inCountry = useMemo(
    () => DEMO_BUSINESSES.filter((b) => b.country_code === country.code),
    [country.code],
  );

  const filtered = useMemo(
    () =>
      inCountry.filter((b) => {
        if (industry !== "all" && b.industry_slug !== industry) return false;
        if (search && !b.name.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [inCountry, industry, search],
  );

  const industryCounts = useMemo(() => {
    const m = new Map<string, number>();
    inCountry.forEach((b) => m.set(b.industry_slug, (m.get(b.industry_slug) ?? 0) + 1));
    return m;
  }, [inCountry]);

  const availableIndustries = INDUSTRY_LIST.filter((i) => industryCounts.has(i.slug));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <header className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Link to="/explore" className="hover:text-foreground">Khám phá</Link>
              <span>/</span>
              <span className="text-foreground">{country.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-muted text-muted-foreground">
                {country.code}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold">
                Doanh nghiệp tại {country.name}
              </h1>
            </div>
            <div className="flex flex-wrap gap-6 mt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {inCountry.length} doanh nghiệp
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {availableIndustries.length} ngành nghề
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_1.2fr] gap-6">
          {/* List */}
          <section>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm doanh nghiệp..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="sm:w-[220px]">
                  <SelectValue placeholder="Ngành nghề" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Tất cả ngành ({inCountry.length})</SelectItem>
                  {availableIndustries.map((i) => (
                    <SelectItem key={i.slug} value={i.slug}>
                      {i.name} ({industryCounts.get(i.slug)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                Chưa có doanh nghiệp nào phù hợp.
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setSelected(b)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") setSelected(b); }}
                    className="p-3 rounded-2xl bg-card hover:bg-accent transition-smooth border border-border/40 hover:border-primary/40 hover:shadow-soft flex gap-3 items-center cursor-pointer"
                  >
                    <div className={b.icon_tier === "premium" ? "ring-premium flex-shrink-0" : "flex-shrink-0"}>
                      <img src={b.logo_url} alt="" className="w-12 h-12 rounded-full bg-white object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.industry} · {b.province}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Eye className="w-3 h-3" /> {formatCount(b.views_count)}
                      </p>
                    </div>
                    <FollowButton businessId={b.id} variant="icon" className="shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Map */}
          <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] h-[400px] rounded-2xl overflow-hidden border border-border">
            <MapView businesses={filtered} onSelect={setSelected} />
          </aside>
        </div>

        {/* Other countries */}
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <h2 className="font-display text-xl font-bold mb-4">Khám phá quốc gia khác</h2>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_LIST.filter((c) => c.code !== country.code).map((c) => (
              <Link
                key={c.code}
                to="/country/$code"
                params={{ code: c.code.toLowerCase() }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card hover:bg-accent border border-border/50 text-sm transition-smooth"
              >
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c.code}</span>
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
      {selected && <BusinessCard business={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
