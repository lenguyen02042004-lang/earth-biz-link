import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { getPersonalBySlug } from "@/lib/personal-public.functions";
import { Phone, Mail, MessageCircle, Download, Share2, Printer, Facebook, Linkedin, Send } from "lucide-react";
import { toast } from "sonner";
import { SendCardDialog } from "@/components/SendCardDialog";

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
  const [showSend, setShowSend] = useState(false);

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Mesh-like Background */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-rose-500/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
      
      <Navbar />
      
      <main className="relative pt-24 pb-16 px-4 z-10">
        <article className="max-w-sm mx-auto rounded-[2.5rem] overflow-hidden border border-white/20 bg-card/40 backdrop-blur-xl shadow-2xl relative">
          
          {/* Glass Header */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-vivid opacity-90" />
          <div className="absolute top-0 left-0 right-0 h-40 bg-white/10 backdrop-blur-md border-b border-white/20" />
          
          <div className="relative pt-12 pb-6 px-6 flex flex-col items-center text-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={`Ảnh đại diện của ${profile.full_name}`} className="w-28 h-28 rounded-full object-cover border-4 border-background/80 shadow-2xl z-10 transition-transform hover:scale-105 duration-500" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-white/20 border-4 border-background/80 backdrop-blur-sm shadow-2xl flex items-center justify-center text-4xl font-bold text-white z-10">
                {profile.full_name.slice(0, 1)}
              </div>
            )}
            
            <div className="mt-5 w-full">
              <h1 className="text-2xl font-display font-bold leading-tight text-foreground tracking-tight">{profile.full_name}</h1>
              <p className="text-sm font-medium text-muted-foreground mt-1.5">
                {[profile.job_title, profile.company_name].filter(Boolean).join(" tại ")}
              </p>
            </div>
          </div>

          <div className="px-6 py-4 space-y-3">
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 border border-white/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold text-sm tracking-wide">{profile.phone}</span>
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 border border-white/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold text-sm truncate">{profile.email}</span>
              </a>
            )}
            {zalo && (
              <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-sm text-blue-700 dark:text-blue-400">Chat Zalo</span>
              </a>
            )}
            <div className="flex gap-3 pt-2">
              {profile.facebook_url && (
                <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center h-12 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-blue-50 hover:text-blue-600 border border-white/20 transition-all duration-300 shadow-sm">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center h-12 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-blue-50 hover:text-blue-700 border border-white/20 transition-all duration-300 shadow-sm">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              <Link to="/print/$type/$slug" params={{ type: "personal", slug }} className="flex-1 flex justify-center items-center h-12 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-gray-800 border border-white/20 transition-all duration-300 shadow-sm" title="In thẻ / Bảng QR">
                <Printer className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={saveVcf} variant="outline" className="h-12 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur border-white/20 shadow-sm hover:shadow transition-all">
                <Download className="w-4 h-4 mr-2 text-primary" /> Lưu VCF
              </Button>
              <Button onClick={share} variant="outline" className="h-12 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur border-white/20 shadow-sm hover:shadow transition-all">
                <Share2 className="w-4 h-4 mr-2 text-primary" /> Chia sẻ
              </Button>
            </div>
            <Button onClick={() => setShowSend(true)} className="w-full h-14 rounded-2xl bg-gradient-vivid text-white shadow-pink hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-base font-semibold border-0">
              <Send className="w-5 h-5 mr-2" /> Gửi danh thiếp cho tôi
            </Button>
          </div>
          
          <div className="border-t border-white/10 p-6 bg-black/5 dark:bg-white/5 text-center">
            {qr ? (
              <img src={qr} alt="QR Code" className="w-32 h-32 mx-auto rounded-2xl bg-white p-2 shadow-inner border border-border/50" />
            ) : (
              <div className="w-32 h-32 mx-auto rounded-2xl bg-black/10 animate-pulse" />
            )}
            <p className="text-xs text-muted-foreground mt-4 font-medium tracking-wide">Quét mã để mở danh thiếp này</p>
          </div>
        </article>
      </main>

      {showSend && (
        <SendCardDialog 
          toId={profile.user_id} 
          toName={profile.full_name} 
          toType="personal" 
          onClose={() => setShowSend(false)} 
        />
      )}
    </div>
  );
}
