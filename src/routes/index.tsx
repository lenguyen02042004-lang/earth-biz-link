import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Globe3D } from "@/components/Globe3D";
import { BusinessCard } from "@/components/BusinessCard";
import { DEMO_BUSINESSES, type DemoBusiness } from "@/lib/mock-businesses";
import { INDUSTRY_LIST, COUNTRY_LIST } from "@/lib/constants";
import { getPublicStats } from "@/lib/stats.functions";
import {
  Search, Globe2, LogIn, Sparkles, LayoutDashboard, LogOut, ChevronDown,
  Cpu, Landmark, Building2, Factory, ShoppingBag, Plane, GraduationCap,
  HeartPulse, UtensilsCrossed, Truck, Wheat, Zap, Megaphone, Scale,
  HardHat, Shirt, Music, Car, MoreHorizontal, Send, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "GlobalBiz.Connect — Bản đồ doanh nghiệp toàn cầu" },
      { name: "description", content: "Khám phá và kết nối với doanh nghiệp khắp thế giới qua bản đồ tương tác 3D." },
    ],
  }),
});

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  technology: Cpu, finance: Landmark, "real-estate": Building2, manufacturing: Factory,
  retail: ShoppingBag, hospitality: Plane, education: GraduationCap, healthcare: HeartPulse,
  "food-beverage": UtensilsCrossed, logistics: Truck, agriculture: Wheat, energy: Zap,
  marketing: Megaphone, consulting: Scale, construction: HardHat, fashion: Shirt,
  entertainment: Music, automotive: Car, other: MoreHorizontal,
};

function HomePage() {
  const [selected, setSelected] = useState<DemoBusiness | null>(null);
  const [industry, setIndustry] = useState("all");
  const [country, setCountry] = useState("all");
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => getPublicStats(),
    staleTime: 60_000,
  });

  useEffect(() => setMounted(true), []);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of DEMO_BUSINESSES) m[b.industry_slug] = (m[b.industry_slug] || 0) + 1;
    return m;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DEMO_BUSINESSES.filter((b) => {
      if (industry !== "all" && b.industry_slug !== industry) return false;
      if (country !== "all" && b.country_code !== country) return false;
      if (q) {
        const indName = INDUSTRY_LIST.find((i) => i.slug === b.industry_slug)?.name.toLowerCase() ?? "";
        const cName = COUNTRY_LIST.find((c) => c.code === b.country_code)?.name.toLowerCase() ?? "";
        if (
          !b.name.toLowerCase().includes(q) &&
          !indName.includes(q) &&
          !cName.includes(q)
        ) return false;
      }
      return true;
    });
  }, [industry, country, search]);

  function scrollToExplore() {
    document.getElementById("explore-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-gradient-globe">
      {/* Decorative gradient blobs */}
      <div className="fixed top-0 -left-32 w-[40rem] h-[40rem] rounded-full bg-primary/20 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 -right-32 w-[40rem] h-[40rem] rounded-full bg-primary-glow/20 blur-[140px] pointer-events-none" />

      {/* ===== Hero: full-viewport globe ===== */}
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0" suppressHydrationWarning>
          {mounted && <Globe3D businesses={filtered} onSelect={setSelected} />}
        </div>

        {/* Top-left logo */}
        <div className="absolute top-5 left-5 z-30">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-vivid blur-lg opacity-70 group-hover:opacity-100 transition-smooth" />
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-vivid flex items-center justify-center shadow-glow">
                <Globe2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="font-display font-bold text-white text-lg leading-tight tracking-tight">
                GlobalBiz<span className="text-gradient">.Connect</span>
              </div>
              <div className="text-[10px] text-white/60 uppercase tracking-widest">Worldwide B2B Map</div>
            </div>
          </Link>
        </div>

        {/* Top-right auth */}
        <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
          <Link to="/explore">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-2">
              <Globe2 className="w-4 h-4" /> <span className="hidden sm:inline">Bản đồ 2D</span>
            </Button>
          </Link>
          <Link to="/pricing">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white hidden sm:inline-flex">
              Bảng giá
            </Button>
          </Link>
          {!loading && user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-2">
                  <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Bảng điều khiển</span>
                </Button>
              </Link>
              <Button size="icon" variant="ghost" onClick={() => supabase.auth.signOut()} className="text-white hover:bg-white/10 hover:text-white" title="Đăng xuất">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : !loading ? (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-2">
                  <LogIn className="w-4 h-4" /> Đăng nhập
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="gap-2 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink">
                  <Sparkles className="w-4 h-4" /> Bắt đầu
                </Button>
              </Link>
            </>
          ) : null}
        </div>

        {/* Subtle hint to scroll */}
        <button
          onClick={scrollToExplore}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 text-white/70 hover:text-white transition-smooth animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <span className="text-xs uppercase tracking-widest font-semibold">Tìm kiếm & Ngành nghề</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </section>

      {/* ===== Search + Industry panel (below globe) ===== */}
      <section id="explore-panel" className="relative z-10 px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto">
          {/* Search row */}
          <div className="animate-fade-up">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">
              Tìm doanh nghiệp trên khắp <span className="text-gradient">thế giới</span>
            </h2>
            <p className="text-white/60 text-sm mb-5">
              Lọc theo tên, ngành nghề và quốc gia. {DEMO_BUSINESSES.length} doanh nghiệp đã được lập chỉ mục.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl shadow-glow">
              <div className="relative md:col-span-6">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tên doanh nghiệp..."
                  className="h-11 pl-10 bg-white/95 border-white/20 text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="md:col-span-3">
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="h-11 bg-white/95 border-white/20 text-foreground rounded-xl">
                    <SelectValue placeholder="Ngành nghề" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả ngành nghề</SelectItem>
                    {INDUSTRY_LIST.map((i) => (
                      <SelectItem key={i.slug} value={i.slug}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 flex gap-2">
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11 bg-white/95 border-white/20 text-foreground rounded-xl flex-1">
                    <SelectValue placeholder="Quốc gia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả quốc gia</SelectItem>
                    {COUNTRY_LIST.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 text-sm text-white/70">
              <span className="font-semibold text-primary-glow">{filtered.length}</span> doanh nghiệp khớp bộ lọc.
              {(industry !== "all" || country !== "all" || search) && (
                <button
                  onClick={() => { setIndustry("all"); setCountry("all"); setSearch(""); }}
                  className="ml-3 underline text-white/60 hover:text-white"
                >
                  Xoá bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Industries grid */}
          <div className="mt-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-widest text-white/70 font-semibold">
                Ngành nghề trên bản đồ
              </h3>
              <button
                onClick={() => setIndustry("all")}
                className={`text-xs font-medium transition-smooth ${
                  industry === "all" ? "text-primary-glow" : "text-white/60 hover:text-white"
                }`}
              >
                Hiện tất cả ({DEMO_BUSINESSES.length})
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {INDUSTRY_LIST.map((ind) => {
                const Icon = INDUSTRY_ICONS[ind.slug] || MoreHorizontal;
                const count = counts[ind.slug] || 0;
                const active = industry === ind.slug;
                return (
                  <button
                    key={ind.slug}
                    onClick={() => setIndustry(active ? "all" : ind.slug)}
                    className={`group relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-smooth ${
                      active
                        ? "bg-gradient-vivid border-transparent text-white shadow-pink scale-[1.03]"
                        : "bg-white/10 border-white/10 text-white/85 hover:bg-white/20 hover:border-white/25 backdrop-blur-md hover:scale-[1.02]"
                    }`}
                    title={ind.name}
                  >
                    <Icon className="w-6 h-6 shrink-0" />
                    <span className="text-xs font-medium leading-tight text-center line-clamp-2">
                      {ind.name}
                    </span>
                    <span className={`text-xs font-bold tabular-nums ${
                      active ? "text-white" : "text-primary-glow"
                    }`}>
                      {count} DN
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 text-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/explore">
              <Button size="lg" className="bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink gap-2">
                <Globe2 className="w-5 h-5" /> Mở bản đồ 2D đầy đủ
              </Button>
            </Link>
            {!user && (
              <Link to="/signup">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/15 gap-2">
                  <Sparkles className="w-5 h-5" /> Đăng ký doanh nghiệp của bạn
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {selected && <BusinessCard business={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
