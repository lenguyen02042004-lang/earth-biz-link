import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, Mail, Eye, Send } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
});

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ display_name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-12">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-display font-bold">
            Chào {profile?.display_name ?? user?.email?.split("@")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý danh thiếp doanh nghiệp và kết nối của bạn</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Eye, label: "Lượt xem", value: "0", color: "from-pink-500 to-rose-500" },
            { icon: Send, label: "Lượt gửi card", value: "0 / 1,000", color: "from-fuchsia-500 to-pink-500" },
            { icon: Mail, label: "Tin nhắn mới", value: "0", color: "from-rose-500 to-pink-500" },
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

        {/* CTA — create business */}
        <div className="relative overflow-hidden bg-gradient-vivid rounded-3xl p-8 text-white shadow-glow">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <Sparkles className="w-8 h-8 mb-3" />
            <h2 className="text-2xl font-bold mb-2">Tạo danh thiếp doanh nghiệp của bạn</h2>
            <p className="opacity-90 mb-5 max-w-lg">
              Đưa doanh nghiệp của bạn lên bản đồ thế giới chỉ trong 2 phút. Nhập thông tin cơ bản và xuất bản — hơn 10,000 đối tác tiềm năng đang chờ kết nối.
            </p>
            <Link to="/business/edit">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                Bắt đầu tạo <Sparkles className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
