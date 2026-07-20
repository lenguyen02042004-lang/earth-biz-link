import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { COUNTRY_LIST } from "@/lib/constants";
import { DEMO_BUSINESSES } from "@/lib/mock-businesses";
import { useMemo } from "react";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/countries")({
  head: () => ({
    meta: [
      { title: "Danh mục quốc gia có doanh nghiệp — GlobalBiz.Connect" },
      { name: "description", content: "Duyệt danh mục doanh nghiệp theo từng quốc gia trên bản đồ B2B toàn cầu. Chọn thị trường bạn quan tâm để khám phá đối tác tiềm năng." },
      { property: "og:title", content: "Danh mục quốc gia có doanh nghiệp — GlobalBiz.Connect" },
      { property: "og:description", content: "Duyệt danh mục doanh nghiệp theo từng quốc gia trên bản đồ B2B toàn cầu — chọn thị trường bạn quan tâm để khám phá đối tác." },
      { property: "og:url", content: "https://earth-biz-link.lovable.app/countries" },
    ],
    links: [{ rel: "canonical", href: "https://earth-biz-link.lovable.app/countries" }],
  }),

  component: CountriesPage,
});

function CountriesPage() {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    DEMO_BUSINESSES.forEach((b) => m.set(b.country_code, (m.get(b.country_code) ?? 0) + 1));
    return m;
  }, []);

  const sorted = [...COUNTRY_LIST].sort(
    (a, b) => (counts.get(b.code) ?? 0) - (counts.get(a.code) ?? 0),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 max-w-7xl mx-auto px-4 pb-16">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Quốc gia</h1>
        <p className="text-muted-foreground mb-8">
          Chọn một quốc gia để xem doanh nghiệp trong khu vực đó.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map((c) => {
            const n = counts.get(c.code) ?? 0;
            return (
              <Link
                key={c.code}
                to="/country/$code"
                params={{ code: c.code.toLowerCase() }}
                className="p-4 rounded-2xl bg-card hover:bg-accent border border-border/50 hover:border-primary/40 transition-smooth hover:shadow-soft"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {c.code}
                  </span>
                  <span className="font-semibold truncate">{c.name}</span>
                </div>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {n} doanh nghiệp
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
