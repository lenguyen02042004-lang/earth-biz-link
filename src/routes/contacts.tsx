import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Trash2, Phone, Mail, Globe, MapPin, Building2 } from "lucide-react";

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
  head: () => ({
    meta: [
      { title: "Danh bạ doanh nghiệp đã lưu — GlobalBiz.Connect" },
      { name: "description", content: "Danh bạ các doanh nghiệp bạn đã lưu — tra cứu, tìm kiếm nhanh theo tên, ngành nghề, quốc gia và liên hệ trực tiếp bất cứ lúc nào." },
      { name: "robots", content: "noindex" },
    ],
  }),

});

type SavedContact = {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string | null;
  industry: string | null;
  country_name: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  note: string | null;
  created_at: string;
};

function ContactsPage() {
  const [items, setItems] = useState<SavedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [authed, setAuthed] = useState<boolean | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAuthed(false); setLoading(false); return; }
    setAuthed(true);
    const { data, error } = await supabase
      .from("saved_contacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as SavedContact[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id: string) => {
    const prev = items;
    setItems((s) => s.filter((x) => x.id !== id));
    const { error } = await supabase.from("saved_contacts").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error(error.message);
    } else {
      toast.success("Đã xoá khỏi danh bạ");
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) =>
      [c.business_name, c.industry, c.country_name, c.province, c.email, c.phone, c.note]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(s))
    );
  }, [items, q]);

  return (
    <DashboardShell
      title="Danh bạ doanh nghiệp"
      subtitle="Các doanh nghiệp bạn đã lưu — tìm kiếm và liên hệ nhanh sau này."
    >
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, ngành nghề, quốc gia, email…"
          className="pl-9 h-11"
        />
      </div>

        {loading ? (
          <p className="text-muted-foreground">Đang tải…</p>
        ) : authed === false ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để xem danh bạ.</p>
            <Link to="/login"><Button>Đăng nhập</Button></Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <p className="text-muted-foreground mb-4">
              {items.length === 0 ? "Bạn chưa lưu doanh nghiệp nào." : "Không có kết quả phù hợp."}
            </p>
            {items.length === 0 && (
              <Link to="/explore"><Button>Khám phá doanh nghiệp</Button></Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:shadow-pink transition-smooth">
                <div className="flex items-start gap-3">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={`Logo ${c.business_name}`} className="w-12 h-12 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {c.business_slug ? (
                      <Link to="/b/$slug" params={{ slug: c.business_slug }} className="font-semibold leading-tight hover:text-primary line-clamp-2">
                        {c.business_name}
                      </Link>
                    ) : (
                      <p className="font-semibold leading-tight line-clamp-2">{c.business_name}</p>
                    )}
                    {c.industry && <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.industry}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleRemove(c.id)} title="Xoá khỏi danh bạ" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-1 text-xs text-foreground/80">
                  {(c.province || c.country_name) && (
                    <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{[c.province, c.country_name].filter(Boolean).join(", ")}</span>
                    </p>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 hover:text-primary">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" /><span className="truncate">{c.phone}</span>
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-primary">
                      <Mail className="w-3.5 h-3.5 text-primary shrink-0" /><span className="truncate">{c.email}</span>
                    </a>
                  )}
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
                      <Globe className="w-3.5 h-3.5 text-primary shrink-0" /><span className="truncate">{c.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </DashboardShell>
  );
}
