import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ImageUpload, GalleryUpload } from "@/components/ImageUpload";
import { GeocodeField } from "@/components/GeocodeField";
import { INDUSTRY_LIST, COUNTRY_LIST } from "@/lib/constants";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import { slugify } from "@/lib/upload";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Save, Eye, Sparkles, Loader2,
  Building2, MapPin as MapPinIcon, Phone, Link2, Images, CheckCircle2,
} from "lucide-react";

type SearchParams = { id?: string };

export const Route = createFileRoute("/business/edit")({
  component: EditBusinessPage,
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
});

type Industry = { id: string; name: string; slug: string };

type FormState = {
  id: string | null;
  name: string;
  slug: string;
  short_intro: string;
  industry_id: string | null;
  logo_url: string | null;
  banner_url: string | null;
  address: string;
  province: string | null;
  country_code: string | null;
  lat: number | null;
  lng: number | null;
  phone: string;
  email: string;
  website: string;
  status: "draft" | "public";
  socials: Record<string, string>;
  gallery: string[];
};

const EMPTY: FormState = {
  id: null, name: "", slug: "", short_intro: "", industry_id: null,
  logo_url: null, banner_url: null,
  address: "", province: null, country_code: null, lat: null, lng: null,
  phone: "", email: "", website: "",
  status: "draft", socials: {}, gallery: [],
};

const STEPS = [
  { key: "basic", label: "Cơ bản", icon: Building2 },
  { key: "location", label: "Địa chỉ", icon: MapPinIcon },
  { key: "contact", label: "Liên hệ", icon: Phone },
  { key: "social", label: "Mạng xã hội", icon: Link2 },
  { key: "media", label: "Hình ảnh", icon: Images },
  { key: "review", label: "Xem & Xuất bản", icon: CheckCircle2 },
] as const;

function EditBusinessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useSearch({ from: "/business/edit" });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [step, setStep] = useState(0);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  // Load industries
  useEffect(() => {
    supabase.from("industries").select("id, name, slug").order("name").then(({ data }) => {
      if (data && data.length > 0) setIndustries(data);
      else setIndustries(INDUSTRY_LIST.map((i, idx) => ({ id: `local-${idx}`, name: i.name, slug: i.slug })));
    });
  }, []);

  // Load existing business
  useEffect(() => {
    if (!id || !user) return;
    setLoading(true);
    (async () => {
      const { data: biz } = await supabase.from("businesses").select("*").eq("id", id).eq("owner_id", user.id).single();
      if (!biz) {
        toast.error("Không tìm thấy doanh nghiệp");
        navigate({ to: "/dashboard" });
        return;
      }
      const [{ data: socials }, { data: gallery }] = await Promise.all([
        supabase.from("business_socials").select("platform, url").eq("business_id", id),
        supabase.from("business_gallery").select("image_url").eq("business_id", id).order("order_index"),
      ]);
      setForm({
        id: biz.id,
        name: biz.name, slug: biz.slug,
        short_intro: biz.short_intro ?? "",
        industry_id: biz.industry_id,
        logo_url: biz.logo_url, banner_url: biz.banner_url,
        address: biz.address ?? "", province: biz.province, country_code: biz.country_code,
        lat: biz.lat, lng: biz.lng,
        phone: biz.phone ?? "", email: biz.email ?? "", website: biz.website ?? "",
        status: biz.status as "draft" | "public",
        socials: Object.fromEntries((socials ?? []).map((s) => [s.platform, s.url])),
        gallery: (gallery ?? []).map((g) => g.image_url),
      });
      setLoading(false);
    })();
  }, [id, user, navigate]);

  // Auto-generate slug from name when blank
  useEffect(() => {
    if (!form.id && form.name && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }));
    }
  }, [form.name, form.id, form.slug]);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </div>
    );
  }

  const save = async (publish: boolean) => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên doanh nghiệp");
      setStep(0);
      return;
    }
    setSaving(true);
    const payload = {
      owner_id: user.id,
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      short_intro: form.short_intro || null,
      industry_id: form.industry_id && !form.industry_id.startsWith("local-") ? form.industry_id : null,
      logo_url: form.logo_url, banner_url: form.banner_url,
      address: form.address || null, province: form.province, country_code: form.country_code,
      lat: form.lat, lng: form.lng,
      phone: form.phone || null, email: form.email || null, website: form.website || null,
      status: publish ? "public" as const : form.status,
    };

    let bizId = form.id;
    if (bizId) {
      const { error } = await supabase.from("businesses").update(payload).eq("id", bizId);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("businesses").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      bizId = data.id;
    }

    // Replace socials
    await supabase.from("business_socials").delete().eq("business_id", bizId);
    const socialRows = Object.entries(form.socials)
      .filter(([, url]) => url.trim())
      .map(([platform, url]) => ({ business_id: bizId!, platform, url }));
    if (socialRows.length) await supabase.from("business_socials").insert(socialRows);

    // Replace gallery
    await supabase.from("business_gallery").delete().eq("business_id", bizId);
    if (form.gallery.length) {
      await supabase.from("business_gallery").insert(
        form.gallery.map((image_url, order_index) => ({ business_id: bizId!, image_url, order_index })),
      );
    }

    setSaving(false);
    toast.success(publish ? "Đã xuất bản!" : "Đã lưu bản nháp");
    navigate({ to: "/dashboard" });
  };

  const stepKey = STEPS[step].key;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-16">
        <div className="mb-6 animate-fade-up">
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            {form.id ? "Chỉnh sửa danh thiếp" : "Tạo danh thiếp mới"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Hoàn thành các bước để xuất bản lên bản đồ.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(i)}
                className={`flex flex-col items-center gap-1 flex-1 min-w-[64px] ${active ? "text-primary" : done ? "text-foreground/80" : "text-muted-foreground"}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-smooth
                  ${active ? "border-primary bg-primary text-primary-foreground shadow-pink" :
                    done ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-card"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium">{s.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-card space-y-5">
          {stepKey === "basic" && (
            <>
              <div>
                <Label htmlFor="name">Tên doanh nghiệp *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Công ty TNHH ABC" />
              </div>
              <div>
                <Label htmlFor="slug">Đường dẫn (slug)</Label>
                <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="cong-ty-abc" />
                <p className="text-xs text-muted-foreground mt-1">URL: /b/{form.slug || "cong-ty-abc"}</p>
              </div>
              <div>
                <Label htmlFor="intro">Giới thiệu ngắn</Label>
                <Textarea id="intro" rows={3} maxLength={240}
                  value={form.short_intro} onChange={(e) => setForm({ ...form, short_intro: e.target.value })}
                  placeholder="Mô tả ngắn gọn về doanh nghiệp của bạn (tối đa 240 ký tự)" />
                <p className="text-xs text-muted-foreground text-right mt-1">{form.short_intro.length}/240</p>
              </div>
              <div>
                <Label>Ngành nghề</Label>
                <Select value={form.industry_id ?? ""} onValueChange={(v) => setForm({ ...form, industry_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn ngành nghề" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {industries.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {stepKey === "location" && (
            <>
              <GeocodeField
                value={{ address: form.address, lat: form.lat, lng: form.lng, country_code: form.country_code, province: form.province }}
                onChange={(v) => setForm({ ...form, ...v })}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Quốc gia</Label>
                  <Select value={form.country_code ?? ""} onValueChange={(v) => setForm({ ...form, country_code: v })}>
                    <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {COUNTRY_LIST.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="inline-flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted">{c.code}</span>
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="province">Tỉnh/Thành phố</Label>
                  <Input id="province" value={form.province ?? ""} onChange={(e) => setForm({ ...form, province: e.target.value })} />
                </div>
              </div>
            </>
          )}

          {stepKey === "contact" && (
            <>
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+84 ..." />
              </div>
              <div>
                <Label htmlFor="email">Email công khai</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@congty.com" />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://congty.com" />
              </div>
            </>
          )}

          {stepKey === "social" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Nhập đường dẫn cho các nền tảng bạn sử dụng. Để trống nếu không có.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {SOCIAL_PLATFORMS.map((p) => (
                  <div key={p.key}>
                    <Label className="text-xs">{p.name}</Label>
                    <Input
                      value={form.socials[p.key] ?? ""}
                      onChange={(e) => setForm({ ...form, socials: { ...form.socials, [p.key]: e.target.value } })}
                      placeholder={p.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {stepKey === "media" && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <ImageUpload bucket="business-logos" userId={user.id}
                  value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })}
                  label="Logo (vuông)" aspect="square" />
                <ImageUpload bucket="business-banners" userId={user.id}
                  value={form.banner_url} onChange={(url) => setForm({ ...form, banner_url: url })}
                  label="Ảnh bìa (3:1)" aspect="wide" />
              </div>
              <GalleryUpload userId={user.id}
                value={form.gallery} onChange={(urls) => setForm({ ...form, gallery: urls })} />
            </div>
          )}

          {stepKey === "review" && (
            <div className="space-y-4">
              {/* Preview card */}
              <div className="relative rounded-3xl border border-border overflow-hidden bg-background">
                <div className="h-28 bg-gradient-vivid relative">
                  {form.banner_url && <img src={form.banner_url} alt="" className="w-full h-full object-cover mix-blend-overlay opacity-80" />}
                </div>
                <div className="p-5 -mt-8">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="" className="w-16 h-16 rounded-full border-4 border-card bg-white object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-4 border-card bg-muted flex items-center justify-center text-muted-foreground">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <h3 className="font-bold text-lg mt-2">{form.name || "Tên doanh nghiệp"}</h3>
                  {form.short_intro && <p className="text-sm text-muted-foreground mt-1">{form.short_intro}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.country_code && <Badge variant="secondary">{form.country_code}</Badge>}
                    {form.industry_id && industries.find((i) => i.id === form.industry_id) && (
                      <Badge variant="secondary">{industries.find((i) => i.id === form.industry_id)!.name}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/50 p-4 text-sm space-y-1">
                <p><strong>Trạng thái:</strong> {form.status === "public" ? "Công khai" : "Bản nháp"}</p>
                <p><strong>Tọa độ:</strong> {form.lat !== null && form.lng !== null ? `${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}` : "Chưa có"}</p>
                <p><strong>Mạng xã hội:</strong> {Object.values(form.socials).filter(Boolean).length} liên kết</p>
                <p><strong>Thư viện:</strong> {form.gallery.length} ảnh</p>
              </div>

              {form.id && form.status === "public" && (
                <Link to="/b/$slug" params={{ slug: form.slug }}>
                  <Button variant="outline" className="w-full gap-2"><Eye className="w-4 h-4" /> Xem trang công khai</Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="gap-1 bg-gradient-vivid text-white border-0 shadow-pink">
              Tiếp theo <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => save(false)} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu bản nháp
              </Button>
              <Button onClick={() => save(true)} disabled={saving} className="gap-2 bg-gradient-vivid text-white border-0 shadow-pink">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Xuất bản
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
