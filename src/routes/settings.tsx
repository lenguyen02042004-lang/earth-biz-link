import { useEffect, useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import { Loader2, Save, KeyRound, User, Mail } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Cài đặt tài khoản — GlobalBiz.Connect" }] }),
});

function SettingsPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    supabase.from("profiles").select("display_name, avatar_url, email").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setAvatarUrl(data.avatar_url);
        }
      });
  }, [user]);

  if (!user) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="pt-32 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></div>;
  }

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Đã cập nhật hồ sơ");
  };

  const updateEmail = async () => {
    if (!email.trim() || email === user.email) return;
    const { error } = await supabase.auth.updateUser({ email });
    if (error) toast.error(error.message);
    else toast.success("Vui lòng kiểm tra email để xác nhận thay đổi");
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Đã đổi mật khẩu");
      setNewPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto pb-16 space-y-6">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-display font-bold">Cài đặt tài khoản</h1>
          <p className="text-muted-foreground mt-1">Quản lý hồ sơ, email và mật khẩu</p>
        </div>

        {/* Profile */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-card">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><User className="w-4 h-4 text-primary" /> Hồ sơ</h2>
          <div className="grid sm:grid-cols-[160px_1fr] gap-5">
            <ImageUpload
              bucket="avatars" userId={user.id}
              value={avatarUrl} onChange={setAvatarUrl}
              label="Ảnh đại diện" aspect="square"
            />
            <div className="space-y-3">
              <div>
                <Label htmlFor="dn">Tên hiển thị</Label>
                <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
              <Button onClick={saveProfile} disabled={saving} className="gap-2 bg-gradient-vivid text-white border-0 shadow-pink">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-card">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><Mail className="w-4 h-4 text-primary" /> Email đăng nhập</h2>
          <div className="flex gap-2">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={updateEmail} variant="outline" disabled={email === user.email}>Cập nhật</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Sẽ gửi email xác nhận trước khi áp dụng thay đổi.</p>
        </div>

        {/* Password */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-card">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><KeyRound className="w-4 h-4 text-primary" /> Đổi mật khẩu</h2>
          <div className="flex gap-2">
            <Input type="password" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Button onClick={updatePassword} variant="outline" disabled={!newPassword}>Đổi</Button>
          </div>
        </div>

        <div className="pt-2">
          <Link to="/dashboard"><Button variant="ghost">← Về bảng điều khiển</Button></Link>
        </div>
      </div>
    </div>
  );
}
