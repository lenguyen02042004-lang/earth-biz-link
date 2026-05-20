import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Globe3D } from "@/components/Globe3D";
import { BusinessCard } from "@/components/BusinessCard";
import { FilterBar } from "@/components/FilterBar";
import { DEMO_BUSINESSES, type DemoBusiness } from "@/lib/mock-businesses";
import { COUNTRY_LIST, INDUSTRY_LIST } from "@/lib/constants";
import { ArrowRight, Sparkles, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "GlobalBiz.Connect — Bản đồ doanh nghiệp toàn cầu" },
      { name: "description", content: "Khám phá và kết nối với doanh nghiệp khắp thế giới qua bản đồ tương tác 3D. Quảng bá thương hiệu, mở rộng giao thương quốc tế." },
      { property: "og:title", content: "GlobalBiz.Connect — Bản đồ doanh nghiệp toàn cầu" },
      { property: "og:description", content: "Khám phá và kết nối với doanh nghiệp khắp thế giới." },
    ],
  }),
});

function HomePage() {
  const [selected, setSelected] = useState<DemoBusiness | null>(null);
  const [country, setCountry] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return DEMO_BUSINESSES.filter((b) => {
      if (country !== "all" && b.country_code !== country) return false;
      if (industry !== "all" && b.industry_slug !== industry) return false;
      if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [country, industry, search]);

  return (
    <div className="min-h-screen bg-gradient-globe overflow-hidden">
      <Navbar />

      {/* Hero section with globe */}
      <section className="relative pt-16 h-screen flex flex-col">
        {/* Decorative gradient blobs */}
        <div className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-primary/30 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 rounded-full bg-primary-glow/30 blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 pb-4 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-dark text-xs text-white/90 mb-4 animate-fade-up">
            <Sparkles className="w-3 h-3 text-primary-glow" />
            <span>Hơn 10,000+ doanh nghiệp từ 100+ quốc gia</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] mb-3 animate-fade-up">
            Kết nối doanh nghiệp <br />
            <span className="text-gradient">trên bản đồ thế giới</span>
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Xoay quả địa cầu — bấm vào logo doanh nghiệp để xem danh thiếp đầy đủ.
            Mở rộng giao thương quốc tế chỉ với một cú chạm.
          </p>

          <div className="mt-5 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <FilterBar
              countries={COUNTRY_LIST} industries={INDUSTRY_LIST}
              country={country} industry={industry} search={search}
              onCountry={setCountry} onIndustry={setIndustry} onSearch={setSearch}
            />
          </div>
        </div>

        {/* Globe takes remaining space */}
        <div className="flex-1 relative">
          <Globe3D businesses={filtered} onSelect={setSelected} />
        </div>

        {/* Floating CTA */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <Link to="/explore">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow gap-2 rounded-full px-6">
              <Globe2 className="w-4 h-4" /> Xem dạng bản đồ phẳng <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {selected && <BusinessCard business={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
