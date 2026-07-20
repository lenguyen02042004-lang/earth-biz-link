import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Đăng nhập tài khoản doanh nghiệp — GlobalBiz.Connect" },
      { name: "description", content: "Đăng nhập vào GlobalBiz.Connect để quản lý danh thiếp doanh nghiệp, hộp thư kết nối và danh bạ đối tác B2B toàn cầu của bạn." },
      { property: "og:title", content: "Đăng nhập tài khoản doanh nghiệp — GlobalBiz.Connect" },
      { property: "og:description", content: "Đăng nhập để quản lý danh thiếp doanh nghiệp, hộp thư kết nối và danh bạ đối tác B2B toàn cầu." },
      { property: "og:url", content: "https://earth-biz-link.lovable.app/login" },
    ],
    links: [{ rel: "canonical", href: "https://earth-biz-link.lovable.app/login" }],
  }),

});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Đăng nhập thành công!");
      navigate({ to: "/dashboard" });
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Đăng nhập Google thất bại");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold">Chào mừng trở lại</h1>
            <p className="text-muted-foreground mt-2">Đăng nhập để quản lý doanh nghiệp của bạn</p>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 shadow-card">
            <Button
              type="button" variant="outline" onClick={handleGoogle}
              className="w-full mb-4 h-11 gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
              Tiếp tục với Google
            </Button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-2 bg-card text-muted-foreground">hoặc</span></div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@congty.com" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Link to="/reset-password" className="text-xs text-primary hover:underline">Quên mật khẩu?</Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink gap-2">
                <Sparkles className="w-4 h-4" /> {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Chưa có tài khoản? <Link to="/signup" className="text-primary font-medium hover:underline">Đăng ký miễn phí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
