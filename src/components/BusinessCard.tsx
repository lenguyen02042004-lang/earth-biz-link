import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  MapPin, Phone, Mail, Globe, Eye, Share2, Heart, QrCode, X, Sparkles, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialIconList } from "./SocialIconList";
import { SendCardDialog } from "./SendCardDialog";
import type { DemoBusiness } from "@/lib/mock-businesses";
import { toast } from "sonner";

interface Props {
  business: DemoBusiness;
  onClose: () => void;
}

export function BusinessCard({ business, onClose }: Props) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/b/${business.slug}` : "";

  useEffect(() => {
    if (profileUrl) {
      QRCode.toDataURL(profileUrl, {
        margin: 1,
        color: { dark: "#c8102e", light: "#ffffff" },
        width: 200,
      }).then(setQrUrl);
    }
  }, [profileUrl]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: business.name, text: business.short_intro, url: profileUrl });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Đã sao chép liên kết!");
    }
  };

  const hasSocials = Object.keys(business.socials).length > 0;
  const hasGallery = business.gallery.length > 0;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 animate-fade-up">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-md md:max-w-3xl lg:max-w-4xl
                   max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)]
                   rounded-2xl sm:rounded-3xl bg-card shadow-glow border border-border/40
                   flex flex-col md:flex-row overflow-hidden"
      >
        {/* Close button (absolute, always reachable) */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-smooth"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ===== LEFT (mobile: top) — Identity ===== */}
        <div className="md:w-[42%] md:min-w-[300px] md:flex md:flex-col md:border-r border-border/40 shrink-0">
          {/* Banner */}
          <div className="relative h-24 sm:h-28 md:h-32 bg-gradient-vivid overflow-hidden shrink-0">
            {business.banner_url && (
              <img src={business.banner_url} alt="" className="w-full h-full object-cover mix-blend-overlay opacity-80" />
            )}
            {business.icon_tier === "premium" && (
              <Badge className="absolute top-3 left-3 bg-white/90 text-primary border-0 gap-1">
                <Sparkles className="w-3 h-3" /> Premium
              </Badge>
            )}
          </div>

          {/* Identity block */}
          <div className="px-4 sm:px-5 pb-4 md:pb-5 md:flex-1 md:flex md:flex-col">
            <div className="flex items-end gap-3 -mt-9 sm:-mt-10 mb-2.5">
              <div className={business.icon_tier === "premium" ? "ring-premium" : ""}>
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-card object-cover shadow-pink"
                />
              </div>
              <div className="flex-1 pb-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold leading-tight truncate">{business.name}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Eye className="w-3 h-3" /> {business.views_count.toLocaleString()} lượt xem
                </p>
              </div>
            </div>

            <Badge variant="secondary" className="self-start mb-2.5 bg-accent text-accent-foreground border-0">
              {business.industry}
            </Badge>

            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-3 md:line-clamp-4 mb-3">
              {business.short_intro}
            </p>

            {/* QR (toggle) — fills remaining left column space on desktop */}
            {showQR && qrUrl && (
              <div className="mt-auto flex flex-col items-center p-3 rounded-2xl bg-gradient-to-br from-accent to-secondary">
                <img src={qrUrl} alt="QR" className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-white p-2 shadow-soft" />
                <p className="text-[11px] text-muted-foreground mt-1.5">Quét để mở danh thiếp này</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT (mobile: bottom) — Details + actions ===== */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scroll only this column if absolutely needed; otherwise fits */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 pt-3 md:pt-5 pb-3 space-y-3.5">
            {/* Contact */}
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2 text-foreground/75">
                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span className="leading-snug">{business.address}, {business.province}, {business.country_name}</span>
              </div>
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-foreground/75 hover:text-primary transition-smooth">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{business.phone}</span>
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-foreground/75 hover:text-primary transition-smooth">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{business.email}</span>
                </a>
              )}
              {business.website && (
                <a href={business.website} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-foreground/75 hover:text-primary transition-smooth">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{business.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>

            {hasSocials && (
              <div>
                <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground mb-1.5">KẾT NỐI</p>
                <SocialIconList socials={business.socials} size="sm" />
              </div>
            )}

            {hasGallery && (
              <div>
                <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground mb-1.5">THƯ VIỆN</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {business.gallery.slice(0, 5).map((src, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={src} alt="" className="w-full h-full object-cover hover:scale-110 transition-smooth" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky action bar */}
          <div className="border-t border-border/40 bg-card/95 backdrop-blur px-4 sm:px-5 py-3 flex gap-2 shrink-0">
            <Button onClick={() => setShowSend(true)} className="flex-1 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink h-10">
              <Send className="w-4 h-4 mr-1.5" /> Gửi danh thiếp
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10" title="Theo dõi">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setShowQR(v => !v)} title="QR Code">
              <QrCode className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleShare} title="Chia sẻ">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {showSend && (
        <SendCardDialog toBusinessId={business.id} toBusinessName={business.name} onClose={() => setShowSend(false)} />
      )}
    </div>
  );
}
