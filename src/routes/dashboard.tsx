import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, Mail, Eye, Send, Plus, Pencil, Globe2, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Bảng điều khiển — GlobalBiz.Connect" }] }),
});

type Biz = {
  id: string; slug: string; name: string; logo_url: string | null;
  status: "draft" | "public"; icon_tier: "standard" | "premium";
  country_code: string | null; province: string | null;
  views_count: number; followers_count: number;
};

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string | null; email: string | null } | null>(null);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, email").eq("id", user.id).single()
      .then(({ data }) => setProfile(data));
    supabase.from("businesses")
      .select("id, slug, name, logo_url, status, icon_tier, country_code, province, views_count, followers_count")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBusinesses((data ?? []) as Biz[]);
        setLoadingBiz(false);
      });
  }, [user]);

  const totalViews = businesses.reduce((sum, b) => sum + (b.views_count ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-12">
        <div className="mb-8 animate-fade-up flex flex-wrap justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Xin chào, {profile?.display_name ?? user?.email?.split("@")[0]}
            </h1>
            <p className="text-muted-foreground mt-1">Quản lý danh thiếp doanh nghiệp và kết nối của bạn</p>
          </div>
          <Link to="/business/edit">
            <Button className="gap-2 bg-gradient-vivid text-white border-0 shadow-pink">
              <Plus className="w-4 h-4" /> Tạo danh thiếp mới
            </Button>
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Eye, label: "Tổng lượt xem", value: totalViews.toLocaleString(), color: "from-red-700 to-red-500" },
            { icon: Send, label: "Lượt gửi card", value: "0 / 1,000", color: "from-rose-700 to-red-500" },
            { icon: Mail, label: "Tin nhắn mới", value: "0", color: "from-red-800 to-rose-500" },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-card">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Businesses list */}
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold mb-3">Doanh nghiệp của bạn</h2>

          {loadingBiz ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : businesses.length === 0 ? (
            <div className="relative overflow-hidden bg-gradient-vivid rounded-3xl p-8 text-white shadow-glow">
              <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <Sparkles className="w-8 h-8 mb-3" />
                <h2 className="text-2xl font-bold mb-2">Tạo danh thiếp doanh nghiệp đầu tiên</h2>
                <p className="opacity-90 mb-5 max-w-lg">
                  Đưa doanh nghiệp lên bản đồ thế giới chỉ trong 2 phút. Hơn 10,000 đối tác tiềm năng đang chờ kết nối.
                </p>
                <Link to="/business/edit">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                    Bắt đầu tạo <Sparkles className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {businesses.map((b) => (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-4 shadow-card flex gap-3 items-start">
                  <div className={b.icon_tier === "premium" ? "ring-premium flex-shrink-0" : "flex-shrink-0"}>
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.name} className="w-14 h-14 rounded-full bg-white object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                        <Globe2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{b.name}</h3>
                      <Badge variant={b.status === "public" ? "default" : "secondary"} className={b.status === "public" ? "bg-primary text-primary-foreground border-0" : ""}>
                        {b.status === "public" ? "Công khai" : "Bản nháp"}
                      </Badge>
                    </div>
                    {(b.country_code || b.province) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{[b.province, b.country_code].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {b.views_count}</span>
                      <span>{b.followers_count} người theo dõi</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link to="/business/edit" search={{ id: b.id }}>
                        <Button size="sm" variant="outline" className="gap-1"><Pencil className="w-3 h-3" /> Sửa</Button>
                      </Link>
                      {b.status === "public" && (
                        <Link to="/b/$slug" params={{ slug: b.slug }}>
                          <Button size="sm" variant="ghost" className="gap-1"><Eye className="w-3 h-3" /> Xem</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
