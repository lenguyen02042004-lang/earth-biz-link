import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Handshake, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable";
import { getMyPersonalProfile, upsertMyPersonalProfile } from "@/lib/personal-card";
import { connectAndExchange, type UnlockedContact } from "@/lib/connect";

interface Props {
  businessId: string;
  businessName: string;
  source: "qr" | "manual";
  onClose: () => void;
  onConnected: (data: UnlockedContact) => void;
}

type Step = "loading" | "auth" | "profile" | "connecting";

export function ConnectDialog({ businessId, businessName, source, onClose, onConnected }: Props) {
  const { user, loading } = useAuth();
  const [step, setStep] = useState<Step>("loading");
  const [form, setForm] = useState({ full_name: "", job_title: "", company_name: "", phone: "" });
  const [busy, setBusy] = useState(false);

  const doConnect = async () => {
    setStep("connecting");
    const res = await connectAndExchange(businessId, source);
    if (!res.ok) {
      toast.error(res.reason === "auth" ? "Vui lòng đăng nhập" : res.message || "Không kết nối được");
      setStep(res.reason === "auth" ? "auth" : "profile");
      return;
    }
    toast.success(`Đã kết nối với ${businessName}`, { description: "Liên hệ đã được mở khóa và lưu vào danh bạ của bạn." });
    onConnected(res.data);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { setStep("auth"); return; }
    let cancelled = false;
    getMyPersonalProfile().then((p) => {
      if (cancelled) return;
      if (p) doConnect();
      else {
        setForm((f) => ({ ...f, full_name: (user.user_metadata?.display_name as string) || "", }));
        setStep("profile");
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Đăng nhập Google thất bại");
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error("Vui lòng nhập họ tên"); return; }
    setBusy(true);
    const res = await upsertMyPersonalProfile({
      full_name: form.full_name.trim(),
      job_title: form.job_title.trim(),
      company_name: form.company_name.trim(),
      phone: form.phone.trim(),
    });
    setBusy(false);
    if (!res.ok) { toast.error("message" in res ? res.message : "Không lưu được hồ sơ"); return; }
    doConnect();
  };

  const redirectPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-glow p-5 sm:p-6 animate-fade-up">
        <button onClick={onClose} aria-label="Đóng" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-vivid text-white flex items-center justify-center shadow-pink">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg leading-tight">Kết nối giao thương</h2>
            <p className="text-xs text-muted-foreground">với {businessName}</p>
          </div>
        </div>

        {(step === "loading" || step === "connecting") && (
          <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            {step === "connecting" ? "Đang trao đổi danh thiếp…" : "Đang kiểm tra…"}
          </div>
        )}

        {step === "auth" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Đăng nhập nhanh để mở khóa liên hệ đầy đủ. Danh thiếp của bạn sẽ được gửi lại cho doanh nghiệp.
            </p>
            <Button onClick={handleGoogle} className="w-full h-11 gap-2 bg-gradient-vivid text-white border-0 shadow-pink">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.25 1.4-1.6 4.1-5.35 4.1a6.1 6.1 0 1 1 0-12.2c1.75 0 2.9.75 3.55 1.4l2.4-2.3A9.7 9.7 0 0 0 12 2.2a9.8 9.8 0 1 0 0 19.6c5.65 0 9.4-3.95 9.4-9.55 0-.65-.05-1.1-.05-1.15Z"/></svg>
              Tiếp tục với Google
            </Button>
            <Link to="/login" search={{ redirect: redirectPath } as any} className="block">
              <Button variant="outline" className="w-full h-11 gap-2"><LogIn className="w-4 h-4" /> Đăng nhập bằng email</Button>
            </Link>
          </div>
        )}

        {step === "profile" && (
          <form onSubmit={submitProfile} className="space-y-3">
            <p className="text-sm text-muted-foreground">Lần đầu kết nối — cho doanh nghiệp biết bạn là ai (chỉ 4 ô, làm một lần).</p>
            <div className="space-y-1.5">
              <Label>Họ tên *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nguyễn Văn A" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Chức vụ</Label>
                <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="Giám đốc mua hàng" />
              </div>
              <div className="space-y-1.5">
                <Label>Công ty</Label>
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Công ty ABC" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>SĐT / Zalo</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xx xxx xxx" inputMode="tel" />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-11 gap-2 bg-gradient-vivid text-white border-0 shadow-pink">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />} Xác nhận kết nối
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
