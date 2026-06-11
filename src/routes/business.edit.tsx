import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ImageUpload, GalleryUpload } from "@/components/ImageUpload";
import { GeocodeField } from "@/components/GeocodeField";
import { INDUSTRY_LIST, COUNTRY_LIST } from "@/lib/constants";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import { slugify } from "@/lib/upload";
import { toast } from "sonner";
import {
  Save, Eye, Sparkles, Loader2, Plus, Trash2, ArrowLeft, ArrowRight,
  Building2, MapPin as MapPinIcon, Phone, Link2, Images, Award, FileText, CheckCircle2,
  Mail, Globe as GlobeIcon,
} from "lucide-react";
import { SocialIconList } from "@/components/SocialIconList";

type SearchParams = { id?: string };

export const Route = createFileRoute("/business/edit")({
  component: EditBusinessPage,
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
});

type Industry = { id: string; name: string; slug: string };
type Certification = { name: string; issuer?: string; year?: number | null; icon?: string };

type FormState = {
  id: string | null;
  name: string;
  slug: string;
  short_intro: string;
  description: string;
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
  certifications: Certification[];
};

const EMPTY: FormState = {
  id: null, name: "", slug: "", short_intro: "", description: "", industry_id: null,
  logo_url: null, banner_url: null,
  address: "", province: null, country_code: null, lat: null, lng: null,
  phone: "", email: "", website: "",
  status: "draft", socials: {}, gallery: [], certifications: [],
};

const TABS = [
  { key: "basic", label: "Tổng quan", icon: Building2 },
  { key: "about", label: "Giới thiệu", icon: FileText },
  { key: "certifications", label: "Chứng nhận", icon: Award },
  { key: "location", label: "Địa chỉ", icon: MapPinIcon },
  { key: "contact", label: "Liên hệ", icon: Phone },
  { key: "social", label: "Mạng xã hội", icon: Link2 },
  { key: "media", label: "Hình ảnh", icon: Images },
  { key: "review", label: "Xuất bản", icon: CheckCircle2 },
] as const;

function EditBusinessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useSearch({ from: "/business/edit" });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("basic");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("industries").select("id, name, slug").order("name").then(({ data }) => {
      if (data && data.length > 0) setIndustries(data);
      else setIndustries(INDUSTRY_LIST.map((i, idx) => ({ id: `local-${idx}`, name: i.name, slug: i.slug })));
    });
  }, []);

  useEffect(() => {
    if (!id || !user) return;
    setLoading(true);
    (async () => {
      // RLS already restricts to owner OR admin — no owner_id filter on client.
      const { data: biz, error } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
      if (error || !biz) {
        toast.error("Không tìm thấy doanh nghiệp hoặc bạn không có quyền");
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
        description: (biz as any).description ?? "",
        industry_id: biz.industry_id,
        logo_url: biz.logo_url, banner_url: biz.banner_url,
        address: biz.address ?? "", province: biz.province, country_code: biz.country_code,
        lat: biz.lat, lng: biz.lng,
        phone: biz.phone ?? "", email: biz.email ?? "", website: biz.website ?? "",
        status: biz.status as "draft" | "public",
        socials: Object.fromEntries((socials ?? []).map((s) => [s.platform, s.url])),
        gallery: (gallery ?? []).map((g) => g.image_url),
        certifications: Array.isArray((biz as any).certifications) ? (biz as any).certifications : [],
      });
      setOwnerId(biz.owner_id);
      setLoading(false);
    })();
  }, [id, user, navigate]);

  useEffect(() => {
    if (!form.id && form.name && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }));
    }
  }, [form.name, form.id, form.slug]);

  if (!user || loading) {
    return (
      <DashboardShell maxWidth="5xl">
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </DashboardShell>
    );
  }

  const save = async (publish: boolean) => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên doanh nghiệp");
      setTab("basic");
      return;
    }
    setSaving(true);
    const payload: any = {
      owner_id: ownerId ?? user.id,
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      short_intro: form.short_intro || null,
      description: form.description || null,
      certifications: form.certifications,
      industry_id: form.industry_id && !form.industry_id.startsWith("local-") ? form.industry_id : null,
      logo_url: form.logo_url, banner_url: form.banner_url,
      address: form.address || null, province: form.province, country_code: form.country_code,
      lat: form.lat, lng: form.lng,
      phone: form.phone || null, email: form.email || null, website: form.website || null,
      status: publish ? "public" : form.status,
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

    await supabase.from("business_socials").delete().eq("business_id", bizId);
    const socialRows = Object.entries(form.socials)
      .filter(([, url]) => url.trim())
      .map(([platform, url]) => ({ business_id: bizId!, platform, url }));
    if (socialRows.length) await supabase.from("business_socials").insert(socialRows);

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

  // Cert helpers
  const addCert = () => setForm((f) => ({ ...f, certifications: [...f.certifications, { name: "", issuer: "", year: null, icon: "🏅" }] }));
  const updateCert = (idx: number, patch: Partial<Certification>) =>
    setForm((f) => ({ ...f, certifications: f.certifications.map((c, i) => i === idx ? { ...c, ...patch } : c) }));
  const removeCert = (idx: number) =>
    setForm((f) => ({ ...f, certifications: f.certifications.filter((_, i) => i !== idx) }));

  return (
    <DashboardShell
      maxWidth="5xl"
      title={form.id ? "Chỉnh sửa danh thiếp" : "Tạo danh thiếp mới"}
      subtitle="Quản lý thông tin doanh nghiệp theo từng mục bên dưới."
      actions={
        <>
          <Badge variant={form.status === "public" ? "default" : "secondary"} className={form.status === "public" ? "bg-primary" : ""}>
            {form.status === "public" ? "Công khai" : "Bản nháp"}
          </Badge>
          <Button variant="outline" onClick={() => save(false)} disabled={saving} size="sm" className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu nháp
          </Button>
          <Button onClick={() => save(true)} disabled={saving} size="sm" className="gap-1.5 bg-gradient-vivid text-white border-0 shadow-pink">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Xuất bản
          </Button>
        </>
      }
    >
      <div>


        <Tabs value={tab} onValueChange={setTab} className="space-y-5">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.key} value={t.key} className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Icon className="w-3.5 h-3.5" /> <span className="text-xs sm:text-sm">{t.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="bg-card border border-border rounded-3xl p-5 sm:p-7 shadow-card">
            <TabsContent value="basic" className="space-y-5 mt-0">
              <div className="grid sm:grid-cols-[1fr_auto] gap-5 items-start">
                <div className="space-y-4">
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
                    <Label>Ngành nghề</Label>
                    <Select value={form.industry_id ?? ""} onValueChange={(v) => setForm({ ...form, industry_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Chọn ngành nghề" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {industries.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ImageUpload bucket="business-logos" userId={user.id}
                  value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })}
                  label="Logo" aspect="square" />
              </div>
            </TabsContent>

            <TabsContent value="about" className="space-y-5 mt-0">
              <div>
                <Label htmlFor="intro">Giới thiệu ngắn (tagline)</Label>
                <Textarea id="intro" rows={2} maxLength={240}
                  value={form.short_intro} onChange={(e) => setForm({ ...form, short_intro: e.target.value })}
                  placeholder="Một câu mô tả ngắn gọn, hiển thị dưới tên doanh nghiệp." />
                <p className="text-xs text-muted-foreground text-right mt-1">{form.short_intro.length}/240</p>
              </div>
              <div>
                <Label htmlFor="description">Nội dung giới thiệu chi tiết</Label>
                <Textarea id="description" rows={10} maxLength={4000}
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Lịch sử, sứ mệnh, sản phẩm/dịch vụ tiêu biểu, đối tác chính, thành tựu nổi bật…" />
                <p className="text-xs text-muted-foreground text-right mt-1">{form.description.length}/4000</p>
              </div>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Chứng nhận & Danh hiệu</p>
                  <p className="text-xs text-muted-foreground">Liệt kê các giải thưởng, chứng chỉ chất lượng, danh hiệu của doanh nghiệp.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addCert} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Thêm
                </Button>
              </div>

              {form.certifications.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <Award className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Chưa có chứng nhận nào.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.certifications.map((c, idx) => (
                    <div key={idx} className="grid grid-cols-[auto_1fr_auto] gap-2 p-3 rounded-xl border border-border bg-accent/30">
                      <Input
                        value={c.icon ?? ""}
                        onChange={(e) => updateCert(idx, { icon: e.target.value })}
                        placeholder="🏅"
                        className="w-14 text-center text-xl"
                        maxLength={2}
                      />
                      <div className="grid sm:grid-cols-[2fr_1.5fr_auto] gap-2">
                        <Input
                          value={c.name}
                          onChange={(e) => updateCert(idx, { name: e.target.value })}
                          placeholder="Tên chứng nhận / danh hiệu *"
                        />
                        <Input
                          value={c.issuer ?? ""}
                          onChange={(e) => updateCert(idx, { issuer: e.target.value })}
                          placeholder="Đơn vị cấp"
                        />
                        <Input
                          type="number"
                          value={c.year ?? ""}
                          onChange={(e) => updateCert(idx, { year: e.target.value ? Number(e.target.value) : null })}
                          placeholder="Năm"
                          className="w-24"
                          min={1900}
                          max={2100}
                        />
                      </div>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeCert(idx)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-0">
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
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-0">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+84 ..." />
                </div>
                <div>
                  <Label htmlFor="email">Email công khai</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@congty.com" />
                </div>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://congty.com" />
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-3 mt-0">
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
            </TabsContent>

            <TabsContent value="media" className="space-y-5 mt-0">
              <ImageUpload bucket="business-banners" userId={user.id}
                value={form.banner_url} onChange={(url) => setForm({ ...form, banner_url: url })}
                label="Ảnh bìa (3:1)" aspect="wide" />
              <GalleryUpload userId={user.id}
                value={form.gallery} onChange={(urls) => setForm({ ...form, gallery: urls })} />
            </TabsContent>

            <TabsContent value="review" className="space-y-5 mt-0">
              {/* Polished public-card preview */}
              <div className="relative rounded-3xl border border-border overflow-hidden bg-card shadow-card">
                <div className="relative h-36 sm:h-44 bg-gradient-vivid">
                  {form.banner_url && (
                    <img src={form.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="px-5 sm:px-7 pb-6 -mt-12 relative">
                  <div className="flex items-end gap-4">
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="" className="w-24 h-24 rounded-2xl border-4 border-card bg-white object-cover shadow-pink" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl border-4 border-card bg-muted flex items-center justify-center text-muted-foreground shadow-pink">
                        <Building2 className="w-9 h-9" />
                      </div>
                    )}
                    <Badge variant={form.status === "public" ? "default" : "secondary"} className={`mb-2 ${form.status === "public" ? "bg-primary" : ""}`}>
                      {form.status === "public" ? "● Công khai" : "● Bản nháp"}
                    </Badge>
                  </div>

                  <h3 className="font-display font-bold text-2xl mt-3">{form.name || "Tên doanh nghiệp"}</h3>
                  {form.short_intro && <p className="text-sm text-muted-foreground mt-1">{form.short_intro}</p>}

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {form.country_code && <Badge variant="secondary" className="gap-1"><MapPinIcon className="w-3 h-3" />{form.country_code}{form.province ? ` · ${form.province}` : ""}</Badge>}
                    {form.industry_id && industries.find((i) => i.id === form.industry_id) && (
                      <Badge variant="secondary"><Building2 className="w-3 h-3 mr-1" />{industries.find((i) => i.id === form.industry_id)!.name}</Badge>
                    )}
                  </div>

                  {/* Contact row */}
                  {(form.phone || form.email || form.website) && (
                    <div className="mt-5 grid sm:grid-cols-2 gap-2 text-sm">
                      {form.phone && <div className="flex items-center gap-2 text-foreground/80"><Phone className="w-4 h-4 text-primary" />{form.phone}</div>}
                      {form.email && <div className="flex items-center gap-2 text-foreground/80"><Mail className="w-4 h-4 text-primary" />{form.email}</div>}
                      {form.website && <div className="flex items-center gap-2 text-foreground/80 truncate"><GlobeIcon className="w-4 h-4 text-primary" />{form.website.replace(/^https?:\/\//, "")}</div>}
                      {form.address && <div className="flex items-center gap-2 text-foreground/80 truncate"><MapPinIcon className="w-4 h-4 text-primary" />{form.address}</div>}
                    </div>
                  )}

                  {/* Description */}
                  {form.description && (
                    <div className="mt-5">
                      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                        <FileText className="w-3.5 h-3.5" /> GIỚI THIỆU
                      </p>
                      <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line line-clamp-6">{form.description}</p>
                    </div>
                  )}

                  {/* Certifications */}
                  {form.certifications.length > 0 && (
                    <div className="mt-5">
                      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                        <Award className="w-3.5 h-3.5" /> CHỨNG NHẬN & DANH HIỆU
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {form.certifications.map((c, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/40 border border-border/60">
                            <div className="text-xl leading-none mt-0.5">{c.icon || "🏅"}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-tight truncate">{c.name || "(chưa đặt tên)"}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {[c.issuer, c.year].filter(Boolean).join(" · ") || "—"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Socials */}
                  {Object.values(form.socials).filter(Boolean).length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-2">KẾT NỐI</p>
                      <SocialIconList socials={form.socials} size="sm" />
                    </div>
                  )}

                  {/* Gallery */}
                  {form.gallery.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-2">THƯ VIỆN</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {form.gallery.slice(0, 5).map((src, i) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist summary */}
              <div className="rounded-2xl bg-muted/40 border border-border p-4 text-sm grid sm:grid-cols-2 gap-x-6 gap-y-1">
                <p className="flex justify-between"><span className="text-muted-foreground">Trạng thái</span><span className="font-medium">{form.status === "public" ? "Công khai" : "Bản nháp"}</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Tọa độ</span><span className="font-medium">{form.lat !== null && form.lng !== null ? `${form.lat.toFixed(3)}, ${form.lng.toFixed(3)}` : "Chưa có"}</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Mô tả chi tiết</span><span className="font-medium">{form.description ? `${form.description.length} ký tự` : "—"}</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Chứng nhận</span><span className="font-medium">{form.certifications.length} mục</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Mạng xã hội</span><span className="font-medium">{Object.values(form.socials).filter(Boolean).length} liên kết</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Thư viện</span><span className="font-medium">{form.gallery.length} ảnh</span></p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => save(true)} disabled={saving} className="flex-1 h-11 gap-2 bg-gradient-vivid text-white border-0 shadow-pink">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {form.status === "public" ? "Cập nhật trang công khai" : "Xuất bản ngay"}
                </Button>
                {form.id && form.status === "public" && (
                  <Link to="/b/$slug" params={{ slug: form.slug }} className="flex-1">
                    <Button variant="outline" className="w-full h-11 gap-2"><Eye className="w-4 h-4" /> Xem trang công khai</Button>
                  </Link>
                )}
              </div>
            </TabsContent>

            {/* Step navigation */}
            <StepNav tab={tab} setTab={setTab} onPublish={() => save(true)} saving={saving} />
          </div>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

function StepNav({ tab, setTab, onPublish, saving }: { tab: string; setTab: (v: string) => void; onPublish: () => void; saving: boolean }) {
  const idx = TABS.findIndex((t) => t.key === tab);
  const prev = idx > 0 ? TABS[idx - 1] : null;
  const next = idx < TABS.length - 1 ? TABS[idx + 1] : null;
  const isLast = tab === "review";

  return (
    <div className="mt-6 pt-5 border-t border-border flex items-center justify-between gap-3">
      <Button
        type="button" variant="outline" size="sm" className="gap-1.5"
        disabled={!prev}
        onClick={() => prev && setTab(prev.key)}
      >
        <ArrowLeft className="w-4 h-4" /> {prev ? prev.label : "Trước"}
      </Button>

      <p className="text-xs text-muted-foreground hidden sm:block">
        Bước {idx + 1} / {TABS.length}
      </p>

      {isLast ? (
        <Button type="button" size="sm" onClick={onPublish} disabled={saving} className="gap-1.5 bg-gradient-vivid text-white border-0 shadow-pink">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Xuất bản
        </Button>
      ) : (
        <Button
          type="button" size="sm" className="gap-1.5"
          onClick={() => next && setTab(next.key)}
        >
          {next?.label} <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
