import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { getPersonalBySlug } from "@/lib/personal-public.functions";
import { Phone, Mail, MessageCircle, Download, Share2, Printer, Facebook, Linkedin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const { profile } = await getPersonalBySlug({ data: { slug: params.slug } });
    if (!profile) throw notFound();
    return { profile };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const title = p ? `${p.full_name}${p.job_title ? ` — ${p.job_title}` : ""} | Danh thiếp cá nhân` : "Danh thiếp cá nhân";
    const desc = p
      ? `Danh thiếp online của ${p.full_name}${p.company_name ? ` tại ${p.company_name}` : ""}. Lưu liên hệ, gọi, nhắn Zalo chỉ với một chạm.`
      : "Danh thiếp cá nhân online.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: PublicPersonalCard,
});

function esc(v: string) {
  return (v ?? "").replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function PublicPersonalCard() {
  const { profile } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const [qr, setQr] = useState("");

  const url = typeof window !== "undefined" ? `${window.location.origin}/p/${slug}` : "";

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(`${url}?src=qr`, { margin: 1, width: 260, color: { dark: "#c8102e", light: "#ffffff" } }).then(setQr);
  }, [url]);

  const saveVcf = () => {
    const lines = [
      "BEGIN:VCARD", "VERSION:3.0",
      `FN:${esc(profile.full_name)}`,
      profile.company_name ? `ORG:${esc(profile.company_name)}` : "",
      profile.job_title ? `TITLE:${esc(profile.job_title)}` : "",
      profile.phone ? `TEL;TYPE=CELL:${esc(profile.phone)}` : "",
      profile.email ? `EMAIL:${esc(profile.email)}` : "",
      url ? `URL:${esc(url)}` : "",
      "END:VCARD",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([lines], { type: "text/vcard;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}.vcf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: profile.full_name, url }); return; } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(url);
    toast.success("Đã sao chép liên kết");
  };

  const zalo = (profile.zalo || profile.phone || "").replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-md mx-auto rounded-3xl overflow-hidden border border-border bg-card shadow-lg">
          <div className="bg-gradient-vivid text-white p-6 flex items-center gap-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={`Ảnh đại diện của ${profile.full_name}`} className="w-20 h-20 rounded-full object-cover border-2 border-white/80" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">{profile.full_name.slice(0, 1)}</div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-display font-bold leading-tight">{profile.full_name}</h1>
              <p className="text-sm text-white/90">{[profile.job_title, profile.company_name].filter(Boolean).join(" · ")}</p>
            </div>
          </div>

          <div className="p-5 space-y-2 text-sm">
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-2 hover:text-primary"><Phone className="w-4 h-4 text-primary" />{profile.phone}</a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 hover:text-primary break-all"><Mail className="w-4 h-4 text-primary" />{profile.email}</a>
            )}
            {(profile.facebook_url || profile.linkedin_url) && (
              <div className="flex gap-2 pt-1">
                {profile.facebook_url && <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Button variant="outline" size="icon" className="h-9 w-9"><Facebook className="w-4 h-4" /></Button></a>}
                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Button variant="outline" size="icon" className="h-9 w-9"><Linkedin className="w-4 h-4" /></Button></a>}
              </div>
            )}
          </div>

          <div className="px-5 pb-5 text-center">
            {qr && <img src={qr} alt="Mã QR danh thiếp" className="w-40 h-40 mx-auto rounded-xl bg-white p-1 border border-border" />}
          </div>

          <div className="p-4 border-t border-border grid grid-cols-2 gap-2">
            <Button onClick={saveVcf} className="gap-1.5 bg-gradient-vivid text-white border-0"><Download className="w-4 h-4" /> Lưu danh bạ</Button>
            {zalo ? (
              <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full gap-1.5"><MessageCircle className="w-4 h-4" /> Zalo</Button></a>
            ) : (
              <Button variant="outline" onClick={share} className="gap-1.5"><Share2 className="w-4 h-4" /> Chia sẻ</Button>
            )}
            <Button variant="outline" onClick={share} className="gap-1.5"><Share2 className="w-4 h-4" /> Chia sẻ</Button>
            <Link to="/print/$type/$slug" params={{ type: "personal", slug }}>
              <Button variant="outline" className="w-full gap-1.5"><Printer className="w-4 h-4" /> In</Button>
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
