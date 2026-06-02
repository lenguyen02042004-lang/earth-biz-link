import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
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
  Save, Eye, Sparkles, Loader2, Plus, Trash2,
  Building2, MapPin as MapPinIcon, Phone, Link2, Images, Award, FileText, CheckCircle2,
} from "lucide-react";

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
      const { data: biz, error } = await supabase.from("businesses").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
      if (error || !biz) {
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </div>
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
      owner_id: user.id,
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              {form.id ? "Chỉnh sửa danh thiếp" : "Tạo danh thiếp mới"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Quản lý thông tin doanh nghiệp theo từng mục bên dưới.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={form.status === "public" ? "default" : "secondary"} className={form.status === "public" ? "bg-primary" : ""}>
              {form.status === "public" ? "Công khai" : "Bản nháp"}
            </Badge>
            <Button variant="outline" onClick={() => save(false)} disabled={saving} size="sm" className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu nháp
            </Button>
            <Button onClick={() => save(true)} disabled={saving} size="sm" className="gap-1.5 bg-gradient-vivid text-white border-0 shadow-pink">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Xuất bản
            </Button>
          </div>
        </div>

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

            <TabsContent value="review" className="space-y-4 mt-0">
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
                <p><strong>Mô tả chi tiết:</strong> {form.description ? `${form.description.length} ký tự` : "Chưa có"}</p>
                <p><strong>Chứng nhận:</strong> {form.certifications.length} mục</p>
                <p><strong>Mạng xã hội:</strong> {Object.values(form.socials).filter(Boolean).length} liên kết</p>
                <p><strong>Thư viện:</strong> {form.gallery.length} ảnh</p>
              </div>

              {form.id && form.status === "public" && (
                <Link to="/b/$slug" params={{ slug: form.slug }}>
                  <Button variant="outline" className="w-full gap-2"><Eye className="w-4 h-4" /> Xem trang công khai</Button>
                </Link>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
