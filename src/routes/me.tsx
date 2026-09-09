import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { getMyPersonalProfile, upsertMyPersonalProfile, type PersonalProfile } from "@/lib/personal-card";
import { toast } from "sonner";
import { Loader2, Save, Eye, Printer, Share2, Copy } from "lucide-react";

export const Route = createFileRoute("/me")({
  component: MePage,
  head: () => ({
    meta: [
      { title: "Danh thiếp cá nhân — GlobalBiz.Connect" },
      { name: "description", content: "Tạo và quản lý danh thiếp cá nhân với mã QR riêng, chia sẻ một chạm tại triển lãm." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const EMPTY = { full_name: "", job_title: "", company_name: "", phone: "", zalo: "", email: "", avatar_url: "", facebook_url: "", linkedin_url: "", is_public: true };

function MePage() {
  const [form, setForm] = useState(EMPTY);
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [qr, setQr] = useState("");
  const [userId, setUserId] = useState("");

  const publicUrl = profile && typeof window !== "undefined" ? `${window.location.origin}/p/${profile.slug}` : "";

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthed(false); setLoading(false); return; }
      setAuthed(true);
      setUserId(user.id);
      const p = await getMyPersonalProfile();
      if (p) {
        setProfile(p);
        setForm({
          full_name: p.full_name, job_title: p.job_title ?? "", company_name: p.company_name ?? "", phone: p.phone ?? "",
          zalo: p.zalo ?? "", email: p.email ?? "", avatar_url: p.avatar_url ?? "", facebook_url: p.facebook_url ?? "",
          linkedin_url: p.linkedin_url ?? "", is_public: p.is_public,
        });
      } else {
        setForm((f) => ({ ...f, email: user.email ?? "" }));
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(`${publicUrl}?src=qr`, { margin: 1, width: 240, color: { dark: "#c8102e", light: "#ffffff" } }).then(setQr);
  }, [publicUrl]);

  const save = async () => {
    if (!form.full_name.trim()) { toast.error("Vui lòng nhập họ tên"); return; }
    setSaving(true);
    const res = await upsertMyPersonalProfile(form);
    setSaving(false);
    if (!res.ok) { toast.error("message" in res ? res.message : "Không lưu được"); return; }
    setProfile(res.profile);
    toast.success("Đã lưu danh thiếp cá nhân");
  };

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const copy = async () => { await navigator.clipboard.writeText(publicUrl); toast.success("Đã sao chép liên kết"); };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: form.full_name, url: publicUrl }); } catch {} } else copy();
  };

  return (
    <DashboardShell
      title="Danh thiếp cá nhân"
      subtitle="Card visit online của riêng bạn — dùng để trao đổi tại triển lãm, hội thảo."
      maxWidth="5xl"
      actions={
        <>
          {profile && (
            <>
              <Link to="/p/$slug" params={{ slug: profile.slug }}><Button variant="outline" size="sm" className="gap-1.5"><Eye className="w-4 h-4" /> Xem</Button></Link>
              <Link to="/print/$type/$slug" params={{ type: "personal", slug: profile.slug }}><Button variant="outline" size="sm" className="gap-1.5"><Printer className="w-4 h-4" /> Xuất bản in</Button></Link>
            </>
          )}
          <Button onClick={save} disabled={saving || loading} size="sm" className="gap-1.5 bg-gradient-vivid text-white border-0 shadow-pink">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu
          </Button>
        </>
      }
    >
      {loading ? <p className="text-muted-foreground">Đang tải…</p> : authed === false ? (
        <div className="text-center py-16"><Link to="/login"><Button>Đăng nhập</Button></Link></div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-start gap-4">
              <ImageUpload
                bucket="avatars"
                userId={userId}
                value={form.avatar_url || null}
                onChange={(url) => setForm({ ...form, avatar_url: url ?? "" })}
                label="Ảnh đại diện"
                aspect="square"
                className="w-24"
              />
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2"><Label>Họ tên *</Label><Input value={form.full_name} onChange={set("full_name")} /></div>
                <div className="space-y-1.5"><Label>Chức vụ</Label><Input value={form.job_title} onChange={set("job_title")} /></div>
                <div className="space-y-1.5"><Label>Công ty</Label><Input value={form.company_name} onChange={set("company_name")} /></div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Điện thoại</Label><Input value={form.phone} onChange={set("phone")} inputMode="tel" /></div>
              <div className="space-y-1.5"><Label>Zalo</Label><Input value={form.zalo} onChange={set("zalo")} placeholder="Mặc định = số điện thoại" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Email</Label><Input value={form.email} onChange={set("email")} type="email" /></div>
              <div className="space-y-1.5"><Label>Facebook</Label><Input value={form.facebook_url} onChange={set("facebook_url")} placeholder="https://facebook.com/…" /></div>
              <div className="space-y-1.5"><Label>LinkedIn</Label><Input value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://linkedin.com/in/…" /></div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">Công khai danh thiếp</p>
                <p className="text-xs text-muted-foreground">Ai có link/QR đều xem được. Tắt để ẩn tạm thời.</p>
              </div>
              <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border bg-card">
              <div className="bg-gradient-vivid text-white p-4 flex items-center gap-3">
                {form.avatar_url ? <img src={form.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white/80" /> : <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">{(form.full_name || "?").slice(0, 1)}</div>}
                <div className="min-w-0">
                  <p className="font-bold leading-tight truncate">{form.full_name || "Họ tên của bạn"}</p>
                  <p className="text-xs text-white/85 truncate">{[form.job_title, form.company_name].filter(Boolean).join(" · ") || "Chức vụ · Công ty"}</p>
                </div>
              </div>
              <div className="p-4 text-center">
                {qr ? (
                  <>
                    <img src={qr} alt="QR danh thiếp cá nhân" className="w-40 h-40 mx-auto rounded-xl bg-white p-1 border border-border" />
                    <p className="text-[11px] text-muted-foreground mt-2 break-all">{publicUrl.replace(/^https?:\/\//, "")}</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={copy}><Copy className="w-3.5 h-3.5" /> Sao chép</Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={share}><Share2 className="w-3.5 h-3.5" /> Chia sẻ</Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-6">Lưu danh thiếp để nhận mã QR riêng.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}
