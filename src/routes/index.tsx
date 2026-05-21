import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe3D } from "@/components/Globe3D";
import { BusinessCard } from "@/components/BusinessCard";
import { DEMO_BUSINESSES, type DemoBusiness } from "@/lib/mock-businesses";
import { INDUSTRY_LIST } from "@/lib/constants";
import {
  Search, Globe2, LogIn, Sparkles, LayoutDashboard, LogOut,
  Cpu, Landmark, Building2, Factory, ShoppingBag, Plane, GraduationCap,
  HeartPulse, UtensilsCrossed, Truck, Wheat, Zap, Megaphone, Scale,
  HardHat, Shirt, Music, Car, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => setMounted(true), []);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of DEMO_BUSINESSES) m[b.industry_slug] = (m[b.industry_slug] || 0) + 1;
    return m;
  }, []);

  const filtered = useMemo(() => {
    return DEMO_BUSINESSES.filter((b) => {
      if (industry !== "all" && b.industry_slug !== industry) return false;
      if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [industry, search]);

  return (
    <div className="fixed inset-0 bg-gradient-globe overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 -left-32 w-[40rem] h-[40rem] rounded-full bg-primary/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-[40rem] h-[40rem] rounded-full bg-primary-glow/20 blur-[140px] pointer-events-none" />

      {/* Full-screen globe */}
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

      {/* Bottom panel: search + industries */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="px-4 sm:px-6 pb-5 pt-12 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-auto">
          <div className="max-w-5xl mx-auto">
            {/* Search */}
            <div className="relative mb-4 animate-fade-up">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên doanh nghiệp, ngành nghề, quốc gia..."
                className="h-14 pl-12 pr-32 bg-white/95 backdrop-blur-xl border-white/20 text-foreground placeholder:text-muted-foreground rounded-2xl shadow-glow text-base focus-visible:ring-2 focus-visible:ring-primary"
              />
              <Link to="/explore" className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button size="sm" className="h-10 bg-gradient-vivid hover:opacity-90 text-white border-0 rounded-xl px-4 gap-1.5">
                  Khám phá
                </Button>
              </Link>
            </div>

            {/* Industry grid */}
            <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-xs uppercase tracking-widest text-white/70 font-semibold">
                  Ngành nghề
                </h2>
                <button
                  onClick={() => setIndustry("all")}
                  className={`text-xs font-medium transition-smooth ${
                    industry === "all" ? "text-primary-glow" : "text-white/60 hover:text-white"
                  }`}
                >
                  Tất cả ({DEMO_BUSINESSES.length})
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2">
                {INDUSTRY_LIST.map((ind) => {
                  const Icon = INDUSTRY_ICONS[ind.slug] || MoreHorizontal;
                  const count = counts[ind.slug] || 0;
                  const active = industry === ind.slug;
                  return (
                    <button
                      key={ind.slug}
                      onClick={() => setIndustry(active ? "all" : ind.slug)}
                      className={`group relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border transition-smooth ${
                        active
                          ? "bg-gradient-vivid border-transparent text-white shadow-pink scale-[1.03]"
                          : "bg-white/10 border-white/10 text-white/85 hover:bg-white/20 hover:border-white/25 backdrop-blur-md"
                      }`}
                      title={ind.name}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-[10px] font-medium leading-tight text-center line-clamp-2 px-0.5">
                        {ind.name}
                      </span>
                      <span className={`text-[10px] font-bold tabular-nums ${
                        active ? "text-white" : "text-primary-glow"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selected && <BusinessCard business={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
